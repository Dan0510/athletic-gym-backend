const BrandService = require("../../services/brands/brands.service");

class BrandController {

    async getAllBrands(req, res) {
        try {
    
            const brands = await BrandService.getAllBrands();
    
            return res.status(200).json({
                success: true,
                data: brands
            });
    
        } catch (error) {
            console.error("getAllBrands:", error);
    
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getBrand(req, res) {
        try {

            const { id } = req.params;

            const brand = await BrandService.getBrand(id);

            return res.status(200).json({
                success: true,
                data: brand
            });

        } catch (error) {
            console.error("getBrand:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getBrandsAvailable(req, res) {
        try {
            
            const brands = await BrandService.getBrandsAvailable();

            return res.status(200).json({
                success: true,
                data: brands
            });

        } catch (error) {
            console.error("getBrandsAvailable:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getBrandsAvailableByCategory(req, res) {
        try {

            const { id } = req.params;

            const brands = await BrandService.getBrandsAvailableByCategory(id);

            return res.status(200).json({
                success: true,
                data: brands
            });

        } catch (error) {
            console.error("getBrandsAvailableByCategory:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async createBrand(req, res) {
        try {

            const result = await BrandService.createBrand(req.body);

            return res.status(201).json({
                success: true,
                message: "Marca creada correctamente.",
                data: result
            });

        } catch (error) {
            console.error("createBrand:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateBrand(req, res) {
        try {

            const { id } = req.params;

            const result = await BrandService.updateBrand(id, req.body);

            return res.status(200).json({
                success: true,
                message: "Marca actualizada correctamente.",
                data: result
            });

        } catch (error) {
            console.error("updateBrand:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteBrand(req, res) {
        try {

            const { id } = req.params;

            await BrandService.deleteBrand(id);

            return res.status(200).json({
                success: true,
                message: "Marca eliminada correctamente."
            });

        } catch (error) {
            console.error("deleteBrand:", error);

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

            await BrandService.setStatus(id, status);

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

module.exports = new BrandController();