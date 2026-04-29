const { verifyAccessToken } = require('../services/auth.service');
const { isTokenBlacklisted } = require('../services/redis.service');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token provided' });

    const token = auth.split(' ')[1];

    if (await isTokenBlacklisted(token))
      return res.status(401).json({ success: false, message: 'Token revoked' });

    const decoded = verifyAccessToken(token);

    if (decoded.mfaPending)
      return res.status(401).json({ success: false, message: 'Complete MFA verification first' });

    const user = await User.findByPk(decoded.userId);
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    req.user = user;
    req.token = token;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// Verify temp MFA token (used in /mfa/verify-login)
const authenticateMFATemp = (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    if (!auth?.startsWith('Bearer '))
      return res.status(401).json({ success: false, message: 'No token' });

    const token = auth.split(' ')[1];
    const { verifyAccessToken } = require('../services/auth.service');
    const decoded = verifyAccessToken(token);

    if (!decoded.mfaPending)
      return res.status(401).json({ success: false, message: 'Not a MFA temp token' });

    req.pendingUserId = decoded.userId;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid MFA temp token' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (req.user?.role !== role)
    return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
};

module.exports = { authenticate, authenticateMFATemp, requireRole };
