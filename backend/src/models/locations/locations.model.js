exports.getAllLocations = async (db) => {

    const [rows] = await db.query(`
        SELECT 
            id_location,
            name,
            status
        FROM cat_locations
        WHERE status !=2
        ORDER BY id_location ASC
    `);

    return rows;
};

exports.getLocationsAvailable = async (db) => {

    const [rows] = await db.query(`
        SELECT 
            id_location,
            name,
            status
        FROM cat_locations
        WHERE status =1
        ORDER BY id_location ASC
    `);

    return rows;
};