const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const crypto = require('crypto');
const { encrypt, decrypt } = require('./crypto.service');

/** Generate a new TOTP secret */
const generateSecret = (userEmail) =>
  speakeasy.generateSecret({
    name: `TodoApp (${userEmail})`,
    issuer: 'TodoApp Enterprise',
    length: 20,
  });

/** Convert secret otpauth URL to QR Code data URL */
const generateQRCode = (otpauthUrl) => QRCode.toDataURL(otpauthUrl);

/** Verify a 6-digit TOTP token (1 window = 30s tolerance) */
const verifyToken = (encryptedSecret, token) => {
  const secret = decrypt(encryptedSecret);
  if (!secret) return false;
  
  // Sanitize token: remove whitespace and non-digits
  const sanitizedToken = String(token).trim().replace(/\D/g, '');

  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: sanitizedToken,
    window: 3, // Increased from 1 to 3 to handle small time skew offsets
  });
};

/** Encrypt TOTP secret for DB storage */
const encryptSecret = (base32Secret) => encrypt(base32Secret);

/** Generate 8 one-time backup codes */
const generateBackupCodes = () =>
  Array.from({ length: 8 }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase()
  );

module.exports = {
  generateSecret,
  generateQRCode,
  verifyToken,
  encryptSecret,
  generateBackupCodes,
};
