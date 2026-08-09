const SupplierService = require("../../services/suppliers/suppliers.service");

class SupplierController {

    async createSupplier(req, res) {
        try {

            const result = await SupplierService.createSupplier(req.body);

            return res.status(201).json({
                success: true,
                message: "Proveedor creado correctamente.",
                data: result
            });

        } catch (error) {
            console.error("createSupplier:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async updateSupplier(req, res) {
        try {

            const { id } = req.params;

            const result = await SupplierService.updateSupplier(id, req.body);

            return res.status(200).json({
                success: true,
                message: "Proveedor actualizado correctamente.",
                data: result
            });

        } catch (error) {
            console.error("updateSupplier:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async deleteSupplier(req, res) {
        try {

            const { id } = req.params;

            await SupplierService.deleteSupplier(id);

            return res.status(200).json({
                success: true,
                message: "Proveedor eliminado correctamente."
            });

        } catch (error) {
            console.error("deleteSupplier:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getSupplier(req, res) {
        try {

            const { id } = req.params;

            const supplier = await SupplierService.getSupplier(id);

            return res.status(200).json({
                success: true,
                data: supplier
            });

        } catch (error) {
            console.error("getSupplier:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getAllSuppliers(req, res) {
        try {

            const suppliers = await SupplierService.getAllSuppliers();

            return res.status(200).json({
                success: true,
                data: suppliers
            });

        } catch (error) {
            console.error("getAllSuppliers:", error);

            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }

    async getSuppliersAvailable(req, res) {
        try {

            const suppliers = await SupplierService.getSuppliersAvailable();

            return res.status(200).json({
                success: true,
                data: suppliers
            });

        } catch (error) {
            console.error("getSuppliersAvailable:", error);

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

            await SupplierService.setStatus(id, status);

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

module.exports = new SupplierController();