const router = require('express').Router();
const passport = require('passport');
const ctrl = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

router.post('/register', authLimiter, ctrl.register);
router.post('/login', authLimiter, ctrl.login);
router.post('/refresh', ctrl.refreshToken);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.getMe);

// Google OAuth
router.get('/oauth/google', ctrl.googleOAuth);
router.get('/oauth/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  ctrl.googleOAuthCallback
);

module.exports = router;
