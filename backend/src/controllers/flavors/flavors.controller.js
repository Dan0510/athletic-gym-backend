const FlavorService = require("../../services/flavors/flavors.service");

class FlavorController {

    async createFlavor(req, res) {
        try {

            const result = await FlavorService.createFlavor(req.body);

            return res.status(201).json({
                success: true,
                message: "Sabor creado correctamente.",
                data: result
            });

        } catch (error) {
            console.error("createFlavor:", error);

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateFlavor(req, res) {
        try {

            const { id } = req.params;

            const result = await FlavorService.updateFlavor(id, req.body);

            return res.status(200).json({
                success: true,
                message: "Sabor actualizado correctamente.",
                data: result
            });

        } catch (error) {
            console.error("updateFlavor:", error);

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteFlavor(req, res) {
        try {

            const { id } = req.params;

            await FlavorService.deleteFlavor(id);

            return res.status(200).json({
                success: true,
                message: "Sabor eliminado correctamente."
            });

        } catch (error) {
            console.error("deleteFlavor:", error);

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }

    async getFlavor(req, res) {
        try {

            const { id } = req.params;

            const flavor = await FlavorService.getFlavor(id);

            return res.status(200).json({
                success: true,
                data: flavor
            });

        } catch (error) {
            console.error("getFlavor:", error);

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllFlavors(req, res) {
        try {

            const flavors = await FlavorService.getAllFlavors();

            return res.status(200).json({
                success: true,
                data: flavors
            });

        } catch (error) {
            console.error("getAllFlavors:", error);

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }

    async getFlavorsAvailable(req, res) {
        try {

            const flavors = await FlavorService.getFlavorsAvailable();

            return res.status(200).json({
                success: true,
                data: flavors
            });

        } catch (error) {
            console.error("getFlavorsAvailable:", error);

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

            await FlavorService.setStatus(id, status);

            return res.status(200).json({
                success: true,
                message: "Estado actualizado correctamente."
            });

        } catch (error) {
            console.error("setStatus:", error);

            return res.status(
                error.statusCode || 500
            ).json({
                success: false,
                message: error.message
            });
        }
    }

}

module.exports = new FlavorController();