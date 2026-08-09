const { getConnectionDB } = require("../../config/db/connection");

class SupplierModel {

    async createSupplier(data) {

        const pool = await getConnectionDB();

        const sql = `
        INSERT INTO cat_suppliers
        (
            name,
            business_name,
            rfc,
            contact_name,
            phone,
            email,
            address,
            created_by
        )
        VALUES (?,?,?,?,?,?,?,?)
    `;

        const [result] = await pool.execute(sql,[
        data.name,
        data.business_name,
        data.rfc,
        data.contact_name,
        data.phone,
        data.email,
        data.address,
        data.created_by
    ]);

        return {
            id_supplier: result.insertId
        };
    }

    async updateSupplier(id, data) {

        const pool = await getConnectionDB();

        const sql = `
        UPDATE cat_suppliers
        SET
            name=?,
            business_name=?,
            rfc=?,
            contact_name=?,
            phone=?,
            email=?,
            address=?,
            updated_by=?
        WHERE id_supplier=?
        `;


        const [result] = await pool.execute(sql,[
            data.name,
            data.business_name,
            data.rfc,
            data.contact_name,
            data.phone,
            data.email,
            data.address,
            data.updated_by,
            id
        ]);

        return result.affectedRows;
    }

    async deleteSupplier(id) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_suppliers
            SET
                status = 0
            WHERE id_supplier = ?
        `;

        await pool.execute(sql, [id]);

        return true;
    }

    async setStatus(id, status) {

        const pool = await getConnectionDB();

        const sql = `
            UPDATE cat_suppliers
            SET
                status = ?
            WHERE id_supplier = ?
        `;

        await pool.execute(sql, [
            status,
            id
        ]);

        return true;
    }

    async getSupplier(id) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT
                *
            FROM cat_suppliers
            WHERE id_supplier = ?
        `, [id]);

        return rows.length ? rows[0] : null;
    }

    async getSupplierByName(name) {

        const pool = await getConnectionDB();

        const [rows] = await pool.execute(`
            SELECT *
            FROM cat_suppliers
            WHERE UPPER(name)=UPPER(?)
            LIMIT 1
        `, [name]);

        return rows.length ? rows[0] : null;
    }

    async getAllSuppliers() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                *
            FROM cat_suppliers
            WHERE status !=2
            ORDER BY name
        `);

        return rows;
    }

    async getSuppliersAvailable() {

        const pool = await getConnectionDB();

        const [rows] = await pool.query(`
            SELECT
                id_supplier,
                name
            FROM cat_suppliers
            WHERE status = 1
            ORDER BY name
        `);

        return rows;
    }

}

module.exports = new SupplierModel();