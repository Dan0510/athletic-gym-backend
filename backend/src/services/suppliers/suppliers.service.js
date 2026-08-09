const SupplierModel = require("../../models/suppliers/suppliers.model");

class SupplierService {

    async createSupplier(data) {

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre deL proveedor es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const supplier = await SupplierModel.getSupplierByName(data.name);

        if (supplier) {
            const error = new Error("El proveedor ya existe.");
            error.statusCode = 409;
            throw error;
        }

        return await SupplierModel.createSupplier(data);
    }

    async updateSupplier(id, data) {

        const supplier = await SupplierModel.getSupplier(id);

        if (!supplier) {
            const error = new Error("El proveedor no existe.");
            error.statusCode = 404;
            throw error;
        }

        if (!data.name || data.name.trim() === "") {
            const error = new Error("El nombre del proveedor es obligatorio.");
            error.statusCode = 400;
            throw error;
        }

        const exists = await SupplierModel.getSupplierByName(data.name);

        if (exists && exists.id_supplier != id) {
            const error = new Error("Ya existe otro proveedor con ese nombre.");
            error.statusCode = 409;
            throw error;
        }

        return await SupplierModel.updateSupplier(id, data);
    }

    async deleteSupplier(id) {

        const supplier = await SupplierModel.getSupplier(id);

        if (!supplier) {
            const error = new Error("El proveedor no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await SupplierModel.deleteSupplier(id);
    }

    async getSupplier(id) {

        const supplier = await SupplierModel.getSupplier(id);

        if (!supplier) {
            const error = new Error("El proveedor no existe.");
            error.statusCode = 404;
            throw error;
        }

        return supplier;
    }

    async getAllSuppliers() {

        return await SupplierModel.getAllSuppliers();
    }

    async getSuppliersAvailable() {

        return await SupplierModel.getSuppliersAvailable();
    }

    async setStatus(id, status) {

        const supplier = await SupplierModel.getSupplier(id);

        if (!supplier) {
            const error = new Error("El proveedor no existe.");
            error.statusCode = 404;
            throw error;
        }

        return await SupplierModel.setStatus(id, status);
    }

}

module.exports = new SupplierService();