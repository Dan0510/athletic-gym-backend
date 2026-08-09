exports.createExternalVisitor = async (conn, full_name) => {

    const [result] = await conn.query(`
        INSERT INTO cat_external_visitors(
            full_name
        )
        VALUES(?)
    `, [
        full_name
    ]);

    return result.insertId;

};

exports.findExternalVisitorByName = async (
    conn,
    full_name
) => {

    const [[visitor]] = await conn.query(`
        SELECT
            id_external_visitor
        FROM cat_external_visitors
        WHERE full_name = ?
        LIMIT 1
    `, [
        full_name
    ]);

    return visitor || null;

};

exports.getMemberName = async (
    conn,
    id_member
) => {

    const [[member]] = await conn.query(`
        SELECT CONCAT_WS(
            ' ',
            first_name,
            first_surname,
            membership_number
        ) AS member_name
        FROM tb_members
        WHERE id_member = ?
        LIMIT 1
    `, [
        id_member
    ]);

    return member ? member.member_name : null;

};

exports.createVisit = async (
    conn,
    visit
) => {

    const [result] = await conn.query(`
        INSERT INTO tb_visits(

            visit_folio,

            id_visit_type,

            visitor_type,

            id_member,

            id_external_visitor,

            id_gym_branch,

            total_amount,

            discount_amount,

            paid_amount,

            pending_amount,

            payment_status,

            notes,

            created_by

        )

        VALUES(

            ?,?,?,?,?,?,?,?,?,?,?,?,?

        )

    `, [

        visit.folio,

        visit.id_visit_type,

        visit.visitor_type,

        visit.id_member || null,

        visit.id_external_visitor,

        visit.id_gym_branch,

        visit.total_amount,

        visit.discount_amount,

        visit.paidAmount,

        visit.pendingAmount,

        visit.paymentStatus,

        visit.notes,

        visit.id_user

    ]);


    const [rowsFolio] = await conn.query(`
            SELECT *
            FROM config_payment_folio_consecutive
            WHERE id_gym_branch = ?
            AND folio_category = ?
            FOR UPDATE
        `, [visit.id_gym_branch, 'VISITA']);

    if (!rowsFolio.length) {
        throw new Error('Folio category not configured');
    }

    const configFolio = rowsFolio[0];

        await conn.query(`
        UPDATE config_payment_folio_consecutive
        SET current_number = ?, updated_at = NOW()
        WHERE id_payment_folio_consecutive = ?
    `, [visit.folio, configFolio.id_payment_folio_consecutive]);

    return result.insertId;

};

exports.createVisitPaymentMethod = async (

    conn,

    id_visit,

    payment

) => {

    await conn.query(`
        INSERT INTO tb_payment_methods_detail(

            payment_type,

            id_visit,

            id_payment_method,

            amount,

            reference

        )

        VALUES(

            'VISIT',

            ?,?,?,?

        )

    `,[

        id_visit,

        payment.id_payment_method,

        payment.amount,

        payment.reference || null

    ]);

};

exports.updateReceiptPath = async (

    conn,

    id_visit,

    receipt

) => {

    await conn.query(`
        UPDATE tb_visits
        SET payment_receipt_path = ?
        WHERE id_visit = ?
    `,[
        receipt,
        id_visit
    ]);

};

exports.getVisit = async (
    conn,
    id_visit
) => {

    const [[visit]] = await conn.query(`

        SELECT

            v.*,

            vt.visit_type_name,

            m.membership_number,

            CONCAT(
                m.first_name,
                ' ',
                m.first_surname
            ) member_name,

            ev.full_name external_name

        FROM tb_visits v

        INNER JOIN cat_visit_types vt
            ON vt.id_visit_type=v.id_visit_type

        LEFT JOIN tb_members m
            ON m.id_member=v.id_member

        LEFT JOIN cat_external_visitors ev
            ON ev.id_external_visitor=v.id_external_visitor

        WHERE v.id_visit=?

    `,[
        id_visit
    ]);

    return visit;

};

