const express = require('express');

const ProductController = require(
    '../../controllers/products/products.controller'
);

const router = express.Router();


// Obtener todos
router.get(
    '/',
    ProductController.getAllProducts
);


// Obtener disponibles
router.get(
    '/available',
    ProductController.getProductsAvailable
);


// Obtener por categoría
router.get(
    '/category/:idCategory',
    ProductController.getProductsByCategory
);


// Obtener por marca
router.get(
    '/brand/:idBrand',
    ProductController.getProductsByBrand
);


// Obtener producto
router.get(
    '/:id',
    ProductController.getProduct
);


// Crear
router.post(
    '/',
    ProductController.createProduct
);


// Actualizar
router.put(
    '/:id',
    ProductController.updateProduct
);


// Cambiar estado
router.patch(
    '/:id/status',
    ProductController.setStatus
);


// Eliminar
router.delete(
    '/:id',
    ProductController.deleteProduct
);


module.exports = router;