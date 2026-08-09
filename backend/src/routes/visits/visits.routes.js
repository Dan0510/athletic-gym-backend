const express = require('express');
const VisitsController = require('../../controllers/visits/visits.controller');

const router = express.Router();


// Registrar una visita
router.post('/create-visit', VisitsController.createVisit);

// Obtener todas las visitas
router.get('/get-all-visits', VisitsController.getAllVisits);

router.get(
    '/get-visit-types',
    VisitsController.getVisitTypes
);

router.get(
    '/search-members',
    VisitsController.searchMembers
);


// Cancelar una visita
router.post('/cancel-visit', VisitsController.cancelVisit);

// Obtener una visita por ID
router.get('/get-visit/:id_visit', VisitsController.getVisit);


// Historial de visitas de un socio
router.get(
    '/get-member-visit-history/:id_member',
    VisitsController.getMemberVisitHistory
);

// Historial de visitas de un visitante externo
router.get(
    '/get-external-visitor-history/:id_external_visitor',
    VisitsController.getExternalVisitorHistory
);

// Buscar visitantes externos (autocomplete)
router.get(
    '/search-external-visitors',
    VisitsController.searchExternalVisitors
);

// Reimprimir recibo
router.get(
    '/print-visit-receipt/:id_visit',
    VisitsController.printVisitReceipt
);


module.exports = router;