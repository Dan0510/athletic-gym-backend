const PresentationService = require(
    '../../services/presentations/presentations.service'
);


class PresentationController {


    async createPresentation(req, res) {

        try {

            const result =
                await PresentationService.createPresentation(
                    req.body
                );

            return res.status(201).json({
                success: true,
                message: 'Presentación creada correctamente.',
                data: result
            });

        } catch (error) {

            console.error(
                'createPresentation:',
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


    async updatePresentation(req, res) {

        try {

            const { id } = req.params;

            const result =
                await PresentationService.updatePresentation(
                    id,
                    req.body
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