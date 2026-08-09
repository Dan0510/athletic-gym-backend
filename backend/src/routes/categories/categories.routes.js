const express = require('express');
const CategoryController = require('../../controllers/categories/categories.controller');

const router = express.Router();

// Consultas
router.get('/', CategoryController.getAllCategories);
router.get('/available', CategoryController.getCategoriesAvailable);
router.get('/:id', CategoryController.getCategory);

// CRUD
router.post('/', CategoryController.createCategory);
router.put('/:id', CategoryController.updateCategory);
router.patch('/:id/status', CategoryController.setStatus);
router.delete('/:id', CategoryController.deleteCategory);

module.exports = router;