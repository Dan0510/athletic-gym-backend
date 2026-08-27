const express = require('express');
const FlavorController = require('../../controllers/flavors/flavors.controller');

const router = express.Router();

// Consultas
router.get('/', FlavorController.getAllFlavors);
router.get('/available', FlavorController.getFlavorsAvailable);
router.get('/:id', FlavorController.getFlavor);

// CRUD
router.post('/', FlavorController.createFlavor);
router.put('/:id', FlavorController.updateFlavor);
router.patch('/:id/status', FlavorController.setStatus);
router.delete('/:id', FlavorController.deleteFlavor);

module.exports = router;