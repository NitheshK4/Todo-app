const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;

// Models are loaded after this config, so require lazily
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const { User } = require('../models');
        const email = profile.emails[0].value;

        let user = await User.findOne({ where: { email } });
        if (!user) {
          user = await User.create({
            email,
            name: profile.displayName,
            oauthProvider: 'google',
            oauthId: profile.id,
            isEmailVerified: true,
          });
        } else if (!user.oauthId) {
          await user.update({ oauthId: profile.id, oauthProvider: 'google' });
        }

        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

module.exports = passport;
