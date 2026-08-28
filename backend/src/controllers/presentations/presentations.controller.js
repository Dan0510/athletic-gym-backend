const PresentationService = require(
    '../../services/presentations/presentations.service'
);


class PresentationController {


    async createPresentation(req, res, next) {

        try {

            const data = {
                id_product: req.body.id_product,
                id_flavor: req.body.id_flavor || null,
                quantity: req.body.quantity,
                id_unit: req.body.id_unit,
                barcode: req.body.barcode || null,
                price: req.body.price,
                status: req.body.status ?? 1,
                created_by: req.body.created_by || null,
                file: req.file
            };

            const presentation =
                await PresentationService.createPresentation(data);

            return res.status(201).json({
                success: true,
                message: 'Presentación creada correctamente.',
                data: presentation
            });

        } catch (error) {

            next(error);

        }
    }


    async updatePresentation(req, res) {

        try {

            const { id } = req.params;

            const data = {
                ...req.body,
                file: req.file
            };

            const result =
                await PresentationService.updatePresentation(
                    id,
                    data
                );

            return res.status(200).json({
                success: true,
                message: 'Presentación actualizada correctamente.',
                data: result
            });

        } catch (error) {

            console.error(
                'updatePresentation:',
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


    async deletePresentation(req, res) {

        try {

            const { id } = req.params;

            await PresentationService.deletePresentation(id);

            return res.status(200).json({
                success: true,
                message: 'Presentación eliminada correctamente.'
            });

        } catch (error) {

            console.error(
                'deletePresentation:',
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


    async getPresentation(req, res) {

        try {

            const { id } = req.params;

            const result =
                await PresentationService.getPresentation(id);

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {

            console.error(
                'getPresentation:',
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


    async getAllPresentations(req, res) {

        try {

            const result =
                await PresentationService.getAllPresentations();

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {

            console.error(
                'getAllPresentations:',
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


    async getPresentationsAvailable(req, res) {

        try {

            const result =
                await PresentationService
                    .getPresentationsAvailable();

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {

            console.error(
                'getPresentationsAvailable:',
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


    async getPresentationsByProduct(req, res) {

        try {

            const { idProduct } = req.params;

            const result =
                await PresentationService
                    .getPresentationsByProduct(idProduct);

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {

            console.error(
                'getPresentationsByProduct:',
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

            await PresentationService.setStatus(
                id,
                status
            );

            return res.status(200).json({
                success: true,
                message: 'Estado de la presentación actualizado correctamente.'
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


module.exports = new PresentationController();