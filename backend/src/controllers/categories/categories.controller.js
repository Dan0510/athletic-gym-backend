const CategoryService = require("../../services/categories/categories.service");

class CategoryController {

    async createCategory(req, res) {
        try {

            const result = await CategoryService.createCategory(req.body);

            return res.status(201).json({
                success: true,
                message: "Categoría creada correctamente.",
                data: result
            });

        } catch (error) {
            console.error("createCategory:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateCategory(req, res) {
        try {

            const { id } = req.params;

            const result = await CategoryService.updateCategory(id, req.body);

            return res.status(200).json({
                success: true,
                message: "Categoría actualizada correctamente.",
                data: result
            });

        } catch (error) {
            console.error("updateCategory:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteCategory(req, res) {
        try {

            const { id } = req.params;

            await CategoryService.deleteCategory(id);

            return res.status(200).json({
                success: true,
                message: "Categoría eliminada correctamente."
            });

        } catch (error) {
            console.error("deleteCategory:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCategory(req, res) {
        try {

            const { id } = req.params;

            const category = await CategoryService.getCategory(id);

            return res.status(200).json({
                success: true,
                data: category
            });

        } catch (error) {
            console.error("getCategory:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllCategories(req, res) {
        try {

            const categories = await CategoryService.getAllCategories();

            return res.status(200).json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error("getAllCategories:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getCategoriesAvailable(req, res) {
        try {

            const categories = await CategoryService.getCategoriesAvailable();

            return res.status(200).json({
                success: true,
                data: categories
            });

        } catch (error) {
            console.error("getCategoriesAvailable:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async setStatus(req, res) {
        try {

            const { id } = req.params;
            const { status } = req.body;

            await CategoryService.setStatus(id, status);

            return res.status(200).json({
                success: true,
                message: "Estado actualizado correctamente."
            });

        } catch (error) {
            console.error("setStatus:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

}

module.exports = new CategoryController();