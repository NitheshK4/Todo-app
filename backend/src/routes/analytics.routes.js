const router = require('express').Router();
const { getAnalytics } = require('../controllers/analytics.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { apiLimiter } = require('../middleware/rateLimit.middleware');

router.use(authenticate, apiLimiter);

router.get('/', getAnalytics);

module.exports = router;
