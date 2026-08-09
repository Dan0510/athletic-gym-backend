const VisitsService = require('../../services/visits/visits.service');

exports.createVisit = async (req, res) => {
    try {
        const response = await VisitsService.createVisit(req);

        return res.status(201).json(response);

    } catch (error) {
        console.error('Error createVisit:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getAllVisits = async (req, res) => {
    try {
        const response = await VisitsService.getAllVisits(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error getAllVisits:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getVisit = async (req, res) => {
    try {
        const response = await VisitsService.getVisit(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error getVisit:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.cancelVisit = async (req, res) => {
    try {
        const response = await VisitsService.cancelVisit(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error cancelVisit:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getMemberVisitHistory = async (req, res) => {
    try {
        const response = await VisitsService.getMemberVisitHistory(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error getMemberVisitHistory:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getExternalVisitorHistory = async (req, res) => {
    try {
        const response = await VisitsService.getExternalVisitorHistory(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error getExternalVisitorHistory:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.searchExternalVisitors = async (req, res) => {
    try {
        const response = await VisitsService.searchExternalVisitors(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error searchExternalVisitors:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.searchMembers = async (req, res) => {
    try {
        const response = await VisitsService.searchMembers(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error searchMembers:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.getVisitTypes = async (req, res) => {
    try {
        const response = await VisitsService.getVisitTypes(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error getVisitTypes:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

exports.printVisitReceipt = async (req, res) => {
    try {
        const response = await VisitsService.printVisitReceipt(req);

        return res.status(200).json(response);

    } catch (error) {
        console.error('Error printVisitReceipt:', error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};