const { getConnectionDB } = require("../../config/db/connection");

class BrandModel {

    async createBrand(data) {

        const pool = await getConnectionDB();

        const connection = await pool.getConnection();

        try {

            await connection.beginTransaction();

            // Crear marca
            const [brandResult] = await connection.execute(`
                INSERT INTO cat_brands
                (
                    name,
                    description,
                    created_by
                )
                VALUES (?, ?, ?)
            `, [
                data.name.trim(),
                data.description || null,
                data.created_by || null
            ]);

            const idBrand = brandResult.insertId;

            // Crear relaciones con categorías
            if (Array.isArray(data.categories) && data.categories.length > 0) {

                const sqlCategory = `
                    INSERT INTO cat_brand_category
                    (
                        id_brand,
                        id_category,
                        created_by
                    )
                    VALUES (?, ?, ?)
                `;

                for (const idCategory of data.categories) {

                    await connection.execute(sqlCategory, [
                        idBrand,
                        idCategory,
                        data.created_by || null
                    ]);

                }
            }

            await connection.commit();

            return await this.getBrand(idBrand);

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
    }


    async updateBrand(id, data) {

        const pool = await getConnectionDB();

        const connection = await pool.getConnection();

        try {

            await connection.beginTransaction();

            // Actualizar marca
            await connection.execute(`
                UPDATE cat_brands
                SET
                    name = ?,
                    description = ?,
                    updated_by = ?
                WHERE id_brand = ?
            `, [
                data.name.trim(),
                data.description || null,
                data.updated_by || null,
                id
            ]);


            /*
             * Actualizamos las categorías únicamente
             * si vienen en el request.
             *
             * Esto permite hacer un update de la marca
             * sin modificar sus relaciones si categories
             * no fue enviado.
             */
            if (Array.isArray(data.categories)) {

                // Eliminar relaciones actuales
                await connection.execute(`
                    DELETE FROM cat_brand_category
                    WHERE id_brand = ?
                `, [id]);


                // Crear nuevas relaciones
                if (data.categories.length > 0) {

                    const sqlCategory = `
                        INSERT INTO cat_brand_category
                        (
                            id_brand,
                            id_category,
                            updated_by
                        )
                        VALUES (?, ?, ?)
                    `;

                    for (const idCategory of data.categories) {

                        await connection.execute(sqlCategory, [
                            id,
                            idCategory,
                            data.updated_by || null
                        ]);

                    }
                }
            }


            await connection.commit();

            return await this.getBrand(id);

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
    }


    async getBrand(id) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                b.id_brand,
                b.name,
                b.description,
                b.status,
                b.created_at,
                b.created_by,
                b.updated_at,
                b.updated_by
            FROM cat_brands b
            WHERE b.id_brand = ?
        `, [id]);

        if (rows.length === 0) {
            return null;
        }

        const brand = rows[0];

        const [categories] = await pool.execute(`
            SELECT
                c.id_category,
                c.name
            FROM cat_brand_category bc
            INNER JOIN cat_product_categories c
                ON c.id_category = bc.id_category
            WHERE bc.id_brand = ?
            ORDER BY c.name
        `, [id]);

        brand.categories = categories;

        return brand;
    }


    async getBrandByName(name) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                id_brand,
                name,
                description,
                status
            FROM cat_brands
            WHERE UPPER(TRIM(name)) = UPPER(TRIM(?))
            LIMIT 1
        `, [name]);

        return rows.length > 0 ? rows[0] : null;
    }


    async getAllBrands() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                b.id_brand,
                b.name,
                b.description,
                b.status,
                b.created_at,
                b.updated_at,
                GROUP_CONCAT(
                    DISTINCT c.name
                    ORDER BY c.name
                    SEPARATOR ', '
                ) AS categories
            FROM cat_brands b
            LEFT JOIN cat_brand_category bc
                ON bc.id_brand = b.id_brand
            LEFT JOIN cat_product_categories c
                ON c.id_category = bc.id_category
            WHERE b.status != 2
            GROUP BY
                b.id_brand,
                b.name,
                b.description,
                b.status,
                b.created_at,
                b.updated_at
            ORDER BY b.name
        `);

        return rows;
    }

    async getBrandsAvailable() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                b.id_brand,
                b.name,
                b.description,
                b.status,
                b.created_at,
                b.updated_at
            FROM cat_brands b
                WHERE b.status = 1
            ORDER BY b.name
        `);

        return rows;
    }


    async getBrandsAvailableByCategory(idCategory) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                b.id_brand,
                b.name,
                b.description,
                b.status
            FROM cat_brands b
            INNER JOIN cat_brand_category bc
                ON bc.id_brand = b.id_brand
            WHERE bc.id_category = ?
              AND b.status = 1
            ORDER BY b.name
        `, [idCategory]);

        return rows;
    }


    async setStatus(id, status) {

        const pool = await getConnectionDB();

        const [result] = await pool.execute(`
            UPDATE cat_brands
            SET
                status = ?
            WHERE id_brand = ?
        `, [
            status,
            id
        ]);

        return result.affectedRows > 0;
    }


    async deleteBrand(id) {

        const pool = await getConnectionDB();

        const connection = await pool.getConnection();

        try {

            await connection.beginTransaction();

            /*
             * Primero eliminamos las relaciones.
             */
            await connection.execute(`
                DELETE FROM cat_brand_category
                WHERE id_brand = ?
            `, [id]);


            /*
             * Baja lógica de la marca.
             */
            const [result] = await connection.execute(`
                UPDATE cat_brands
                SET
                    status = 0
                WHERE id_brand = ?
            `, [id]);


            await connection.commit();

            return result.affectedRows > 0;

        } catch (error) {

            await connection.rollback();

            throw error;

        } finally {

            connection.release();

        }
    }

}


module.exports = new BrandModel();