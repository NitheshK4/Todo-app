const router = require('express').Router();
const ctrl = require('../controllers/payment.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.get('/plans', ctrl.getPlans);
router.use(authenticate);
router.post('/create-order', ctrl.createOrder);
router.post('/verify', ctrl.verifyPayment);
router.get('/history', ctrl.getPaymentHistory);

module.exports = router;
