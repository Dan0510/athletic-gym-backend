const express = require('express');
const router = express.Router();

const LocationsController = require('../../controllers/locations/locations.controller');

router.get('/', LocationsController.getAllLocations);
router.get('/available', LocationsController.getLocationsAvailable);

module.exports = router;