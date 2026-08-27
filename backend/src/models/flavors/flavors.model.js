const { getConnectionDB } = require("../../config/db/connection");

class FlavorModel {

    async createFlavor(data) {

        const pool = await getConnectionDB();

        const sql = `
            INSERT INTO cat_flavors
            (
                name,
                description,
                created_by
            )
            VALUES
            (
                ?,
                ?,
                ?
            )
        `;

        const [result] = await pool.execute(sql, [
            data.name,
            data.description || null,
            data.created_by || null
        ]);

        return {
            id_flavor: result.insertId
        };
    }

    async updateFlavor(id, data) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_flavors
            SET
                name = ?,
                description = ?,
                updated_by = ?
            WHERE id_flavor = ?
        `;

        await pool.execute(sql, [
            data.name,
            data.description || null,
            data.updated_by || null,
            id
        ]);

        return true;
    }

    async deleteFlavor(id) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_flavors
            SET
                status = 2
            WHERE id_flavor = ?
        `;

        await pool.execute(sql, [id]);

        return true;
    }

    async setStatus(id, status) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_flavors
            SET
                status = ?
            WHERE id_flavor = ?
        `;

        await pool.execute(sql, [
            status,
            id
        ]);

        return true;
    }

    async getFlavor(id) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_flavor,
                name,
                description,
                status,
                created_at,
                created_by,
                updated_at,
                updated_by
            FROM cat_flavors
            WHERE id_flavor = ?
        `, [id]);

        return rows.length ? rows[0] : null;
    }

    async getFlavorByName(name) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT *
            FROM cat_flavors
            WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))
            LIMIT 1
        `, [name]);

        return rows.length ? rows[0] : null;
    }

    async getAllFlavors() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                id_flavor,
                name,
                description,
                status,
                created_at,
                updated_at
            FROM cat_flavors
            ORDER BY name
        `);

        return rows;
    }

    async getFlavorsAvailable() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                id_flavor,
                name
            FROM cat_flavors
            WHERE status = 1
            ORDER BY name
        `);

        return rows;
    }

}

module.exports = new FlavorModel();