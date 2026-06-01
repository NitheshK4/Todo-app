const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

router.use(authenticate, apiLimiter);

router.put('/preferences', ctrl.updatePreferences);

module.exports = router;
