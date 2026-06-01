const { User } = require('../models');

/**
 * PUT /api/user/preferences
 * Update user notification settings
 */
const updatePreferences = async (req, res) => {
  try {
    const { emailRemindersEnabled, dailyDigestEnabled } = req.body;
    const userId = req.user.id;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    await user.update({
      ...(emailRemindersEnabled !== undefined && { emailRemindersEnabled }),
      ...(dailyDigestEnabled !== undefined && { dailyDigestEnabled }),
    });

    res.json({
      success: true,
      message: 'Notification preferences updated',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        plan: user.plan,
        mfaEnabled: user.mfaEnabled,
        role: user.role,
        emailRemindersEnabled: user.emailRemindersEnabled,
        dailyDigestEnabled: user.dailyDigestEnabled,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { updatePreferences };
