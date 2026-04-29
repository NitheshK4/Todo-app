const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

// Key must be 32 bytes (64 hex chars)
const getKey = () => {
  const keyHex = process.env.ENCRYPTION_KEY || '0'.repeat(64);
  return Buffer.from(keyHex, 'hex');
};

/**
 * Encrypt a string with AES-256-GCM
 * Returns: "iv:authTag:ciphertext" (all hex)
 */
const encrypt = (text) => {
  if (!text) return null;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
};

/**
 * Decrypt a string encrypted with AES-256-GCM
 */
const decrypt = (data) => {
  if (!data) return null;
  try {
    const [ivHex, tagHex, encrypted] = data.split(':');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(tagHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return null;
  }
};

module.exports = { encrypt, decrypt };
