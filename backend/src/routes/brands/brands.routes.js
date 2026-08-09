const express = require('express');
const BrandController = require('../../controllers/brands/brands.controller');

const router = express.Router();

// Consultas
router.get('/', BrandController.getAllBrands);
router.get('/available/', BrandController.getBrandsAvailable);
router.get('/available/category/:id', BrandController.getBrandsAvailableByCategory);
router.get('/:id', BrandController.getBrand);

// CRUD
router.post('/', BrandController.createBrand);
router.put('/:id', BrandController.updateBrand);
router.patch('/:id/status', BrandController.setStatus);
router.delete('/:id', BrandController.deleteBrand);

module.exports = router;