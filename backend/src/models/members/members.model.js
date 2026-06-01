exports.createMember = async (db, data) => {

    const [result] = await db.query(`
        INSERT INTO tb_members (
            membership_number,
            first_name,
            first_surname,
            second_surname,
            birth_date,
            email,
            telephone,
            id_gender,
            id_gym_branch,
            photo_path,
            qr_code,
            registration_date,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 1, ?)
    `, [
        data.membership_number,
        data.first_name,
        data.first_surname,
        data.second_surname,
        data.birth_date,
        data.email,
        data.telephone,
        data.id_gender,
        data.id_gym_branch,
        data.photo_path,
        data.qr_code,
        data.id_user
    ]);

    return result;
};

exports.searchSmart = async (db, data) => {

    let query = `
        SELECT 
            id_member,
            membership_number,
            CONCAT(first_name, ' ', first_surname, ' ', IFNULL(second_surname, '')) AS full_name,
            IF(next_payment_date IS NULL, 1, 0) AS is_new,
            next_payment_date
        FROM tb_members
        WHERE status = 1
    `;

    const params = [];

    // 🔍 búsqueda inteligente
    if (data.q) {
        query += `
            AND (
                membership_number LIKE ?
                OR first_name LIKE ?
                OR first_surname LIKE ?
                OR second_surname LIKE ?
            )
        `;

        const search = `%${data.q}%`;

        params.push(search, search, search, search);
    }

    // 🏢 filtro por sucursal
    if (data.id_gym_branch) {
        query += ` AND id_gym_branch = ? `;
        params.push(data.id_gym_branch);
    }

    // 🚫 exclusión de socio
    if (data.exclude_id_member) {
        query += ` AND id_member != ? `;
        params.push(data.exclude_id_member);
    }

    query += `
        ORDER BY 
            CASE 
                WHEN membership_number = ? THEN 1
                WHEN first_name LIKE ? THEN 2
                ELSE 3
            END,
            first_name ASC
        LIMIT 20
    `;

    const exact = data.q || '';
    const like = `%${data.q || ''}%`;

    params.push(exact, like);

    const [rows] = await db.query(query, params);

    return rows;
};

exports.getAll = async (db, id_gym_branch) => {

    const [rows] = await db.query(`
        SELECT 
            id_member,
            membership_number,
            CONCAT(tb_members.first_name, ' ', tb_members.first_surname, ' ', IFNULL(tb_members.second_surname, '')) AS full_name,
            tb_members.email,
            tb_members.telephone,
            CONCAT('https://storage.googleapis.com/athletic-gym/', tb_members.photo_path) AS photo_url,
            DATE_FORMAT(next_payment_date, '%d-%m-%Y') AS next_payment_date,
            tb_members.status,
            z_users.name AS created_by
        FROM tb_members
            INNER JOIN z_users
                ON z_users.id_user = tb_members.created_by
        WHERE tb_members.id_gym_branch = ?
        AND tb_members.status != 2
        ORDER BY id_member DESC
    `, [id_gym_branch]);

    return rows;
};

exports.updateMember = async (db, data) => {

    let query = `
        UPDATE tb_members
        SET 
            first_name = ?,
            first_surname = ?,
            second_surname = ?,
            birth_date = ?,
            email = ?,
            telephone = ?,
            id_gender = ?
    `;

    const params = [
        data.first_name,
        data.first_surname,
        data.second_surname,
        data.birth_date,
        data.email,
        data.telephone,
        data.id_gender
    ];

    // 📸 solo si viene foto
    if (data.photo_path) {
        query += `, photo_path = ?`;
        params.push(data.photo_path);
    }

    query += ` WHERE id_member = ?`;

    params.push(data.id_member);

    await db.query(query, params);
};

exports.deleteMember = async (db, id_member) => {

    await db.query(`
        UPDATE tb_members
        SET status = 2
        WHERE id_member = ?
    `, [id_member]);
};

exports.getPaymentHistory = async (db, dbBackup, id_member) => {

    const [rows] = await db.query(`
        SELECT
            p.id_payment,
            p.invoice AS payment_folio,

            m.id_membership,
            m.membership_name,

            p.total_amount,
            p.discount_amount,
            p.paid_amount,
            p.pending_amount,

            p.payment_status,

            p.notes,

            p.payment_date,

            p.payment_receipt_path,

            p.invoice,

            -- cantidad de socios del pago
            (
                SELECT COUNT(*)
                FROM rel_payment_members rpm2
                WHERE rpm2.id_payment = p.id_payment
            ) AS members_count,

            -- socios relacionados
            (
                SELECT GROUP_CONCAT(
                    CONCAT(
                        tm.membership_number,
                        ' - ',
                        tm.first_name,
                        ' ',
                        tm.first_surname
                    )
                    SEPARATOR ' | '
                )
                FROM rel_payment_members rpm3
                INNER JOIN tb_members tm
                    ON tm.id_member = rpm3.id_member
                WHERE rpm3.id_payment = p.id_payment
            ) AS members

        FROM rel_payment_members rpm

        INNER JOIN tb_member_payments p
            ON p.id_payment = rpm.id_payment

        INNER JOIN cat_memberships m
            ON m.id_membership = p.id_membership

        WHERE rpm.id_member = ?

        ORDER BY p.payment_date DESC
    `, [id_member]);

    return rows;
};

exports.getAccessDays = async (db,dbBackup, id_member) => {

    const [rows] = await db.query(`
        SELECT
         DATE_FORMAT(al.access_datetime - INTERVAL 6 HOUR,'%d-%m-%Y %H:%i:%s') AS access_date,
            CASE DAYOFWEEK(al.access_datetime - INTERVAL 6 HOUR)
                WHEN 1 THEN 'Domingo'
                WHEN 2 THEN 'Lunes'
                WHEN 3 THEN 'Martes'
                WHEN 4 THEN 'Miércoles'
                WHEN 5 THEN 'Jueves'
                WHEN 6 THEN 'Viernes'
                WHEN 7 THEN 'Sábado'
            END AS day_name

        FROM tb_access_log al

        INNER JOIN cat_access_types at
            ON at.id_access_type = al.id_access_type

        WHERE al.id_member = ?
        AND al.access_granted = 1

        GROUP BY DATE(al.access_datetime)

        ORDER BY access_date DESC
    `, [id_member]);

    const [member] = await db.query(`
        SELECT membership_number FROM tb_members WHERE id_member = ?
    `, [id_member]);

    const membershipNumber = member[0]?.membership_number;

     const [memberBackcup] = await dbBackup.query(`
        SELECT id_member FROM tb_members WHERE membership_number = ?
    `, [membershipNumber]);

    const id_member_backcup = memberBackcup[0]?.id_member;


    const [rowsBackup] = await dbBackup.query(`
        SELECT
         DATE_FORMAT(visit_date - INTERVAL 6 HOUR,'%d-%m-%Y %H:%i:%s') AS access_date,
            CASE DAYOFWEEK(visit_date - INTERVAL 6 HOUR)
                WHEN 1 THEN 'Domingo'
                WHEN 2 THEN 'Lunes'
                WHEN 3 THEN 'Martes'
                WHEN 4 THEN 'Miércoles'
                WHEN 5 THEN 'Jueves'
                WHEN 6 THEN 'Viernes'
                WHEN 7 THEN 'Sábado'
            END AS day_name

        FROM h_member_visits
        WHERE id_member = ?

        GROUP BY DATE(visit_date)

        ORDER BY visit_date DESC
    `, [id_member_backcup]);


    //return rows;

    const allRows = [...rows, ...rowsBackup];

    return allRows;
};