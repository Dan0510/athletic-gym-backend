const { getConnectionDB } = require('../../config/db/connection');
const { getBucket  } = require('../../config/gcp/storage');

function calculateDaysRemaining(date) {
    if (!date) return null;

    const today = new Date();
    const next = new Date(date);

    const diff = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
    return diff;
}

exports.searchMember = async ({ search, id_gym_branch }) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    try {

        if (!search) {
            throw new Error('Search parameter is required');
        }

        let query = '';
        let params = [];

        const isNumber = /^\d+$/.test(search);

        if (isNumber) {
            // 🔢 búsqueda por número de socio
            query = `
                SELECT 
                    id_member,
                    membership_number,
                    CONCAT(first_name, ' ', first_surname, ' ', IFNULL(second_surname,'')) AS full_name,
                    next_payment_date
                FROM tb_members
                WHERE membership_number = ?
                AND id_gym_branch = ?
                AND status = 1
            `;
            params = [search, id_gym_branch];

        } else {
            // 🔎 búsqueda por nombre
            query = `
                SELECT 
                    id_member,
                    membership_number,
                    CONCAT(first_name, ' ', first_surname, ' ', IFNULL(second_surname,'')) AS full_name,
                    next_payment_date,
                     CASE 
                    WHEN photo_path IS NOT NULL AND photo_path <> '' THEN 
                        CONCAT('https://storage.googleapis.com/athletic-gym/', photo_path)
                    ELSE NULL
                END AS photo_url
                FROM tb_members
                WHERE (
                    first_name LIKE ? OR
                    first_surname LIKE ? OR
                    second_surname LIKE ?
                )
                AND id_gym_branch = ?
                AND status = 1
                LIMIT 10
            `;
            params = [`%${search}%`, `%${search}%`, `%${search}%`, id_gym_branch];
        }

        const [rows] = await conn.query(query, params);

        const result = rows.map(r => ({
            ...r,
            days_remaining: calculateDaysRemaining(r.next_payment_date)
        }));

        return {
            success: true,
            count: result.length,
            data: result
        };

    } finally {
        conn.release();
    }
};

exports.validateQrAccess = async ({ id_member, id_gym_branch }) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    try {

        const [[member]] = await conn.query(`
            SELECT 
                id_member,
                membership_number,
                CONCAT(first_name, ' ', first_surname, ' ', IFNULL(second_surname,'')) AS full_name,
                next_payment_date,
                 CASE 
                    WHEN photo_path IS NOT NULL AND photo_path <> '' THEN 
                        CONCAT('https://storage.googleapis.com/athletic-gym/', photo_path)
                    ELSE NULL
                END AS photo_url,
                status
            FROM tb_members
            WHERE id_member = ?
            AND id_gym_branch = ?
        `, [id_member, id_gym_branch]);

        if (!member) {
            throw new Error('Member not found');
        }

        const daysRemaining = calculateDaysRemaining(member.next_payment_date);

        let access = false;
        let message = '';

        if (member.status !== 1) {
            message = 'Member inactive';
        } else if (!member.next_payment_date) {
            message = 'No active membership';
        } else if (daysRemaining < 0) {
            message = 'Membership expired';
        } else {
            access = true;
            message = 'Access granted';
        }

        return {
            success: true,
            access,
            message,
            data: {
                ...member,
                days_remaining: daysRemaining
            }
        };

    } finally {
        conn.release();
    }
};



function calculateDaysRemaining(date) {
    if (!date) return null;

    const today = new Date();
    const next = new Date(date);

    return Math.ceil((next - today) / (1000 * 60 * 60 * 24));
}

exports.registerAccess = async (data) => {

    const pool = await getConnectionDB();
    const conn = await pool.getConnection();

    try {

        const {
            id_member,
            id_gym_branch,
            id_access_type,
            validated_by,
            latitude,
            longitude,
            device_name
        } = data;

        if (!id_member || !id_gym_branch || !id_access_type) {
            throw new Error('Missing required fields');
        }

        // 🔎 obtener socio
        const [[member]] = await conn.query(`
            SELECT 
                id_member,
                next_payment_date,
                photo_path,
                status
            FROM tb_members
            WHERE id_member = ?
            AND id_gym_branch = ?
        `, [id_member, id_gym_branch]);

        if (!member) {
            throw new Error('Member not found');
        }

        const daysRemaining = calculateDaysRemaining(member.next_payment_date);

        let accessGranted = 1;
        let deniedReason = null;

        // 🔥 VALIDACIONES
        if (member.status !== 1) {
            accessGranted = 0;
            deniedReason = 'Member inactive';
        }
        else if (!member.next_payment_date) {
            accessGranted = 0;
            deniedReason = 'No membership';
        }
        else if (daysRemaining < 0) {
            accessGranted = 0;
            deniedReason = 'Membership expired';
        }

        // 🧠 VALIDAR TIPO DE ACCESO
        const [[accessType]] = await conn.query(`
            SELECT * FROM cat_access_types
            WHERE id_access_type = ?
            AND status = 1
        `, [id_access_type]);

        if (!accessType) {
            throw new Error('Invalid access type');
        }

        // 🔒 OPCIONAL: evitar doble entrada sin salida
        if (accessType.is_entry) {
            const [[lastAccess]] = await conn.query(`
                SELECT at.is_entry, at.is_exit
                FROM tb_access_log al
                INNER JOIN cat_access_types at 
                    ON at.id_access_type = al.id_access_type
                WHERE al.id_member = ?
                AND DATE(al.access_datetime) = CURDATE()
                ORDER BY al.access_datetime DESC
                LIMIT 1
            `, [id_member]);

            if (lastAccess && lastAccess.is_entry && !lastAccess.is_exit) {
                accessGranted = 1;
                deniedReason = 'Already inside';
            }
        }

        // 💾 REGISTRAR ACCESO
        await conn.query(`
            INSERT INTO tb_access_log (
                id_member,
                id_gym_branch,
                id_access_type,
                access_granted,
                denied_reason,
                validated_by,
                latitude,
                longitude,
                device_name
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            id_member,
            id_gym_branch,
            id_access_type,
            accessGranted,
            deniedReason,
            validated_by || null,
            latitude || null,
            longitude || null,
            device_name || null
        ]);


        const photo_url = member.photo_path
            ? `https://storage.googleapis.com/athletic-gym/${member.photo_path}`
            : null;
        

        return {
            success: true,
            access_granted: !!accessGranted,
            message: accessGranted ? 'Access granted' : deniedReason,
            days_remaining: daysRemaining,
            photo_url: photo_url
        };

    } finally {
        conn.release();
    }
};

