const { getConnectionDB } = require('../../config/db/connection');


class ProductModel {


    async createProduct(data) {

        const pool = await getConnectionDB();

        const [result] = await pool.execute(`
            INSERT INTO cat_products
            (
                id_category,
                id_brand,
                name,
                description,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)
        `, [
            data.id_category,
            data.id_brand,
            data.name.trim(),
            data.description || null,
            data.created_by || null
        ]);


        return await this.getProduct(
            result.insertId
        );
    }


    async updateProduct(id, data) {

        const pool = await getConnectionDB();

        await pool.execute(`
            UPDATE cat_products
            SET
                id_category = ?,
                id_brand = ?,
                name = ?,
                description = ?,
                updated_by = ?
            WHERE id_product = ?
        `, [
            data.id_category,
            data.id_brand,
            data.name.trim(),
            data.description || null,
            data.updated_by || null,
            id
        ]);


        return await this.getProduct(id);
    }


    async deleteProduct(id) {

        const pool = await getConnectionDB();

        const [result] = await pool.execute(`
            UPDATE cat_products
            SET
                status = 0
            WHERE id_product = ?
        `, [id]);


        return result.affectedRows > 0;
    }


    async setStatus(id, status) {

        const pool = await getConnectionDB();

        const [result] = await pool.execute(`
            UPDATE cat_products
            SET
                status = ?
            WHERE id_product = ?
        `, [
            status,
            id
        ]);


        return result.affectedRows > 0;
    }


    async getProduct(id) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                p.id_product,
                p.id_category,
                c.name AS category_name,

                p.id_brand,
                b.name AS brand_name,

                p.name,
                p.description,
                p.status,

                p.created_at,
                p.created_by,
                p.updated_at,
                p.updated_by

            FROM cat_products p

            INNER JOIN cat_product_categories c
                ON c.id_category = p.id_category

            INNER JOIN cat_brands b
                ON b.id_brand = p.id_brand

            WHERE p.id_product = ?
        `, [id]);


        return rows.length > 0
            ? rows[0]
            : null;
    }


    async getProductByName(name, idBrand) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_product,
                id_category,
                id_brand,
                name,
                description,
                status
            FROM cat_products
            WHERE UPPER(TRIM(name))
                    = UPPER(TRIM(?))
              AND id_brand = ?
              AND status = 1
            LIMIT 1
        `, [
            name,
            idBrand
        ]);


        return rows.length > 0
            ? rows[0]
            : null;
    }


    async getAllProducts() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                p.id_product,

                p.id_category,
                c.name AS category_name,

                p.id_brand,
                b.name AS brand_name,

                p.name,
                p.description,
                p.status,

                p.created_at,
                p.updated_at

            FROM cat_products p

            INNER JOIN cat_product_categories c
                ON c.id_category = p.id_category

            INNER JOIN cat_brands b
                ON b.id_brand = p.id_brand

            ORDER BY p.name
        `);


        return rows;
    }


    async getProductsAvailable() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                p.id_product,

                p.id_category,
                c.name AS category_name,

                p.id_brand,
                b.name AS brand_name,

                p.name,
                p.description

            FROM cat_products p

            INNER JOIN cat_product_categories c
                ON c.id_category = p.id_category

            INNER JOIN cat_brands b
                ON b.id_brand = p.id_brand

            WHERE p.status = 1

            ORDER BY p.name
        `);


        return rows;
    }


    async getProductsByCategory(idCategory) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                p.id_product,
                p.id_category,
                c.name AS category_name,

                p.id_brand,
                b.name AS brand_name,

                p.name,
                p.description

            FROM cat_products p

            INNER JOIN cat_product_categories c
                ON c.id_category = p.id_category

            INNER JOIN cat_brands b
                ON b.id_brand = p.id_brand

            WHERE p.id_category = ?
              AND p.status = 1

            ORDER BY p.name
        `, [idCategory]);


        return rows;
    }


    async getProductsByBrand(idBrand) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                p.id_product,
                p.id_category,
                c.name AS category_name,

                p.id_brand,
                b.name AS brand_name,

                p.name,
                p.description

            FROM cat_products p

            INNER JOIN cat_product_categories c
                ON c.id_category = p.id_category

            INNER JOIN cat_brands b
                ON b.id_brand = p.id_brand

            WHERE p.id_brand = ?
              AND p.status = 1

            ORDER BY p.name
        `, [idBrand]);


        return rows;
    }


    async getCategory(idCategory) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_category,
                name,
                status
            FROM cat_product_categories
            WHERE id_category = ?
              AND status = 1
        `, [idCategory]);


        return rows.length > 0
            ? rows[0]
            : null;
    }


    async getBrand(idBrand) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_brand,
                name,
                status
            FROM cat_brands
            WHERE id_brand = ?
              AND status = 1
        `, [idBrand]);


        return rows.length > 0
            ? rows[0]
            : null;
    }


    async validateBrandCategory(
        idBrand,
        idCategory
    ) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_brand_category
            FROM cat_brand_category
            WHERE id_brand = ?
              AND id_category = ?
            LIMIT 1
        `, [
            idBrand,
            idCategory
        ]);


        return rows.length > 0;
    }

}


module.exports = new ProductModel();