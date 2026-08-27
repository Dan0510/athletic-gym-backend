const {
    getConnectionDB
} = require('../../config/db/connection');


class PresentationModel {


    async createPresentation(data) {

        const pool = await getConnectionDB();

        const [result] = await pool.execute(`
            INSERT INTO cat_product_presentations
            (
                id_product,
                id_flavor,
                id_unit,
                quantity,
                sku,
                barcode,
                price,
                image_url,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            data.id_product,
            data.id_flavor || null,
            data.id_unit,
            data.quantity,
            data.sku.trim(),
            data.barcode || null,
            data.price,
            data.image_url || null,
            data.created_by || null
        ]);

        return {
            id_presentation: result.insertId
        };
    }


    async updatePresentation(id, data) {

        const pool = await getConnectionDB();

        await pool.execute(`
            UPDATE cat_product_presentations
            SET
                id_product = ?,
                id_flavor = ?,
                id_unit = ?,
                quantity = ?,
                sku = ?,
                barcode = ?,
                price = ?,
                image_url = ?,
                updated_by = ?
            WHERE id_presentation = ?
        `, [
            data.id_product,
            data.id_flavor || null,
            data.id_unit,
            data.quantity,
            data.sku.trim(),
            data.barcode || null,
            data.price,
            data.image_url || null,
            data.updated_by || null,
            id
        ]);

        return await this.getPresentation(id);
    }


    async deletePresentation(id) {

        const pool = await getConnectionDB();

        const [result] = await pool.execute(`
            UPDATE cat_product_presentations
            SET
                status = 0
            WHERE id_presentation = ?
        `, [id]);

        return result.affectedRows > 0;
    }


    async setStatus(id, status) {

        const pool = await getConnectionDB();

        const [result] = await pool.execute(`
            UPDATE cat_product_presentations
            SET
                status = ?
            WHERE id_presentation = ?
        `, [
            status,
            id
        ]);

        return result.affectedRows > 0;
    }


    async getPresentation(id) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                p.id_presentation,

                p.id_product,
                pr.name AS product_name,

                p.id_flavor,
                f.name AS flavor_name,

                p.id_unit,
                u.name AS unit_name,
                u.abbreviation AS unit_abbreviation,

                p.quantity,

                p.sku,
                p.barcode,
                p.price,
                p.image_url,

                p.status,

                p.created_at,
                p.created_by,
                p.updated_at,
                p.updated_by

            FROM cat_product_presentations p

            INNER JOIN cat_products pr
                ON pr.id_product = p.id_product

            LEFT JOIN cat_flavors f
                ON f.id_flavor = p.id_flavor

            INNER JOIN cat_units u
                ON u.id_unit = p.id_unit

            WHERE p.id_presentation = ?
        `, [id]);

        return rows.length
            ? rows[0]
            : null;
    }


    async getAllPresentations() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                p.id_presentation,

                p.id_product,
                pr.name AS product_name,

                p.id_flavor,
                f.name AS flavor_name,

                p.id_unit,
                u.name AS unit_name,
                u.abbreviation AS unit_abbreviation,

                p.quantity,

                p.sku,
                p.barcode,
                p.price,
                p.image_url,

                p.status,

                p.created_at,
                p.updated_at

            FROM cat_product_presentations p

            INNER JOIN cat_products pr
                ON pr.id_product = p.id_product

            LEFT JOIN cat_flavors f
                ON f.id_flavor = p.id_flavor

            INNER JOIN cat_units u
                ON u.id_unit = p.id_unit

            ORDER BY
                pr.name,
                p.quantity
        `);

        return rows;
    }


    async getPresentationsAvailable() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                p.id_presentation,

                p.id_product,
                pr.name AS product_name,

                p.id_flavor,
                f.name AS flavor_name,

                p.id_unit,
                u.name AS unit_name,
                u.abbreviation AS unit_abbreviation,

                p.quantity,

                p.sku,
                p.barcode,
                p.price

            FROM cat_product_presentations p

            INNER JOIN cat_products pr
                ON pr.id_product = p.id_product

            LEFT JOIN cat_flavors f
                ON f.id_flavor = p.id_flavor

            INNER JOIN cat_units u
                ON u.id_unit = p.id_unit

            WHERE p.status = 1
              AND pr.status = 1

            ORDER BY
                pr.name,
                p.quantity
        `);

        return rows;
    }


    async getPresentationsByProduct(idProduct) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                p.id_presentation,

                p.id_product,
                pr.name AS product_name,

                p.id_flavor,
                f.name AS flavor_name,

                p.id_unit,
                u.name AS unit_name,
                u.abbreviation AS unit_abbreviation,

                p.quantity,

                p.sku,
                p.barcode,
                p.price,
                p.image_url,

                p.status

            FROM cat_product_presentations p

            INNER JOIN cat_products pr
                ON pr.id_product = p.id_product

            LEFT JOIN cat_flavors f
                ON f.id_flavor = p.id_flavor

            INNER JOIN cat_units u
                ON u.id_unit = p.id_unit

            WHERE p.id_product = ?

            ORDER BY
                p.quantity
        `, [idProduct]);

        return rows;
    }


    async getBySku(sku) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_presentation,
                sku
            FROM cat_product_presentations
            WHERE UPPER(TRIM(sku))
                = UPPER(TRIM(?))
            LIMIT 1
        `, [sku]);

        return rows.length
            ? rows[0]
            : null;
    }


    async getByBarcode(barcode) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_presentation,
                barcode
            FROM cat_product_presentations
            WHERE barcode = ?
            LIMIT 1
        `, [barcode]);

        return rows.length
            ? rows[0]
            : null;
    }


    async getProductVariant(
        idProduct,
        idFlavor,
        quantity,
        idUnit
    ) {

        const pool = await getConnectionDB();

        let sql = `
            SELECT
                id_presentation
            FROM cat_product_presentations
            WHERE id_product = ?
              AND quantity = ?
              AND id_unit = ?
        `;

        const params = [
            idProduct,
            quantity,
            idUnit
        ];


        if (
            idFlavor === null ||
            idFlavor === undefined
        ) {

            sql += `
                AND id_flavor IS NULL
            `;

        } else {

            sql += `
                AND id_flavor = ?
            `;

            params.push(idFlavor);
        }


        sql += `
            LIMIT 1
        `;


        const [rows] =
            await pool.execute(
                sql,
                params
            );

        return rows.length
            ? rows[0]
            : null;
    }


    async getProduct(idProduct) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_product,
                name,
                status
            FROM cat_products
            WHERE id_product = ?
        `, [idProduct]);

        return rows.length
            ? rows[0]
            : null;
    }


    async getFlavor(idFlavor) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_flavor,
                name,
                status
            FROM cat_flavors
            WHERE id_flavor = ?
        `, [idFlavor]);

        return rows.length
            ? rows[0]
            : null;
    }


    async getUnit(idUnit) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_unit,
                name,
                abbreviation
            FROM cat_units
            WHERE id_unit = ?
        `, [idUnit]);

        return rows.length
            ? rows[0]
            : null;
    }

}


module.exports = new PresentationModel();