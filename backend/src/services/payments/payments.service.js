const { getConnectionDB } = require("../../config/db/connection");
const PaymentsModel = require('../../models/payments/payments.model');
const { generateReceiptPdf } = require('../../utils/generateReceiptPdf');
const { uploadReceipt } = require('../../utils/uploadToStorage');
const { sendReceiptEmail } = require('../../utils/sendEmail');


function generateFolio() {
    return `PAGO-${Date.now()}`;
}


function getCategoryFromMembership(membership) {

    const unit = membership.id_unit_measurement;
    const qty = membership.quantity_members;


    // VISIT
    if (qty === 1 && unit === 1) {
        return 'VISITA';
    }

    // WEEKLY
    if (unit === 2) {
        //return 'SEMANA';
        return 'MENSUAL';
    }

    // MONTHLY (todo lo mensual)
    if (unit === 3) {
        return 'MENSUAL';
    }

    return 'MENSUAL';
}

exports.createPayment = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {

        let {
            id_membership,
            id_gym_branch,
            total_amount,
            discount_amount = 0,
            members = [],
            payment_methods = [],
            notes,
            is_registration = 0,
            registration_price = 0,
            send_mail,
            payment_type,
            payment_method_name,
            name,
            id_user,
            folio
        } = req.body;

        if (!members.length) {
            throw new Error('At least one member is required');
        }

        if(is_registration){
            discount_amount = discount_amount + registration_price;
        }

        
        const paidAmount = payment_methods.reduce((s, p) => s + Number(p.amount), 0);

        const pendingAmount = (total_amount - discount_amount) - paidAmount;

        const status =
            pendingAmount <= 0 ? 'PAGADO' :
            paidAmount > 0 ? 'PARCIAL' : 'PENDIENTE';

        const payment_folio = `PAGO-${Date.now()}`;

        // 💰 CREAR PAGO
        const [result] = await conn.query(`
            INSERT INTO tb_member_payments (
                payment_folio,
                id_membership,
                id_gym_branch,
                total_amount,
                discount_amount,
                paid_amount,
                pending_amount,
                payment_status,
                notes,
                payment_date,
                invoice,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            payment_folio,
            id_membership,
            id_gym_branch,
            total_amount,
            discount_amount,
            paidAmount,
            pendingAmount,
            status,
            notes,
            folio,
            id_user
        ]);

        const id_payment = result.insertId;

        const [[membershipData]] = await conn.query(`
            SELECT 
                id_unit_measurement,
                quantity_members
            FROM cat_memberships
            WHERE id_membership = ?
        `, [id_membership]);

        if (!membershipData) {
            throw new Error('Membership not found');
        }

        // usar datos
        //const { id_unit_measurement, quantity_members } = membershipData;

        const category = getCategoryFromMembership(membershipData);

        const [rowsFolio] = await conn.query(`
            SELECT *
            FROM config_payment_folio_consecutive
            WHERE id_gym_branch = ?
            AND folio_category = ?
            FOR UPDATE
        `, [id_gym_branch, category]);

    if (!rowsFolio.length) {
        throw new Error('Folio category not configured');
    }

    const configFolio = rowsFolio[0];

        await conn.query(`
        UPDATE config_payment_folio_consecutive
        SET current_number = ?, updated_at = NOW()
        WHERE id_payment_folio_consecutive = ?
    `, [folio, configFolio.id_payment_folio_consecutive]);

        // 👥 RELACIÓN CON SOCIOS
        for (const m of members) {
            await conn.query(`
                INSERT INTO rel_payment_members (
                    id_payment,
                    id_member
                )
                VALUES (?, ?)
            `, [
                id_payment,
                m.id_member
            ]);
        }

        // 💳 MÉTODOS DE PAGO
        for (const p of payment_methods) {
            await conn.query(`
                INSERT INTO tb_payment_methods_detail (
                    id_payment,
                    id_payment_method,
                    amount,
                    reference
                )
                VALUES (?, ?, ?, ?)
            `, [
                id_payment,
                p.id_payment_method,
                p.amount,
                p.reference || null
            ]);
        }

        // 📅 OBTENER DURACIÓN DE MEMBRESÍA
        const [[membership]] = await conn.query(`
            SELECT 
                m.duration_value,
                u.value AS unit_days,
                m.membership_name
            FROM cat_memberships m
            INNER JOIN cat_unit_measurement u
                ON u.id_unit_measurement = m.id_unit_measurement
            WHERE m.id_membership = ?
        `, [id_membership]);

        if (!membership) {
            throw new Error('Membership not found');
        }

    // 🔢 cantidad de periodos (ej: 2 meses)
    const quantity = req.body.quantity || 1;

    // 🧮 total de días
    const totalDays = membership.duration_value * membership.unit_days * quantity;
    const membership_name = membership.membership_name;

    // 👥 ACTUALIZAR CADA SOCIO
    let nextPaymentDate = "";
for (const m of members) {

    const [[member]] = await conn.query(`
        SELECT next_payment_date
        FROM tb_members
        WHERE id_member = ?
        FOR UPDATE
    `, [m.id_member]);

    if (!member) {
        throw new Error(`Member not found: ${m.id_member}`);
    }

    let baseDate;
    let isNewMember = !member.next_payment_date; // 👈 CLAVE

    const today = new Date();

    if (!member.next_payment_date) {

        baseDate = new Date();

    } else {

        const nextPaymentDate = new Date(member.next_payment_date);

        // Si la membresía es SEMANA y la fecha ya venció
        if (
            member.membership_name === 'SEMANA' &&
            nextPaymentDate < today
        ) {

            baseDate = new Date();

        } else {

            baseDate = nextPaymentDate;

        }
    }
    /*if (!member.next_payment_date) {
        baseDate = new Date();
    } else {
        baseDate = new Date(member.next_payment_date);
    }*/

    // ➕ nueva fecha
    const newDate = new Date(baseDate);
    newDate.setDate(newDate.getDate() + totalDays);

    const formattedNewDate = newDate.toISOString().split('T')[0];
    nextPaymentDate = [nextPaymentDate, formattedNewDate]
    .filter(Boolean)
    .join(' / ');
    
    // 💾 ACTUALIZAR SOCIO
    await conn.query(`
        UPDATE tb_members
        SET next_payment_date = ?
        WHERE id_member = ?
    `, [
        formattedNewDate,
        m.id_member
    ]);

    // 🧾 GUARDAR HISTORIAL (SOLO SI NO ES NUEVO)
    if (!isNewMember) {

        await conn.query(`
            INSERT INTO tb_member_payment_history (
                id_member,
                id_payment,
                previous_next_payment_date,
                new_next_payment_date,
                days_added,
                id_membership,
                movement_type,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            m.id_member,
            id_payment,
            member.next_payment_date,
            formattedNewDate,
            totalDays,
            id_membership,
            'RENEWAL',
            id_user
        ]);
    }

    // 🆕 OPCIONAL: guardar primer registro si quieres trazabilidad completa
    /*
    else {
        await conn.query(`
            INSERT INTO tb_member_payment_history (
                id_member,
                id_payment,
                previous_next_payment_date,
                new_next_payment_date,
                days_added,
                id_membership,
                movement_type,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            m.id_member,
            id_payment,
            null,
            formattedNewDate,
            totalDays,
            id_membership,
            'NEW',
            id_user
        ]);
    }
    */
}
        await conn.commit();

        
        if (Number(send_mail) === 1) {
            // 📧 obtener datos de socios
            const [membersData] = await conn.query(`
                SELECT email, first_name, first_surname, membership_number
                FROM tb_members
                WHERE id_member IN (${members.map(() => '?').join(',')})
            `, members.map(m => m.id_member));

            const emails = membersData.map(m => m.email).filter(e => e);

            // 👥 nombres
            const membersNames = membersData
            .map(m => `#${m.membership_number} ${m.first_name} ${m.first_surname}`)
            .join(', ');

            // 💳 métodos de pago (puedes mejorar esto con catálogo)
           /* const paymentMethodsText = payment_methods
                .map(p => `Método ${p.id_payment_method}`)
                .join(' / ');*/

            // 📅 usar última fecha calculada
            /*const nextPaymentDate = new Date();
            nextPaymentDate.setDate(nextPaymentDate.getDate() + totalDays);*/

            const paymentMethodsText = payment_methods
            .map(p => p.payment_method_name)
            .join(' / ');

            // 🧾 generar PDF
            const pdfBuffer = await generateReceiptPdf({
                date: new Date().toLocaleDateString(),
                total: total_amount,
                discount: discount_amount,
                members: membersNames,
                concept: membership_name,
                payment_methods: paymentMethodsText,
                next_payment_date: nextPaymentDate,
                status,
                attended_by: name,
                folio: folio,
                //payment_method_name: payment_method_name,
                payment_type: payment_type,
                 is_cancelled: false
            });

            // ☁️ subir a bucket
            const fileName = `${payment_folio}.pdf`;

            const filePath = await uploadReceipt(pdfBuffer, fileName);

            // 💾 guardar ruta en BD
            await conn.query(`
                UPDATE tb_member_payments
                SET payment_receipt_path = ?
                WHERE id_payment = ?
            `, [filePath, id_payment]);

            // 📧 enviar correo
            /*if (emails.length) {
                await sendReceiptEmail(emails, pdfBuffer, payment_folio);
            }*/
        }

        return {
            success: true,
            payment_folio,
            id_payment,
            members_count: members.length,
            status,
            paidAmount,
            pendingAmount
        };

    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.getTodayPayments = async (req) => {

    const { id_gym_branch } = req.params;
    const db = await getConnectionDB();

    const [rows] = await db.query(`
        SELECT 
            p.id_payment,
            p.invoice AS payment_folio,
            GROUP_CONCAT(
                DISTINCT CONCAT(m.membership_number, ' - ', m.first_name, ' ', m.first_surname)
                SEPARATOR ' / '
            ) AS members,
            p.total_amount,
            p.discount_amount,
            p.pending_amount,
            p.paid_amount,
            p.payment_date,
            IF(DATEDIFF(NOW(), p.payment_date) <= 5, 1, 0) AS is_editing,
            p.payment_status,
            GROUP_CONCAT(DISTINCT pm.payment_method_name SEPARATOR ' / ') AS payment_methods,

            u.name AS attended_by

        FROM tb_member_payments p

        LEFT JOIN rel_payment_members rpm 
            ON rpm.id_payment = p.id_payment

        LEFT JOIN tb_members m 
            ON m.id_member = rpm.id_member

        LEFT JOIN tb_payment_methods_detail pmd 
            ON pmd.id_payment = p.id_payment

        LEFT JOIN cat_payment_methods pm 
            ON pm.id_payment_method = pmd.id_payment_method

        LEFT JOIN z_users u 
            ON u.id_user = p.created_by

        WHERE p.id_gym_branch = ?
        AND DATE_FORMAT(
                DATE_SUB(p.payment_date, INTERVAL 6 HOUR),
                '%Y-%m-%d'
            ) >= CURDATE()
        AND DATE_FORMAT(
            DATE_SUB(p.payment_date, INTERVAL 6 HOUR),
            '%Y-%m-%d'
            ) < CURDATE() + INTERVAL 1 DAY
        AND p.payment_status !='CANCELADO'
        GROUP BY p.id_payment
        ORDER BY p.payment_date DESC
    `, [id_gym_branch]);

    return {
        success: true,
        data: rows
    };
};

