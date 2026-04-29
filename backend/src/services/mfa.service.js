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
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token: String(token),
    window: 1,
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
