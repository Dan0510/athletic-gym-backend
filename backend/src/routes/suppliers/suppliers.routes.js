const express = require('express');
const SupplierController = require('../../controllers/suppliers/suppliers.controller');

const router = express.Router();

// Consultas
router.get('/', SupplierController.getAllSuppliers);
router.get('/available', SupplierController.getSuppliersAvailable);
router.get('/:id', SupplierController.getSupplier);

// CRUD
router.post('/', SupplierController.createSupplier);
router.put('/:id', SupplierController.updateSupplier);
router.patch('/:id/status', SupplierController.setStatus);
router.delete('/:id', SupplierController.deleteSupplier);

module.exports = router;