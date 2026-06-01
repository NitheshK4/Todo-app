const bcrypt = require('bcryptjs');
const passport = require('passport');
const { User } = require('../models');
const authService = require('../services/auth.service');
const redisService = require('../services/redis.service');
const { incrementLoginAttempts, resetLoginAttempts } = require('../services/redis.service');

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ success: false, message: 'Email already registered' });

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashed });

    res.status(201).json({
      success: true,
      message: 'Registered successfully',
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Brute-force protection
    const attempts = await incrementLoginAttempts(email);
    if (attempts > 10) {
      return res.status(429).json({ success: false, message: 'Account locked. Try again in 15 minutes.' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user || !user.password)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    await resetLoginAttempts(email);

    // If MFA is enabled, return temp token
    if (user.mfaEnabled) {
      const tempToken = authService.generateMFATempToken(user.id);
      return res.json({
        success: true,
        mfaRequired: true,
        tempToken,
        message: 'Enter your MFA code to continue',
      });
    }

    // Issue full tokens
    const accessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = authService.generateRefreshToken({ userId: user.id });
    await authService.storeRefreshToken(user.id, refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        plan: user.plan, 
        mfaEnabled: user.mfaEnabled,
        emailRemindersEnabled: user.emailRemindersEnabled,
        dailyDigestEnabled: user.dailyDigestEnabled
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/auth/refresh
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = authService.verifyRefreshToken(refreshToken);
    const stored = await authService.getStoredRefreshToken(decoded.userId);
    if (stored !== refreshToken)
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });

    const accessToken = authService.generateAccessToken({ userId: decoded.userId });
    res.json({ success: true, accessToken });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  try {
    await authService.revokeRefreshToken(req.user.id);
    // Blacklist current access token (~15 min remaining)
    await redisService.blacklistToken(req.token, 900);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/auth/me
const getMe = (req, res) => {
  const u = req.user;
  res.json({
    success: true,
    user: { 
      id: u.id, 
      name: u.name, 
      email: u.email, 
      plan: u.plan, 
      mfaEnabled: u.mfaEnabled, 
      role: u.role,
      emailRemindersEnabled: u.emailRemindersEnabled,
      dailyDigestEnabled: u.dailyDigestEnabled
    },
  });
};

// GET /api/auth/oauth/google
const googleOAuth = passport.authenticate('google', { scope: ['profile', 'email'], session: false });

// GET /api/auth/oauth/google/callback
const googleOAuthCallback = async (req, res) => {
  try {
    const user = req.user;
    if (user.mfaEnabled) {
      const tempToken = authService.generateMFATempToken(user.id);
      return res.redirect(`${process.env.FRONTEND_URL}/mfa-verify?token=${tempToken}`);
    }
    const accessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = authService.generateRefreshToken({ userId: user.id });
    await authService.storeRefreshToken(user.id, refreshToken);
    res.redirect(`${process.env.FRONTEND_URL}/oauth-callback?accessToken=${accessToken}&refreshToken=${refreshToken}`);
  } catch (err) {
    res.redirect(`${process.env.FRONTEND_URL}/login?error=oauth_failed`);
  }
};

module.exports = { register, login, refreshToken, logout, getMe, googleOAuth, googleOAuthCallback };
