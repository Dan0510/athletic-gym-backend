const express = require('express');
const router = express.Router();

const UnitsController = require('../../controllers/catalogs/units.controller');

router.get('/', UnitsController.getUnits);
router.get('/available', UnitsController.getUnitsAvailable);

module.exports = router;