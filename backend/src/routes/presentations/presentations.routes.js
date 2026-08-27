const express = require('express');

const PresentationController = require(
    '../../controllers/presentations/presentations.controller'
);

const router = express.Router();


router.get(
    '/',
    PresentationController.getAllPresentations
);


router.get(
    '/available',
    PresentationController.getPresentationsAvailable
);


router.get(
    '/product/:idProduct',
    PresentationController.getPresentationsByProduct
);


router.get(
    '/:id',
    PresentationController.getPresentation
);


router.post(
    '/',
    PresentationController.createPresentation
);


router.put(
    '/:id',
    PresentationController.updatePresentation
);


router.patch(
    '/:id/status',
    PresentationController.setStatus
);


router.delete(
    '/:id',
    PresentationController.deletePresentation
);


module.exports = router;