exports.filterPayments = async (req) => {

    const db = await getConnectionDB();

    const {
        id_gym_branch,
        folio,
        member_name,
        date,
        payment_method
    } = req.body;

    let query = `
        SELECT 
            p.id_payment,
            p.invoice AS payment_folio,
            GROUP_CONCAT(
                DISTINCT CONCAT(m.membership_number, ' - ', m.first_name, ' ', m.first_surname)
                SEPARATOR ' / '
            ) AS members,
            p.total_amount,
            p.discount_amount,
            p.pending_amount,
            p.paid_amount,
            p.payment_date,
            IF(DATEDIFF(NOW(), p.payment_date) <= 5, 1, 0) AS is_editing,
            p.payment_status,
            GROUP_CONCAT(DISTINCT pm.payment_method_name SEPARATOR ' / ') AS payment_methods,

            u.name AS attended_by

        FROM tb_member_payments p

        LEFT JOIN rel_payment_members rpm ON rpm.id_payment = p.id_payment
        LEFT JOIN tb_members m ON m.id_member = rpm.id_member
        LEFT JOIN tb_payment_methods_detail pmd ON pmd.id_payment = p.id_payment
        LEFT JOIN cat_payment_methods pm ON pm.id_payment_method = pmd.id_payment_method
        LEFT JOIN z_users u ON u.id_user = p.created_by

        WHERE p.id_gym_branch = ?  AND p.payment_status !='CANCELADO'
    `;

    const params = [id_gym_branch];

    // 🔍 filtros dinámicos
    if (folio) {
        query += ` AND p.payment_folio LIKE ?`;
        params.push(`%${folio}%`);
    }

    if (member_name) {
        query += ` AND (
            m.first_name LIKE ? OR 
            m.first_surname LIKE ?
        )`;
        params.push(`%${member_name}%`, `%${member_name}%`);
    }

    if (date) {
        query += `
            AND p.payment_date >= ?
            AND p.payment_date < DATE_ADD(?, INTERVAL 1 DAY)
        `;
        params.push(date, date);
    }

    if (payment_method) {
        query += ` AND pm.id_payment_method = ?`;
        params.push(payment_method);
    }

    query += `
        GROUP BY p.id_payment
        ORDER BY p.payment_date DESC
    `;

    const [rows] = await db.query(query, params);

    return {
        success: true,
        data: rows
    };
};


