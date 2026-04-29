const mfaService = require('../services/mfa.service');
const authService = require('../services/auth.service');
const { User } = require('../models');

// POST /api/mfa/setup — generates secret + QR code (user must be logged in)
const setupMFA = async (req, res) => {
  try {
    const user = req.user;
    if (user.mfaEnabled)
      return res.status(400).json({ success: false, message: 'MFA already enabled' });

    const secret = mfaService.generateSecret(user.email);
    const qrCode = await mfaService.generateQRCode(secret.otpauth_url);

    // Store encrypted secret temporarily (user must verify before it's saved permanently)
    const encrypted = mfaService.encryptSecret(secret.base32);
    await user.update({ mfaSecret: encrypted });

    res.json({
      success: true,
      qrCode,                  // data:image/png;base64,...
      manualKey: secret.base32, // for manual entry
      message: 'Scan the QR code with Google Authenticator, then call /mfa/verify-setup',
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/mfa/verify-setup — confirm TOTP works, enable MFA
const verifySetup = async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!user.mfaSecret)
      return res.status(400).json({ success: false, message: 'Setup MFA first' });

    const valid = mfaService.verifyToken(user.mfaSecret, token);
    if (!valid) return res.status(400).json({ success: false, message: 'Invalid code' });

    const backupCodes = mfaService.generateBackupCodes();
    await user.update({ mfaEnabled: true, mfaBackupCodes: backupCodes });

    res.json({
      success: true,
      message: 'MFA enabled successfully! Save these backup codes.',
      backupCodes,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/mfa/verify-login — complete login after MFA check
const verifyLogin = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.pendingUserId;

    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    // Check backup codes too
    if (user.mfaBackupCodes.includes(token)) {
      const newCodes = user.mfaBackupCodes.filter((c) => c !== token);
      await user.update({ mfaBackupCodes: newCodes });
    } else {
      const valid = mfaService.verifyToken(user.mfaSecret, token);
      if (!valid) return res.status(401).json({ success: false, message: 'Invalid MFA code' });
    }

    const accessToken = authService.generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = authService.generateRefreshToken({ userId: user.id });
    await authService.storeRefreshToken(user.id, refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, plan: user.plan, mfaEnabled: user.mfaEnabled },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/mfa/disable
const disableMFA = async (req, res) => {
  try {
    const { token } = req.body;
    const user = req.user;

    if (!user.mfaEnabled)
      return res.status(400).json({ success: false, message: 'MFA is not enabled' });

    const valid = mfaService.verifyToken(user.mfaSecret, token);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid MFA code' });

    await user.update({ mfaEnabled: false, mfaSecret: null, mfaBackupCodes: [] });
    res.json({ success: true, message: 'MFA disabled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { setupMFA, verifySetup, verifyLogin, disableMFA };
