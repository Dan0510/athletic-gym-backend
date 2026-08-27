exports.getAllUnits = async (db) => {

    const [rows] = await db.query(`
        SELECT 
            id_unit,
            name,
            abbreviation
        FROM cat_units
        WHERE status = 1
        ORDER BY id_unit ASC
    `);

    return rows;
};