const express = require('express');
const multer = require('multer');

const PresentationController = require(
    '../../controllers/presentations/presentations.controller'
);

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

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
    upload.single('image'),
    PresentationController.createPresentation
);


router.put(
    '/:id',
    upload.single('image'),
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