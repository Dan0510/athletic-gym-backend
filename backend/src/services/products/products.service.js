const ProductModel = require(
    '../../models/products/products.model'
);


class ProductService {


    async createProduct(data) {

        // Validar nombre
        if (
            !data.name ||
            data.name.trim() === ''
        ) {

            const error = new Error(
                'El nombre del producto es obligatorio.'
            );

            error.statusCode = 400;

            throw error;
        }


        // Validar categoría
        if (!data.id_category) {

            const error = new Error(
                'La categoría es obligatoria.'
            );

            error.statusCode = 400;

            throw error;
        }


        // Validar marca
        if (!data.id_brand) {

            const error = new Error(
                'La marca es obligatoria.'
            );

            error.statusCode = 400;

            throw error;
        }


        // Verificar categoría
        const category =
            await ProductModel.getCategory(
                data.id_category
            );

        if (!category) {

            const error = new Error(
                'La categoría no existe o está inactiva.'
            );

            error.statusCode = 404;

            throw error;
        }


        // Verificar marca
        const brand =
            await ProductModel.getBrand(
                data.id_brand
            );

        if (!brand) {

            const error = new Error(
                'La marca no existe o está inactiva.'
            );

            error.statusCode = 404;

            throw error;
        }


        // Verificar relación Marca-Categoría
        const brandCategory =
            await ProductModel.validateBrandCategory(
                data.id_brand,
                data.id_category
            );

        if (!brandCategory) {

            const error = new Error(
                'La marca no está relacionada con la categoría seleccionada.'
            );

            error.statusCode = 400;

            throw error;
        }


        // Verificar producto duplicado
        const exists =
            await ProductModel.getProductByName(
                data.name,
                data.id_brand
            );

        if (exists) {

            const error = new Error(
                'Ya existe un producto con ese nombre para esta marca.'
            );

            error.statusCode = 409;

            throw error;
        }


        return await ProductModel.createProduct(data);
    }


    async updateProduct(id, data) {

        const product =
            await ProductModel.getProduct(id);

        if (!product) {

            const error = new Error(
                'El producto no existe.'
            );

            error.statusCode = 404;

            throw error;
        }


        if (
            !data.name ||
            data.name.trim() === ''
        ) {

            const error = new Error(
                'El nombre del producto es obligatorio.'
            );

            error.statusCode = 400;

            throw error;
        }


        if (!data.id_category) {

            const error = new Error(
                'La categoría es obligatoria.'
            );

            error.statusCode = 400;

            throw error;
        }


        if (!data.id_brand) {

            const error = new Error(
                'La marca es obligatoria.'
            );

            error.statusCode = 400;

            throw error;
        }


        const category =
            await ProductModel.getCategory(
                data.id_category
            );

        if (!category) {

            const error = new Error(
                'La categoría no existe o está inactiva.'
            );

            error.statusCode = 404;

            throw error;
        }


        const brand =
            await ProductModel.getBrand(
                data.id_brand
            );

        if (!brand) {

            const error = new Error(
                'La marca no existe o está inactiva.'
            );

            error.statusCode = 404;

            throw error;
        }


        const brandCategory =
            await ProductModel.validateBrandCategory(
                data.id_brand,
                data.id_category
            );

        if (!brandCategory) {

            const error = new Error(
                'La marca no está relacionada con la categoría seleccionada.'
            );

            error.statusCode = 400;

            throw error;
        }


        const exists =
            await ProductModel.getProductByName(
                data.name,
                data.id_brand
            );

        if (
            exists &&
            exists.id_product != id
        ) {

            const error = new Error(
                'Ya existe otro producto con ese nombre para esta marca.'
            );

            error.statusCode = 409;

            throw error;
        }


        return await ProductModel.updateProduct(
            id,
            data
        );
    }


    async deleteProduct(id) {

        const product =
            await ProductModel.getProduct(id);

        if (!product) {

            const error = new Error(
                'El producto no existe.'
            );

            error.statusCode = 404;

            throw error;
        }


        return await ProductModel.deleteProduct(id);
    }


    async getProduct(id) {

        const product =
            await ProductModel.getProduct(id);

        if (!product) {

            const error = new Error(
                'El producto no existe.'
            );

            error.statusCode = 404;

            throw error;
        }


        return product;
    }


    async getAllProducts() {

        return await ProductModel.getAllProducts();
    }


    async getProductsAvailable() {

        return await ProductModel.getProductsAvailable();
    }


    async getProductsByCategory(idCategory) {

        return await ProductModel.getProductsByCategory(
            idCategory
        );
    }


    async getProductsByBrand(idBrand) {

        return await ProductModel.getProductsByBrand(
            idBrand
        );
    }


    async setStatus(id, status) {

        if (
            status !== 0 &&
            status !== 1 &&
            status !== '0' &&
            status !== '1'
        ) {

            const error = new Error(
                'El estado debe ser 0 o 1.'
            );

            error.statusCode = 400;

            throw error;
        }


        const product =
            await ProductModel.getProduct(id);

        if (!product) {

            const error = new Error(
                'El producto no existe.'
            );

            error.statusCode = 404;

            throw error;
        }


        return await ProductModel.setStatus(
            id,
            Number(status)
        );
    }

}


module.exports = new ProductService();