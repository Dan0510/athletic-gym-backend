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