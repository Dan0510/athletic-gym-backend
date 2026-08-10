exports.getAvailable = async (db, data) => {

   let query = `
        SELECT 
            m.id_membership,
            m.id_gym_branch,
            m.membership_name,
            m.description,
            m.duration_value,
            m.id_unit_measurement,
            m.price,
            m.quantity_members,
            m.access_limit_per_day,
            m.allow_freeze,
            m.max_freeze_days,
            m.max_members,
            m.only_new_members,
            m.valid_from,
            m.valid_to,
            m.status,
            u.unit_measurement
        FROM cat_memberships m
        INNER JOIN cat_unit_measurement u
            ON u.id_unit_measurement = m.id_unit_measurement
        WHERE m.id_gym_branch = ?
          AND m.status = 1
          AND (m.valid_from IS NULL OR m.valid_from <= ?)
          AND (m.valid_to IS NULL OR m.valid_to >= ?)
        
    `;

    const params = [
        data.id_gym_branch,
        data.today,
        data.today
    ];

    /*if (data.only_new_members !== undefined) {
        query += ` AND only_new_members = ? `;
        params.push(Number(data.only_new_members));
    }*/

    if (data.only_new_members !== undefined) {
        query += ` AND (only_new_members = ?  OR only_new_members=2) `;
        params.push(Number(data.only_new_members));
    }else{
         query += ` only_new_members IN (0,2)`;
    }

    query += ` ORDER BY m.id_membership ASC`;

    const [rows] = await db.query(query, params);

    return rows;
};


exports.create = async (db, data) => {
    const [result] = await db.query(`
        INSERT INTO cat_memberships (
            id_gym_branch,
            membership_name,
            description,
            duration_value,
            id_unit_measurement,
            price,
            quantity_members,
            valid_from,
            valid_to,
            status,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
        data.id_gym_branch,
        data.membership_name,
        data.description,
        data.duration_value,
        data.id_unit_measurement,
        data.price,
        data.quantity_members,
        data.valid_from,
        data.valid_to,
        data.status,
        data.created_by
    ]);

    return result;
};

exports.update = async (db, id_membership, data) => {
    const [result] = await db.query(`
        UPDATE cat_memberships
        SET
            id_gym_branch = ?,
            membership_name = ?,
            description = ?,
            duration_value = ?,
            id_unit_measurement = ?,
            price = ?,
            quantity_members = ?,
            valid_from = ?,
            valid_to = ?,
            status = ?,
            updated_at = NOW(),
            updated_by = ?
        WHERE id_membership = ?
    `, [
        data.id_gym_branch,
        data.membership_name,
        data.description,
        data.duration_value,
        data.id_unit_measurement,
        data.price,
        data.quantity_members,
        data.valid_from,
        data.valid_to,
        data.status,
        data.updated_by,
        id_membership
    ]);

    return result;
};

exports.delete = async (db, id_membership) => {
    const [result] = await db.query(`
       UPDATE cat_memberships 
        SET status = 2, updated_at = NOW()
        WHERE id_membership = ?
    `, [id_membership]);

    

    return result;
};

exports.getAll = async (db, id_gym_branch) => {
    const [rows] = await db.query(`
        SELECT 
            m.*,
            u.unit_measurement
        FROM cat_memberships m
        INNER JOIN cat_unit_measurement u
            ON u.id_unit_measurement = m.id_unit_measurement
        WHERE m.id_gym_branch = ?
        ORDER BY m.created_at DESC
    `, [id_gym_branch]);

    return rows;
};