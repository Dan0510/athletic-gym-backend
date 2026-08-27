const FlavorModel = require("../../models/flavors/flavors.model");

class FlavorService {

    async createFlavor(data) {

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre del sabor es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const flavor = await FlavorModel.getFlavorByName(data.name);

        if (flavor) {
            const error = new Error("El sabor ya existe.");
            error.statusCode = 409;
            throw error;
        }

        return await FlavorModel.createFlavor(data);
    }

    async updateFlavor(id, data) {

        const flavor = await FlavorModel.getFlavor(id);

        if (!flavor) {
            const error = new Error("El sabor no existe.");
            error.statusCode = 404;
            throw error;
        }

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre del sabor es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const exists = await FlavorModel.getFlavorByName(data.name);

        if (exists && exists.id_flavor != id) {
            const error = new Error("Ya existe otro sabor con ese nombre.");
            error.statusCode = 409;
            throw error;
        }

        return await FlavorModel.updateFlavor(id, data);
    }

    async deleteFlavor(id) {

        const flavor = await FlavorModel.getFlavor(id);

        if (!flavor) {
            const error = new Error("El sabor no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await FlavorModel.deleteFlavor(id);
    }

    async getFlavor(id) {

        const flavor = await FlavorModel.getFlavor(id);

        if (!flavor) {
            const error = new Error("El sabor no existe.");
            error.statusCode = 404;
            throw error;
        }

        return flavor;
    }

    async getAllFlavors() {

        return await FlavorModel.getAllFlavors();
    }

    async getFlavorsAvailable() {

        return await FlavorModel.getFlavorsAvailable();
    }

    async setStatus(id, status) {

        const flavor = await FlavorModel.getFlavor(id);

        if (!flavor) {
            const error = new Error("El sabor no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await FlavorModel.setStatus(id, status);
    }

}

module.exports = new FlavorService();