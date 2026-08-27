const BrandModel = require("../../models/brands/brands.model");

class BrandService {

    async getAllBrands() {

        return await BrandModel.getAllBrands();
    }

    async getBrand(id) {

        const brand = await BrandModel.getBrand(id);

        if (!brand) {
            const error = new Error("La marca no existe.");
            error.statusCode = 404;
            throw error;
        }

        return brand;
    }

    async getBrandsAvailable() {

        return await BrandModel.getBrandsAvailable();
    }

    async getBrandsAvailableByCategory(id) {

        return await BrandModel.getBrandsAvailableByCategory(id);
    }

    async createBrand(data) {

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre de la marca es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const brand = await BrandModel.getBrandByName(data.name);

        if (brand) {
            const error = new Error("La marca ya existe.");
            error.statusCode = 409;
            throw error;
        }

        return await BrandModel.createBrand(data);
    }

    async updateBrand(id, data) {

        const brand = await BrandModel.getBrand(id);

        if (!brand) {
            const error = new Error("La marca no existe.");
            error.statusCode = 404;
            throw error;
        }

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre de la marca es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const exists = await BrandModel.getBrandByName(data.name);

        if (exists && exists.id_brand != id) {
            const error = new Error("Ya existe otra marca con ese nombre.");
            error.statusCode = 409;
            throw error;
        }

        return await BrandModel.updateBrand(id, data);
    }

    async deleteBrand(id) {

        const brand = await BrandModel.getBrand(id);

        if (!brand) {
            const error = new Error("La marca no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await BrandModel.deleteBrand(id);
    }

    async setStatus(id, status) {

        const brand = await BrandModel.getBrand(id);

        if (!brand) {
            const error = new Error("La marca no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await BrandModel.setStatus(id, status);
    }

}

module.exports = new BrandService();