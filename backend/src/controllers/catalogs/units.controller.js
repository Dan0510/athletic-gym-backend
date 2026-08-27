const UnitsService = require('../../services/catalogs/units.service');

exports.getUnits = async (req, res) => {
    try {
        const result = await UnitsService.getUnits();
        res.json(result);
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
};

exports.getUnitsAvailable  = async (req, res) => {
        try {

            const units = await UnitsService.getUnitsAvailable();

            return res.status(200).json({
                success: true,
                data: units
            });

        } catch (error) {
            console.error("getUnitsAvailable:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
};