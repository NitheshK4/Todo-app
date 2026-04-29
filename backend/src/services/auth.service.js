const jwt = require('jsonwebtoken');
const redis = require('../config/redis');

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access-fallback-secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh-fallback-secret';
const ACCESS_EXPIRY = process.env.JWT_ACCESS_EXPIRY || '15m';
const REFRESH_EXPIRY = process.env.JWT_REFRESH_EXPIRY || '7d';

const generateAccessToken = (payload) =>
  jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRY });

const generateRefreshToken = (payload) =>
  jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRY });

const verifyAccessToken = (token) => jwt.verify(token, ACCESS_SECRET);
const verifyRefreshToken = (token) => jwt.verify(token, REFRESH_SECRET);

// Store refresh token in Redis whitelist (7 days)
const storeRefreshToken = (userId, token) =>
  redis.setex(`refresh:${userId}`, 7 * 24 * 60 * 60, token);

const getStoredRefreshToken = (userId) => redis.get(`refresh:${userId}`);

const revokeRefreshToken = (userId) => redis.del(`refresh:${userId}`);

// Temp token issued after password check, before MFA step (5 min TTL)
const generateMFATempToken = (userId) =>
  jwt.sign({ userId, mfaPending: true }, ACCESS_SECRET, { expiresIn: '5m' });

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  storeRefreshToken,
  getStoredRefreshToken,
  revokeRefreshToken,
  generateMFATempToken,
};
