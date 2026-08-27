const express = require('express');
const router = express.Router();

router.use('/auth', require('./auth/auth.routes'));
router.use('/members', require('./members/members.routes'));
router.use('/payments', require('./payments/payments.routes'));
router.use('/memberships', require('./memberships/memberships.routes'));
router.use('/payments-methods', require('./payments/payments-methods.routes'));
router.use('/payment-folio', require('./payments/payments-folio.routes'));
router.use('/catalogs', require('./catalogs/unitMeasurement.routes'));
router.use('/users', require('./users/users.routes'));
router.use('/access', require('./access/access.routes'));
router.use('/reviews', require('./reviews/reviews.routes'));
router.use('/preregistration', require('./preregistration/preregistration.routes'));
router.use('/visits', require('./visits/visits.routes'));

router.use('/suppliers', require('./suppliers/suppliers.routes'));
router.use('/products', require('./products/products.routes'));


module.exports = router;