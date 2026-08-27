const PresentationModel = require(
    '../../models/presentations/presentations.model'
);


class PresentationService {


    async createPresentation(data) {

        if (!data.id_product) {

            const error = new Error(
                'El producto es obligatorio.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (!data.id_unit) {

            const error = new Error(
                'La unidad es obligatoria.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (
            data.quantity === undefined ||
            data.quantity === null ||
            Number(data.quantity) <= 0
        ) {

            const error = new Error(
                'La cantidad debe ser mayor a cero.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (!data.sku || data.sku.trim() === '') {

            const error = new Error(
                'El SKU es obligatorio.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (
            data.price === undefined ||
            data.price === null ||
            Number(data.price) < 0
        ) {

            const error = new Error(
                'El precio no puede ser negativo.'
            );

            error.statusCode = 400;
            throw error;
        }


        const product =
            await PresentationModel.getProduct(
                data.id_product
            );

        if (!product) {

            const error = new Error(
                'El producto no existe.'
            );

            error.statusCode = 404;
            throw error;
        }


        const unit =
            await PresentationModel.getUnit(
                data.id_unit
            );

        if (!unit) {

            const error = new Error(
                'La unidad no existe.'
            );

            error.statusCode = 404;
            throw error;
        }


        if (data.id_flavor) {

            const flavor =
                await PresentationModel.getFlavor(
                    data.id_flavor
                );

            if (!flavor) {

                const error = new Error(
                    'El sabor no existe.'
                );

                error.statusCode = 404;
                throw error;
            }
        }


        const sku =
            await PresentationModel.getBySku(
                data.sku
            );

        if (sku) {

            const error = new Error(
                'El SKU ya está registrado.'
            );

            error.statusCode = 409;
            throw error;
        }


        if (data.barcode) {

            const barcode =
                await PresentationModel.getByBarcode(
                    data.barcode
                );

            if (barcode) {

                const error = new Error(
                    'El código de barras ya está registrado.'
                );

                error.statusCode = 409;
                throw error;
            }
        }


        const variant =
            await PresentationModel.getProductVariant(
                data.id_product,
                data.id_flavor || null,
                data.quantity,
                data.id_unit
            );


        if (variant) {

            const error = new Error(
                'Ya existe una presentación con el mismo producto, sabor, cantidad y unidad.'
            );

            error.statusCode = 409;
            throw error;
        }


        return await PresentationModel.createPresentation(
            data
        );
    }


    async updatePresentation(id, data) {

        const presentation =
            await PresentationModel.getPresentation(id);

        if (!presentation) {

            const error = new Error(
                'La presentación no existe.'
            );

            error.statusCode = 404;
            throw error;
        }


        if (!data.id_product) {

            const error = new Error(
                'El producto es obligatorio.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (!data.id_unit) {

            const error = new Error(
                'La unidad es obligatoria.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (
            data.quantity === undefined ||
            data.quantity === null ||
            Number(data.quantity) <= 0
        ) {

            const error = new Error(
                'La cantidad debe ser mayor a cero.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (!data.sku || data.sku.trim() === '') {

            const error = new Error(
                'El SKU es obligatorio.'
            );

            error.statusCode = 400;
            throw error;
        }


        if (
            data.price === undefined ||
            data.price === null ||
            Number(data.price) < 0
        ) {

            const error = new Error(
                'El precio no puede ser negativo.'
            );

            error.statusCode = 400;
            throw error;
        }


        const sku =
            await PresentationModel.getBySku(
                data.sku
            );

        if (
            sku &&
            Number(sku.id_presentation) !== Number(id)
        ) {

            const error = new Error(
                'El SKU ya está registrado en otra presentación.'
            );

            error.statusCode = 409;
            throw error;
        }


        if (data.barcode) {

            const barcode =
                await PresentationModel.getByBarcode(
                    data.barcode
                );

            if (
                barcode &&
                Number(barcode.id_presentation) !== Number(id)
            ) {

                const error = new Error(
                    'El código de barras ya está registrado en otra presentación.'
                );

                error.statusCode = 409;
                throw error;
            }
        }


        const variant =
            await PresentationModel.getProductVariant(
                data.id_product,
                data.id_flavor || null,
                data.quantity,
                data.id_unit
            );


        if (
            variant &&
            Number(variant.id_presentation) !== Number(id)
        ) {

            const error = new Error(
                'Ya existe otra presentación con el mismo producto, sabor, cantidad y unidad.'
            );

            error.statusCode = 409;
            throw error;
        }


        return await PresentationModel.updatePresentation(
            id,
            data
        );
    }


    async deletePresentation(id) {

        const presentation =
            await PresentationModel.getPresentation(id);

        if (!presentation) {

            const error = new Error(
                'La presentación no existe.'
            );

            error.statusCode = 404;
            throw error;
        }


        return await PresentationModel.deletePresentation(
            id
        );
    }


    async getPresentation(id) {

        const presentation =
            await PresentationModel.getPresentation(id);

        if (!presentation) {

            const error = new Error(
                'La presentación no existe.'
            );

            error.statusCode = 404;
            throw error;
        }

        return presentation;
    }


    async getAllPresentations() {

        return await PresentationModel
            .getAllPresentations();
    }


    async getPresentationsAvailable() {

        return await PresentationModel
            .getPresentationsAvailable();
    }


    async getPresentationsByProduct(idProduct) {

        if (!idProduct) {

            const error = new Error(
                'El producto es obligatorio.'
            );

            error.statusCode = 400;
            throw error;
        }

        return await PresentationModel
            .getPresentationsByProduct(idProduct);
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


        const presentation =
            await PresentationModel.getPresentation(id);

        if (!presentation) {

            const error = new Error(
                'La presentación no existe.'
            );

            error.statusCode = 404;
            throw error;
        }


        return await PresentationModel.setStatus(
            id,
            Number(status)
        );
    }

}


module.exports = new PresentationService();