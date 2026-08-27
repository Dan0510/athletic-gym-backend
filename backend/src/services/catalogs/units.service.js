const { getConnectionDB } = require("../../config/db/connection");

const UnitsModel = require('../../models/catalogs/units.model');

exports.getUnits = async () => {

    const db = await getConnectionDB();

    const units = await UnitsModel.getAllUnits(db);

    return {
        success: true,
        data: units
    };
};

 exports.getUnitsAvailable = async() => {

    return await UnitsModel.getUnitsAvailable();
};