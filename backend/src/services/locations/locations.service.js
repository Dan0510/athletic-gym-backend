const { getConnectionDB } = require("../../config/db/connection");

const LocationsModel = require('../../models/locations/locations.model');

exports.getAllLocations = async () => {

    const db = await getConnectionDB();

    const locations = await LocationsModel.getAllLocations(db);

    return {
        success: true,
        data: locations
    };
};

 exports.getLocationsAvailable = async() => {
    const db = await getConnectionDB();
    return await LocationsModel.getLocationsAvailable(db);
};