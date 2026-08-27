const ProductService = require(
    '../../services/products/products.service'
);


class ProductController {


    async createProduct(req, res) {

        try {

            const result =
                await ProductService.createProduct(req.body);

            return res.status(201).json({
                success: true,
                message: 'Producto creado correctamente.',
                data: result
            });

        } catch (error) {

            console.error(
                'createProduct:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async updateProduct(req, res) {

        try {

            const { id } = req.params;

            const result =
                await ProductService.updateProduct(
                    id,
                    req.body
                );

            return res.status(200).json({
                success: true,
                message: 'Producto actualizado correctamente.',
                data: result
            });

        } catch (error) {

            console.error(
                'updateProduct:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async deleteProduct(req, res) {

        try {

            const { id } = req.params;

            await ProductService.deleteProduct(id);

            return res.status(200).json({
                success: true,
                message: 'Producto eliminado correctamente.'
            });

        } catch (error) {

            console.error(
                'deleteProduct:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async getProduct(req, res) {

        try {

            const { id } = req.params;

            const product =
                await ProductService.getProduct(id);

            return res.status(200).json({
                success: true,
                data: product
            });

        } catch (error) {

            console.error(
                'getProduct:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async getAllProducts(req, res) {

        try {

            const products =
                await ProductService.getAllProducts();

            return res.status(200).json({
                success: true,
                data: products
            });

        } catch (error) {

            console.error(
                'getAllProducts:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async getProductsAvailable(req, res) {

        try {

            const products =
                await ProductService.getProductsAvailable();

            return res.status(200).json({
                success: true,
                data: products
            });

        } catch (error) {

            console.error(
                'getProductsAvailable:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async getProductsByCategory(req, res) {

        try {

            const { idCategory } = req.params;

            const products =
                await ProductService.getProductsByCategory(
                    idCategory
                );

            return res.status(200).json({
                success: true,
                data: products
            });

        } catch (error) {

            console.error(
                'getProductsByCategory:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async getProductsByBrand(req, res) {

        try {

            const { idBrand } = req.params;

            const products =
                await ProductService.getProductsByBrand(
                    idBrand
                );

            return res.status(200).json({
                success: true,
                data: products
            });

        } catch (error) {

            console.error(
                'getProductsByBrand:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }


    async setStatus(req, res) {

        try {

            const { id } = req.params;

            const { status } = req.body;

            await ProductService.setStatus(
                id,
                status
            );

            return res.status(200).json({
                success: true,
                message: 'Estado actualizado correctamente.'
            });

        } catch (error) {

            console.error(
                'setStatus:',
                error
            );

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }

}


module.exports = new ProductController();