exports.cancelPayment = async (req) => {

    const { id_payment } = req.params;

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();
    await conn.beginTransaction();

    try {

        // 🔍 Obtener pago
        const [[payment]] = await conn.query(`
            SELECT *
            FROM tb_member_payments
            WHERE id_payment = ?
            FOR UPDATE
        `, [id_payment]);

        if (!payment) {
            throw new Error('Payment not found');
        }

        if (payment.payment_status === 'CANCELADO') {
            throw new Error('Payment already cancelled');
        }

        // 👥 Obtener socios
        const [members] = await conn.query(`
            SELECT m.id_member, m.email, m.first_name, m.first_surname
            FROM rel_payment_members rpm
            INNER JOIN tb_members m ON m.id_member = rpm.id_member
            WHERE rpm.id_payment = ?
        `, [id_payment]);

        // 🔄 Revertir fechas por cada socio
        for (const m of members) {

            const [[history]] = await conn.query(`
                SELECT previous_next_payment_date
                FROM tb_member_payment_history
                WHERE id_member = ?
                AND id_payment = ?
                ORDER BY id_member_payment_history DESC
                LIMIT 1
            `, [m.id_member, id_payment]);

            let newDate = null;

            if (history) {
                newDate = history.previous_next_payment_date;
            }

            await conn.query(`
                UPDATE tb_members
                SET next_payment_date = ?
                WHERE id_member = ?
            `, [
                newDate,
                m.id_member
            ]);
        }

        // ❌ CANCELAR PAGO
        await conn.query(`
            UPDATE tb_member_payments
            SET 
                payment_status = 'CANCELADO',
                payment_date = NOW()
            WHERE id_payment = ?
        `, [id_payment]);

        // 🧾 GENERAR PDF CANCELADO

        const membersNames = members
            .map(m => `${m.first_name} ${m.first_surname}`)
            .join(', ');

        const [[membership]] = await conn.query(`
            SELECT 
                membership_name
            FROM cat_memberships m
            JOIN cat_unit_measurement u
                ON u.id_unit_measurement = m.id_unit_measurement
            WHERE m.id_membership = ?
        `, [payment.id_membership]);

        if (!membership) throw new Error('Membership not found');

        const membership_name = membership.membership_name;

        const pdfBuffer = await generateReceiptPdf({
            date: new Date().toLocaleDateString(),
            total: payment.total_amount,
            discount: payment.discount_amount,
            members: membersNames,
            concept:membership_name,
            payment_methods: 'CANCELADO',
            next_payment_date: '---',
            status: 'CANCELADO',
            attended_by: 'SYSTEM',
            folio: payment.invoice,
            payment_type: 'CANCELADO',
             is_cancelled: true
        });

        // ☁️ SUBIR PDF
        const fileName = `${payment.payment_folio}_CANCELLED.pdf`;

        const filePath = await uploadReceipt(pdfBuffer, fileName);

        // 💾 GUARDAR NUEVA RUTA
        await conn.query(`
            UPDATE tb_member_payments
            SET payment_receipt_path = ?
            WHERE id_payment = ?
        `, [filePath, id_payment]);

        await conn.commit();

        // 📧 ENVIAR CORREO
        const emails = members.map(m => m.email).filter(e => e);

        /*if (emails.length) {
            await sendReceiptEmail(emails, pdfBuffer, payment.payment_folio + ' CANCELADO');
        }*/

        return {
            success: true,
            message: 'Payment cancelled successfully',
            id_payment
        };

    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};


exports.updatePayment = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    await conn.beginTransaction();

    try {

        const {
            id_payment,
            id_membership,
            total_amount,
            discount_amount = 0,
            members = [],
            payment_methods = [],
            notes,
            id_user,
            send_mail,
            name,
            payment_type
        } = req.body;

        if (!id_payment) throw new Error('id_payment is required');
        if (!members.length) throw new Error('Members required');

        // ===============================
        // 1. Obtener pago original
        // ===============================
        const [[oldPayment]] = await conn.query(`
            SELECT * FROM tb_member_payments
            WHERE id_payment = ?
        `, [id_payment]);

        if (!oldPayment) throw new Error('Payment not found');

        const payment_folio = oldPayment.payment_folio;
        const invoice = oldPayment.invoice;

        // ===============================
        // 2. Obtener socios anteriores
        // ===============================
        const [oldMembers] = await conn.query(`
            SELECT id_member
            FROM rel_payment_members
            WHERE id_payment = ?
        `, [id_payment]);

        // ===============================
        // 3. REVERTIR FECHAS
        // ===============================
        for (const m of oldMembers) {

            const [[history]] = await conn.query(`
                SELECT previous_next_payment_date
                FROM tb_member_payment_history
                WHERE id_payment = ?
                AND id_member = ?
                ORDER BY created_at DESC
                LIMIT 1
            `, [id_payment, m.id_member]);

            await conn.query(`
                UPDATE tb_members
                SET next_payment_date = ?
                WHERE id_member = ?
            `, [
                history ? history.previous_next_payment_date : null,
                m.id_member
            ]);
        }

        // ===============================
        // 4. Limpiar relaciones
        // ===============================
        await conn.query(`DELETE FROM rel_payment_members WHERE id_payment = ?`, [id_payment]);
        await conn.query(`DELETE FROM tb_payment_methods_detail WHERE id_payment = ?`, [id_payment]);

        // ===============================
        // 5. Recalcular montos
        // ===============================
        const paidAmount = payment_methods.reduce((s, p) => s + Number(p.amount), 0);

        const pendingAmount = (total_amount - discount_amount) - paidAmount;

        const status =
            pendingAmount <= 0 ? 'PAGADO' :
            paidAmount > 0 ? 'PARCIAL' : 'PENDIENTE';

        // ===============================
        // 6. Actualizar pago
        // ===============================
        await conn.query(`
            UPDATE tb_member_payments
            SET
                id_membership = ?,
                total_amount = ?,
                discount_amount = ?,
                paid_amount = ?,
                pending_amount = ?,
                payment_status = ?,
                notes = ?,
                updated_at = NOW(),
                updated_by = ?
            WHERE id_payment = ?
        `, [
            id_membership,
            total_amount,
            discount_amount,
            paidAmount,
            pendingAmount,
            status,
            notes,
            id_user,
            id_payment
        ]);

        // ===============================
        // 7. Insertar nuevos socios
        // ===============================
        for (const m of members) {
            await conn.query(`
                INSERT INTO rel_payment_members (id_payment, id_member)
                VALUES (?, ?)
            `, [id_payment, m.id_member]);
        }

        // ===============================
        // 8. Métodos de pago
        // ===============================
        for (const p of payment_methods) {
            await conn.query(`
                INSERT INTO tb_payment_methods_detail (
                    id_payment,
                    id_payment_method,
                    amount,
                    reference
                )
                VALUES (?, ?, ?, ?)
            `, [
                id_payment,
                p.id_payment_method,
                p.amount,
                p.reference || null
            ]);
        }

        // ===============================
        // 9. Obtener duración membresía
        // ===============================
        const [[membership]] = await conn.query(`
            SELECT 
                m.duration_value,
                u.value AS unit_days,
                membership_name
            FROM cat_memberships m
            JOIN cat_unit_measurement u
                ON u.id_unit_measurement = m.id_unit_measurement
            WHERE m.id_membership = ?
        `, [id_membership]);

        if (!membership) throw new Error('Membership not found');

        const quantity = req.body.quantity || 1;
        const totalDays = membership.duration_value * membership.unit_days * quantity;
        const membership_name = membership.membership_name;

        // ===============================
        // 10. Actualizar fechas nuevas + history
        // ===============================
        for (const m of members) {

            const [[member]] = await conn.query(`
                SELECT next_payment_date
                FROM tb_members
                WHERE id_member = ?
                FOR UPDATE
            `, [m.id_member]);

            const previousDate = member.next_payment_date;

            const baseDate = previousDate ? new Date(previousDate) : new Date();

            const newDate = new Date(baseDate);
            newDate.setDate(newDate.getDate() + totalDays);

            const formattedDate = newDate.toISOString().split('T')[0];

            // update member
            await conn.query(`
                UPDATE tb_members
                SET next_payment_date = ?
                WHERE id_member = ?
            `, [formattedDate, m.id_member]);

            // history
            if (previousDate) {
                await conn.query(`
                    INSERT INTO tb_member_payment_history (
                        id_member,
                        id_payment,
                        previous_next_payment_date,
                        new_payment_date
                    )
                    VALUES (?, ?, ?, ?)
                `, [
                    m.id_member,
                    id_payment,
                    previousDate,
                    formattedDate
                ]);
            }
        }

        // ===============================
        // 11. LOG
        // ===============================
        /*await PaymentsModel.createLog(conn, {
            id_payment,
            action: 'UPDATE',
            previous_status: oldPayment.payment_status,
            new_status: status,
            description: 'Actualización de pago',
            created_by: id_user
        });*/

        await conn.query(`
            INSERT INTO tb_payment_logs (
                id_payment,
                action,
                previous_status,
                new_status,
                description,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [
            id_payment,
            'UPDATE',
            oldPayment.payment_status,
            status,
            'Actualización de pago',
            id_user
        ]);

        // ===============================
        // 12. PDF + STORAGE + EMAIL
        // ===============================
        if (Number(send_mail) === 1) {

            const [membersData] = await conn.query(`
                SELECT email, first_name, first_surname
                FROM tb_members
                WHERE id_member IN (${members.map(() => '?').join(',')})
            `, members.map(m => m.id_member));

            const emails = membersData.map(m => m.email).filter(e => e);

            const membersNames = membersData
                .map(m => `${m.first_name} ${m.first_surname}`)
                .join(', ');

            const paymentMethodsText = payment_methods
                .map(p => p.payment_method_name)
                .join(' / ');

            const nextPaymentDate = new Date();
            nextPaymentDate.setDate(nextPaymentDate.getDate() + totalDays);

            const pdfBuffer = await generateReceiptPdf({
                date: new Date().toLocaleString(),
                total: total_amount,
                discount: discount_amount,
                members: membersNames,
                concept: membership_name,
                payment_methods: paymentMethodsText,
                next_payment_date: nextPaymentDate.toISOString().split('T')[0],
                attended_by: name,
                folio: invoice,
                payment_type
            });

            const fileName = `${payment_folio}.pdf`;

            const filePath = await uploadReceipt(pdfBuffer, fileName);

            await conn.query(`
                UPDATE tb_member_payments
                SET payment_receipt_path = ?
                WHERE id_payment = ?
            `, [filePath, id_payment]);

            /*if (emails.length) {
                await sendReceiptEmail(emails, pdfBuffer, payment_folio);
            }*/
        }

        await conn.commit();

        return {
            success: true,
            message: 'Pago actualizado correctamente',
            payment_folio,
            id_payment,
            status
        };

    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

