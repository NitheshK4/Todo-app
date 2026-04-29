const router = require('express').Router();
const ctrl = require('../controllers/mfa.controller');
const { authenticate, authenticateMFATemp } = require('../middleware/auth.middleware');

router.post('/setup', authenticate, ctrl.setupMFA);
router.post('/verify-setup', authenticate, ctrl.verifySetup);
router.post('/verify-login', authenticateMFATemp, ctrl.verifyLogin);
router.post('/disable', authenticate, ctrl.disableMFA);

module.exports = router;
