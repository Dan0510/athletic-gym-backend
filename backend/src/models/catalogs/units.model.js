exports.getAllUnits = async (db) => {

    const [rows] = await db.query(`
        SELECT 
            id_unit,
            name,
            abbreviation,
            status
        FROM cat_units
        WHERE status !=2
        ORDER BY id_unit ASC
    `);

    return rows;
};

exports.getUnitsAvailable = async (db) => {

    const [rows] = await db.query(`
        SELECT 
            id_unit,
            name,
            abbreviation,
            status
        FROM cat_units
        WHERE status =1
        ORDER BY id_unit ASC
    `);

    return rows;
};