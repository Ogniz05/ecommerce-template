const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sendEmail, emailTemplates } = require('../config/email');
const { authenticate } = require('../middleware/auth');
const passport = require('../config/passport');

const generateToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password, first_name, last_name, phone } = req.body;

    const [existing] = await sequelize.query(
      'SELECT id FROM users WHERE email = ?',
      { replacements: [email], type: QueryTypes.SELECT }
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email già registrata' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const verifyToken = uuidv4();

    const [result] = await sequelize.query(
      `INSERT INTO users (email, password, first_name, last_name, phone, email_verify_token)
       VALUES (?, ?, ?, ?, ?, ?)`,
      { replacements: [email, hashedPassword, first_name, last_name, phone || null, verifyToken], type: QueryTypes.INSERT }
    );

    const userId = result;
    const verifyUrl = `${process.env.CLIENT_URL}/auth/verify-email?token=${verifyToken}`;

    await sendEmail({
      to: email,
      ...emailTemplates.emailVerification({ first_name }, verifyUrl)
    });

    const token = generateToken(userId, 'customer');
    res.status(201).json({
      success: true,
      message: 'Registrazione completata. Controlla email per verifica.',
      token,
      user: { id: userId, email, first_name, last_name, role: 'customer' }
    });
  } catch (error) { next(error); }
});

// POST /api/auth/login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, password } = req.body;

    const [user] = await sequelize.query(
      'SELECT * FROM users WHERE email = ?',
      { replacements: [email], type: QueryTypes.SELECT }
    );

    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MINUTES = 15;

    if (user?.locked_until && new Date(user.locked_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return res.status(429).json({ success: false, message: `Account bloccato. Riprova tra ${minutesLeft} minuti.` });
    }

    const passwordValid = user && await bcrypt.compare(password, user.password_hash || user.password);

    if (!user || !passwordValid) {
      if (user) {
        const attempts = (user.failed_login_attempts || 0) + 1;
        if (attempts >= MAX_ATTEMPTS) {
          await sequelize.query(
            'UPDATE users SET failed_login_attempts = ?, locked_until = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE id = ?',
            { replacements: [attempts, LOCKOUT_MINUTES, user.id], type: QueryTypes.UPDATE }
          );
          return res.status(429).json({ success: false, message: `Troppi tentativi. Account bloccato per ${LOCKOUT_MINUTES} minuti.` });
        }
        await sequelize.query(
          'UPDATE users SET failed_login_attempts = ? WHERE id = ?',
          { replacements: [attempts, user.id], type: QueryTypes.UPDATE }
        );
      }
      return res.status(401).json({ success: false, message: 'Credenziali non valide' });
    }

    if (!user.is_active) {
      return res.status(403).json({ success: false, message: 'Account disabilitato' });
    }

    await sequelize.query(
      'UPDATE users SET last_login = NOW(), failed_login_attempts = 0, locked_until = NULL WHERE id = ?',
      { replacements: [user.id], type: QueryTypes.UPDATE }
    );

    const token = generateToken(user.id, user.role);
    res.json({
      success: true,
      token,
      user: {
        id: user.id, email: user.email,
        first_name: user.first_name, last_name: user.last_name,
        role: user.role, is_verified: user.is_verified,
        avatar_url: user.avatar_url
      }
    });
  } catch (error) { next(error); }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [user] = await sequelize.query(
      'SELECT id, email, first_name, last_name, phone, role, is_verified, avatar_url, created_at FROM users WHERE id = ?',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    res.json({ success: true, user });
  } catch (error) { next(error); }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', [body('email').isEmail().normalizeEmail()], async (req, res, next) => {
  try {
    const { email } = req.body;
    const [user] = await sequelize.query(
      'SELECT id, first_name FROM users WHERE email = ?',
      { replacements: [email], type: QueryTypes.SELECT }
    );

    if (!user) {
      return res.json({ success: true, message: 'Se esiste un account, riceverai email.' });
    }

    const resetToken = uuidv4();
    const expires = new Date(Date.now() + 3600000); // 1 hour

    await sequelize.query(
      'UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?',
      { replacements: [resetToken, expires, user.id], type: QueryTypes.UPDATE }
    );

    const resetUrl = `${process.env.CLIENT_URL}/auth/reset-password?token=${resetToken}`;
    await sendEmail({ to: email, ...emailTemplates.passwordReset(user, resetUrl) });

    res.json({ success: true, message: 'Email di reset inviata.' });
  } catch (error) { next(error); }
});

// POST /api/auth/reset-password
router.post('/reset-password', [
  body('token').notEmpty(),
  body('password').isLength({ min: 8 })
], async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const [user] = await sequelize.query(
      'SELECT id FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()',
      { replacements: [token], type: QueryTypes.SELECT }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token non valido o scaduto' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await sequelize.query(
      'UPDATE users SET password = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?',
      { replacements: [hashedPassword, user.id], type: QueryTypes.UPDATE }
    );

    res.json({ success: true, message: 'Password aggiornata con successo.' });
  } catch (error) { next(error); }
});

// GET /api/auth/verify-email
router.get('/verify-email', async (req, res, next) => {
  try {
    const { token } = req.query;
    const [user] = await sequelize.query(
      'SELECT id FROM users WHERE email_verify_token = ?',
      { replacements: [token], type: QueryTypes.SELECT }
    );

    if (!user) {
      return res.status(400).json({ success: false, message: 'Token di verifica non valido' });
    }

    await sequelize.query(
      'UPDATE users SET is_verified = 1, email_verify_token = NULL WHERE id = ?',
      { replacements: [user.id], type: QueryTypes.UPDATE }
    );

    res.json({ success: true, message: 'Email verificata con successo!' });
  } catch (error) { next(error); }
});

// GET /api/auth/google — redirect to Google (only if configured)
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, message: 'Google Login non configurato' });
  }
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next);
});

// GET /api/auth/google/callback
router.get('/google/callback', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=google`);
  }
  passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL}/auth/login?error=google` },
    (err, user) => {
      if (err || !user) return res.redirect(`${process.env.CLIENT_URL}/auth/login?error=google`);
      const token = generateToken(user.id, user.role || 'customer');
      res.redirect(`${process.env.CLIENT_URL}/auth/social-callback?token=${token}`);
    }
  )(req, res, next);
});

module.exports = router;
