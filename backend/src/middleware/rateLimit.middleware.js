const rateLimit = require('express-rate-limit');

// Auth routes: 10 requests per 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many requests, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// API routes: 100 requests per min per IP
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
});

module.exports = { authLimiter, apiLimiter };
