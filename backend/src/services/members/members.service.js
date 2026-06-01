const { getConnectionDB, getConnectionBackupDB } = require("../../config/db/connection");
const MembersModel = require('../../models/members/members.model');
const { getBucket  } = require('../../config/gcp/storage');
const { sgMail, initMailer } = require('../../config/mail/mailer');

const { v4: uuidv4 } = require('uuid');
const QRCode = require('qrcode');
const validator = require('validator');

exports.createMember = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();
    const bucket = await getBucket();

    try {

        const {
            first_name,
            first_surname,
            second_surname,
            birth_date,
            email,
            telephone,
            id_gender,
            id_gym_branch = 1,
            id_user
        } = req.body;

        if (!first_name || !first_surname || !id_gym_branch) {
            throw new Error('Missing required fields');
        }

        // =========================
        // GENERAR CONSECUTIVO
        // =========================

        const [rows] = await conn.query(`
            SELECT *
            FROM tb_membership_consecutive_number
            WHERE id_gym_branch = ?
            LIMIT 1
            FOR UPDATE
        `, [id_gym_branch]);

        if (!rows.length) {
            throw new Error('Consecutive not configured');
        }

        const current = rows[0].current_number + 1;

        await conn.query(`
            UPDATE tb_membership_consecutive_number
            SET current_number = ?
            WHERE id_membership_consecutive_number = ?
        `, [current, rows[0].id_membership_consecutive_number]);

        //const membership_number = `MBR-${String(current).padStart(6, '0')}`;
        const membership_number = current;

        // =========================
        // 📸 FOTO
        // =========================

        let photoPath = null;

        if (req.file) {

            if (!req.file.mimetype.startsWith('image/')) {
                throw new Error('Invalid file type');
            }

            const fileName = `${uuidv4()}.jpg`;
            photoPath = `members/photos/${fileName}`;

            const file = bucket.file(photoPath);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype }
            });
        }

        // =========================
        // 📱 GENERAR QR
        // =========================

        const qrData = JSON.stringify({
            membership_number,
            id_gym_branch
        });

        const qrBuffer = await QRCode.toBuffer(qrData);

        const qrFileName = `${uuidv4()}.png`;
        const qrPath = `members/qr-codes/${qrFileName}`;

        
        const qrFile = bucket.file(qrPath);

        await qrFile.save(qrBuffer, {
            metadata: { contentType: 'image/png' }
        });

        // =========================
        // 💾 GUARDAR SOCIO
        // =========================

        const result = await MembersModel.createMember(conn, {
            membership_number,
            first_name,
            first_surname,
            second_surname,
            birth_date,
            email,
            telephone,
            id_gender,
            id_gym_branch,
            photo_path: photoPath,
            qr_code: qrPath,
            id_user
        });

        // =========================
        // 📧 ENVIAR EMAIL
        // =========================

       if (email && validator.isEmail(email)) {

        try {
            // 1. QR URL
            const [url] = await qrFile.getSignedUrl({
                action: 'read',
                expires: Date.now() + 1000 * 60 * 60
            });

            // 2. Inicializar mailer (ideal moverlo fuera del request)
            //await initMailer();

            // 3. Enviar correo
            /*await sgMail.send({
                to: email,
                from: 'AlfaPower Gym <contacto@alfapowergym.com>',
                subject: 'Tu código de acceso',
                html: `
                    <h2>Bienvenido a AlfaPower Gym</h2>
                    <p>Tu número de socio es: <b>${membership_number}</b></p>
                    <p>Presenta este QR para acceder:</p>
                    <img src="${url}" width="200"/>
                `
            });*/

        } catch (err) {
            console.error("Error enviando correo:", err.response?.body || err.message);
            // NO rompas el registro del socio por correo fallido
        }
        }

        await conn.commit();

        return {
            success: true,
            message: 'Socio registrado',
            id_member: result.insertId,
            membership_number,
            photo_path: photoPath,
            qr_path: qrPath,
            is_new: 1
        };

    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
};

