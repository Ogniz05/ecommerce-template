const passport = require('passport');
const { sequelize } = require('./database');
const { QueryTypes } = require('sequelize');

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy;

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.SERVER_URL || 'http://localhost:5000'}/api/auth/google/callback`,
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) return done(new Error('Email non disponibile dal profilo Google'));

      let [user] = await sequelize.query(
        'SELECT id, email, first_name, last_name, role, is_active, google_id FROM users WHERE google_id = ? OR email = ?',
        { replacements: [profile.id, email], type: QueryTypes.SELECT }
      );

      if (user) {
        if (!user.google_id) {
          await sequelize.query(
            'UPDATE users SET google_id = ?, is_verified = 1 WHERE id = ?',
            { replacements: [profile.id, user.id], type: QueryTypes.UPDATE }
          );
        }
      } else {
        const firstName = profile.name?.givenName || profile.displayName?.split(' ')[0] || 'Utente';
        const lastName = profile.name?.familyName || '';
        const avatar = profile.photos?.[0]?.value || null;

        const [newId] = await sequelize.query(
          `INSERT INTO users (email, first_name, last_name, password_hash, google_id, is_verified, is_active, avatar_url)
           VALUES (?, ?, ?, '', ?, 1, 1, ?)`,
          { replacements: [email, firstName, lastName, profile.id, avatar], type: QueryTypes.INSERT }
        );
        user = { id: newId, email, first_name: firstName, last_name: lastName, role: 'customer', is_active: 1 };
      }

      if (!user.is_active) return done(null, false, { message: 'Account disabilitato' });
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }));
}

module.exports = passport;