exports.getVisitTypes = async (
    conn
) => {

    const [rows] = await conn.query(`

        SELECT

            id_visit_type,

            visit_type_name,

            price

        FROM cat_visit_types

        WHERE status=1

        ORDER BY visit_type_name

    `);

    return rows;

};

exports.searchExternalVisitors = async (
    conn,
    search
) => {

    const [rows] = await conn.query(`
        SELECT
            id_external_visitor AS value,
            full_name AS label,
            email
        FROM cat_external_visitors
        WHERE status = 1
        AND full_name LIKE ?
        ORDER BY full_name
        LIMIT 20
    `,[
        `%${search}%`
    ]);

    return rows;

};


exports.searchMembers = async (
    conn,
    search,
    idGymBranch
) => {

    let sql = `
        SELECT
            id_member,
            membership_number,
            CONCAT(first_name, ' ', first_surname) AS member_name,
            email
        FROM tb_members
        WHERE status = 1
    `;

    const params = [];

    if (idGymBranch) {
        sql += ` AND id_gym_branch = ?`;
        params.push(idGymBranch);
    }

    if (search) {
        sql += `
            AND (
                membership_number LIKE ?
                OR CONCAT(first_name, ' ', first_surname) LIKE ?
            )
        `;

        params.push(`%${search}%`);
        params.push(`%${search}%`);
    }

    sql += `
        ORDER BY member_name
        LIMIT 20
    `;

    const [rows] = await conn.query(sql, params);

    return rows;
};

exports.getOrCreateExternalVisitor = async (
    conn,
    full_name
) => {

    const [[visitor]] = await conn.query(`
        SELECT id_external_visitor
        FROM cat_external_visitors
        WHERE full_name = ?
        LIMIT 1
    `,[full_name]);

    if (visitor) {
        return visitor.id_external_visitor;
    }

    const [result] = await conn.query(`
        INSERT INTO cat_external_visitors(
            full_name
        )
        VALUES(?)
    `,[full_name]);

    return result.insertId;

};


exports.getAllVisits = async (
    conn,
    filters
) => {

    let sql = `
        SELECT

            v.id_visit,

            v.visit_folio,

            vt.visit_type_name,

            v.visitor_type,

            CASE

                WHEN v.visitor_type='MEMBER'

                THEN CONCAT(
                    m.first_name,
                    ' ',
                    m.first_surname
                )

                ELSE ev.full_name

            END AS visitor_name,

            v.total_amount,

            v.discount_amount,

            v.paid_amount,

            v.pending_amount,

            v.payment_status,

            v.visit_date

        FROM tb_visits v

        INNER JOIN cat_visit_types vt
            ON vt.id_visit_type=v.id_visit_type

        LEFT JOIN tb_members m
            ON m.id_member=v.id_member

        LEFT JOIN cat_external_visitors ev
            ON ev.id_external_visitor=v.id_external_visitor

        WHERE 1=1
    `;

    const params = [];

        if (filters.id_gym_branch) {

        sql += ` AND v.id_gym_branch=?`;

        params.push(filters.id_gym_branch);

    }

    if (filters.visitor_type) {

        sql += ` AND v.visitor_type=?`;

        params.push(filters.visitor_type);

    }

    if (filters.payment_status) {

        sql += ` AND v.payment_status=?`;

        params.push(filters.payment_status);

    }

    if (filters.start_date) {

        sql += ` AND DATE(v.visit_date)>=?`;

        params.push(filters.start_date);

    }

    if (filters.end_date) {

        sql += ` AND DATE(v.visit_date)<=?`;

        params.push(filters.end_date);

    }

    if (filters.search) {

        sql += `
            AND (

                v.visit_folio LIKE ?

                OR

                CONCAT(
                    m.first_name,
                    ' ',
                    m.first_surname
                ) LIKE ?

                OR

                ev.full_name LIKE ?

            )
        `;

        params.push(
            `%${filters.search}%`,
            `%${filters.search}%`,
            `%${filters.search}%`
        );

    }

    sql += `
        ORDER BY
            v.visit_date DESC
    `;

    const [rows] = await conn.query(
        sql,
        params
    );

    return rows;

};