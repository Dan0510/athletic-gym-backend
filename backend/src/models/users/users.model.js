// models/users/users.model.js

exports.create = async (db, data) => {
    const [result] = await db.query(`
        INSERT INTO z_users (
            username,
            name,
            first_surname,
            second_surname,
            email,
            telephone,
            password,
            status,
            id_gym_branch,
            created_at,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
    `, [
        data.username,
        data.name,
        data.first_surname,
        data.second_surname,
        data.email,
        data.telephone,
        data.password,
        data.status,
        data.id_gym_branch,
        data.created_by
    ]);

    return result;
};

exports.update = async (db, id_user, data) => {
    const [result] = await db.query(`
        UPDATE z_users
        SET
            name = ?,
            first_surname = ?,
            second_surname = ?,
            email = ?,
            telephone = ?,
            status = ?,
            id_gym_branch = ?,
            updated_at = NOW(),
            updated_by = ?
        WHERE id_user = ?
    `, [
        data.name,
        data.first_surname,
        data.second_surname,
        data.email,
        data.telephone,
        data.status,
        data.id_gym_branch,
        data.updated_by,
        id_user
    ]);

    return result;
};

exports.updatePassword = async (db, id_user, password) => {
    const [result] = await db.query(`
        UPDATE z_users
        SET password = ?, updated_at = NOW()
        WHERE id_user = ?
    `, [password, id_user]);

    return result;
};

exports.delete = async (db, id_user) => {
    const [result] = await db.query(`
        UPDATE z_users
            SET status = 2
        WHERE id_user = ?
    `, [id_user]);

    return result;
};

exports.getAll = async (db, id_gym_branch) => {
    const [rows] = await db.query(`
        SELECT 
            id_user,
            username,
            name,
            first_surname,
            second_surname,
            email,
            telephone,
            status,
            id_gym_branch,
            is_admin,
            created_at
        FROM z_users
        WHERE id_gym_branch = ? AND status != 2
        ORDER BY created_at DESC
    `, [id_gym_branch]);

    return rows;
};