const { getConnectionDB } = require("../../config/db/connection");

class CategoryModel {

    async createCategory(data) {

        const pool = await getConnectionDB();

        const sql = `
            INSERT INTO cat_product_categories
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
            id_category: result.insertId
        };
    }

    async updateCategory(id, data) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_product_categories
            SET
                name = ?,
                description = ?,
                updated_by = ?
            WHERE id_category = ?
        `;

        await pool.execute(sql, [
            data.name,
            data.description || null,
            data.updated_by || null,
            id
        ]);

        return true;
    }

    async deleteCategory(id) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_product_categories
            SET
                status = 0
            WHERE id_category = ?
        `;

        await pool.execute(sql, [id]);

        return true;
    }

    async setStatus(id, status) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_product_categories
            SET
                status = ?
            WHERE id_category = ?
        `;

        await pool.execute(sql, [
            status,
            id
        ]);

        return true;
    }

    async getCategory(id) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_category,
                name,
                description,
                status,
                created_at,
                created_by,
                updated_at,
                updated_by
            FROM cat_product_categories
            WHERE id_category = ?
        `, [id]);

        return rows.length ? rows[0] : null;
    }

    async getCategoryByName(name) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT *
            FROM cat_product_categories
            WHERE UPPER(name)=UPPER(?)
            LIMIT 1
        `, [name]);

        return rows.length ? rows[0] : null;
    }

    async getAllCategories() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                id_category,
                name,
                description,
                status,
                created_at,
                updated_at
            FROM cat_product_categories
            ORDER BY name
        `);

        return rows;
    }

    async getCategoriesAvailable() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                id_category,
                name
            FROM cat_product_categories
            WHERE status = 1
            ORDER BY name
        `);

        return rows;
    }

}

module.exports = new CategoryModel();