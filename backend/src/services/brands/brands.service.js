const BrandModel = require("../../models/brands/brands.model");

class BrandService {

    async createCategory(data) {

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre de la categoría es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const category = await CategoryModel.getCategoryByName(data.name);

        if (category) {
            const error = new Error("La categoría ya existe.");
            error.statusCode = 409;
            throw error;
        }

        return await CategoryModel.createCategory(data);
    }

    async updateCategory(id, data) {

        const category = await CategoryModel.getCategory(id);

        if (!category) {
            const error = new Error("La categoría no existe.");
            error.statusCode = 404;
            throw error;
        }

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre de la categoría es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const exists = await CategoryModel.getCategoryByName(data.name);

        if (exists && exists.id_category != id) {
            const error = new Error("Ya existe otra categoría con ese nombre.");
            error.statusCode = 409;
            throw error;
        }

        return await CategoryModel.updateCategory(id, data);
    }

    async deleteCategory(id) {

        const category = await CategoryModel.getCategory(id);

        if (!category) {
            const error = new Error("La categoría no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await CategoryModel.deleteCategory(id);
    }

    async getCategory(id) {

        const category = await CategoryModel.getCategory(id);

        if (!category) {
            const error = new Error("La categoría no existe.");
            error.statusCode = 404;
            throw error;
        }

        return category;
    }

    async getAllCategories() {

        return await CategoryModel.getAllCategories();
    }

    async getCategoriesAvailable() {

        return await CategoryModel.getCategoriesAvailable();
    }

    async setStatus(id, status) {

        const category = await CategoryModel.getCategory(id);

        if (!category) {
            const error = new Error("La categoría no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await CategoryModel.setStatus(id, status);
    }

}

module.exports = new CategoryService();