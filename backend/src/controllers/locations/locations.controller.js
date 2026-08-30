const LocationsService = require('../../services/locations/locations.service');

exports.getAllLocations = async (req, res) => {
    try {
        const result = await LocationsService.getAllLocations();
        res.json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getLocationsAvailable  = async (req, res) => {
        try {

            const locations = await LocationsService.getLocationsAvailable();

            return res.status(200).json({
                success: true,
                data: locations
            });

        } catch (error) {
            console.error("getLocationsAvailable:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
};