exports.searchSmart = async (filters) => {

    const db = await getConnectionDB();

    if (!filters.q || filters.q.trim().length < 2) {
        return {
            success: true,
            data: []
        };
    }

    const data = await MembersModel.searchSmart(db, filters);

    return {
        success: true,
        data
    };
};

exports.getAll = async (id_gym_branch) => {

    const db = await getConnectionDB();

    const data = await MembersModel.getAll(db, id_gym_branch);

    return {
        success: true,
        data
    };
};

exports.updateMember = async (req) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();
    const bucket = await getBucket();

    try {

        const { id_member } = req.params;

        const {
            first_name,
            first_surname,
            second_surname,
            birth_date,
            email,
            telephone,
            id_gender
        } = req.body;

        let photoPath = null;

        // 📸 actualizar foto si viene
        if (req.file) {

            if (!req.file.mimetype.startsWith('image/')) {
                throw new Error('Invalid file type');
            }

            const fileName = `${uuidv4()}.jpg`;
            photoPath = `members/photos/${fileName}`;

            const file = bucket.file(photoPath);

            await file.save(req.file.buffer, {
                metadata: { contentType: req.file.mimetype }
            });
        }

        await MembersModel.updateMember(conn, {
            id_member,
            first_name,
            first_surname,
            second_surname,
            birth_date,
            email,
            telephone,
            id_gender,
            photo_path: photoPath
        });

        return {
            success: true,
            message: 'Socio actualizado'
        };

    } finally {
        conn.release();
    }
};

exports.deleteMember = async (id_member) => {

    const db = await getConnectionDB();

    await MembersModel.deleteMember(db, id_member);

    return {
        success: true,
        message: 'Socio eliminado'
    };
};


const isBase64 = (str) => {
    try {
        return Buffer.from(str, 'base64').toString('base64') === str.replace(/\s/g, '');
    } catch {
        return false;
    }
};



exports.migrateMemberPhotos = async () => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();
    const bucket = await getBucket();

    try {

        const [members] = await conn.query(`
            SELECT id_member, photo_base64
            FROM tb_members
            WHERE photo_base64 IS NOT NULL
            AND id_member>915
        `);

        let processed = 0;

        for (const member of members) {

            try {

                let raw = member.photo_base64;

                // 🔥 SIEMPRE CONVERTIR A STRING
                let base64 = Buffer.isBuffer(raw)
                    ? raw.toString('utf8')
                    : raw;

                if (!base64) continue;

                base64 = base64.trim();

                let extension = 'png'; // default
                let contentType = 'image/png';

                // =========================
                // 🔍 DETECTAR HEADER
                // =========================
                const match = base64.match(/^data:image\/(\w+);base64,/);

                if (match) {
                    extension = match[1].toLowerCase();
                    contentType = `image/${extension}`;

                    base64 = base64.substring(base64.indexOf(',') + 1);
                }

                // =========================
                // 🧹 LIMPIAR BASE64
                // =========================
                base64 = base64.replace(/\s/g, '');

                // =========================
                // 🔄 CONVERTIR A BUFFER
                // =========================
                const buffer = Buffer.from(base64, 'base64');

                // =========================
                // 🚫 VALIDAR
                // =========================
                if (!buffer || buffer.length < 100) {
                    console.warn(`Imagen inválida en ${member.id_member}`);
                    continue;
                }

                // =========================
                // 📁 GUARDAR EN GCP
                // =========================
                const fileName = `members/photos/${member.id_member}_${Date.now()}.${extension}`;
                const file = bucket.file(fileName);

                await file.save(buffer, {
                    metadata: { contentType }
                });

                const publicUrl = `https://storage.googleapis.com/athletic-gym/${fileName}`;

                // =========================
                // 💾 UPDATE BD
                // =========================
                await conn.query(`
                    UPDATE tb_members
                    SET photo_path = ?
                    WHERE id_member = ?
                `, [publicUrl, member.id_member]);

                processed++;
                console.log(`✅ OK miembro ${member.id_member}`);

            } catch (err) {
                console.error(`❌ Error en ${member.id_member}:`, err.message);
            }
        }

        return {
            success: true,
            total: members.length,
            processed
        };

    } catch (error) {
        throw error;
    } finally {
        conn.release();
    }
};

exports.updateNextPaymentDate = async (req) => {

    const pool = await getConnectionDB();

    const conn = await pool.getConnection();

    await conn.beginTransaction();

    try {

        const {
            id_member,
            next_payment_date,
            notes,
            id_user
        } = req.body;

        // =========================
        // VALIDACIONES
        // =========================

        if (!id_member) {
            throw new Error('id_member is required');
        }

        if (!next_payment_date) {
            throw new Error('next_payment_date is required');
        }

        // =========================
        // OBTENER SOCIO
        // =========================

        const [[member]] = await conn.query(`
            SELECT
                id_member,
                id_gym_branch,
                membership_number,
                first_name,
                first_surname,
                next_payment_date
            FROM tb_members
            WHERE id_member = ?
            LIMIT 1
            FOR UPDATE
        `, [id_member]);

        if (!member) {
            throw new Error('Member not found');
        }

        const oldDate = member.next_payment_date;

        // =========================
        // ACTUALIZAR FECHA
        // =========================

        await conn.query(`
            UPDATE tb_members
            SET
                next_payment_date = ?,
                updated_at = NOW(),
                updated_by = ?
            WHERE id_member = ?
        `, [
            next_payment_date,
            id_user || null,
            id_member
        ]);

        // =========================
        // GUARDAR HISTORIAL
        // =========================

        await conn.query(`
            INSERT INTO tb_member_payment_history (
                id_member,
                previous_next_payment_date,
                new_next_payment_date,
                movement_type,
                notes,
                created_by
            )
            VALUES (?, ?, ?, 'ADJUSTMENT', ?, ?)
        `, [
            id_member,
            oldDate,
            next_payment_date,
            notes || 'Ajuste manual',
            id_user || null
        ]);

        // =========================
        // LOG DEL SISTEMA
        // =========================

        await conn.query(`
            INSERT INTO tb_system_logs (
                id_user,
                id_gym_branch,
                module_name,
                action_type,
                table_name,
                record_id,
                description,
                old_values,
                new_values,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            id_user || null,
            member.id_gym_branch,
            'MEMBERS',
            'UPDATE',
            'tb_members',
            id_member,

            `Modificó fecha de pago del socio ${member.first_name} ${member.first_surname}`,

            JSON.stringify({
                next_payment_date: oldDate
            }),

            JSON.stringify({
                next_payment_date
            })
        ]);

        await conn.commit();

        return {
            success: true,
            message: 'Fecha de pago actualizada correctamente',
            data: {
                id_member,
                membership_number: member.membership_number,
                previous_next_payment_date: oldDate,
                new_next_payment_date: next_payment_date
            }
        };

    } catch (error) {

        await conn.rollback();

        throw error;

    } finally {

        conn.release();
    }
};

exports.getPaymentHistory = async (id_member) => {

    const db = await getConnectionDB();
    const dbBackup = await getConnectionBackupDB();

    if (!id_member) {
        throw new Error('id_member is required');
    }

    const payments = await MembersModel.getPaymentHistory(
        db,
        dbBackup,
        id_member
    );

    return {
        success: true,
        total: payments.length,
        data: payments
    };
};

exports.getAccessDays = async (id_member) => {

    const db = await getConnectionDB();
    const dbBackup = await getConnectionBackupDB();

    if (!id_member) {
        throw new Error('id_member is required');
    }

    const data = await MembersModel.getAccessDays(
        db,
        dbBackup,
        id_member
    );

    return {
        success: true,
        total: data.length,
        data
    };
};