const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET /api/users/profile
router.get('/profile', async (req, res, next) => {
  try {
    const [user] = await sequelize.query(
      'SELECT id, email, first_name, last_name, phone, avatar_url, role, is_verified, created_at FROM users WHERE id = ?',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    const addresses = await sequelize.query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    res.json({ success: true, user, addresses });
  } catch (error) { next(error); }
});

// PUT /api/users/profile
router.put('/profile', [
  body('first_name').trim().notEmpty(),
  body('last_name').trim().notEmpty(),
  body('phone').optional()
], async (req, res, next) => {
  try {
    const { first_name, last_name, phone } = req.body;
    await sequelize.query(
      'UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?',
      { replacements: [first_name, last_name, phone || null, req.user.id], type: QueryTypes.UPDATE }
    );
    const [user] = await sequelize.query(
      'SELECT id, email, first_name, last_name, phone, avatar_url, role, is_verified, created_at FROM users WHERE id = ?',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    res.json({ success: true, message: 'Profilo aggiornato', user });
  } catch (error) { next(error); }
});

// PUT /api/users/email
router.put('/email', [
  body('new_email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Email non valida' });

    const { new_email, password } = req.body;
    const [user] = await sequelize.query('SELECT password FROM users WHERE id = ?', { replacements: [req.user.id], type: QueryTypes.SELECT });
    if (!await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ success: false, message: 'Password non corretta' });
    }
    const [existing] = await sequelize.query('SELECT id FROM users WHERE email = ? AND id != ?', { replacements: [new_email, req.user.id], type: QueryTypes.SELECT });
    if (existing) return res.status(400).json({ success: false, message: 'Email già in uso' });

    await sequelize.query('UPDATE users SET email = ? WHERE id = ?', { replacements: [new_email, req.user.id], type: QueryTypes.UPDATE });
    const [updated] = await sequelize.query(
      'SELECT id, email, first_name, last_name, phone, avatar_url, role, is_verified, created_at FROM users WHERE id = ?',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    res.json({ success: true, message: 'Email aggiornata', user: updated });
  } catch (error) { next(error); }
});

// PUT /api/users/avatar
router.put('/avatar', async (req, res, next) => {
  try {
    const { avatar_url } = req.body;
    if (!avatar_url) return res.status(400).json({ success: false, message: 'Nessuna immagine' });
    if (avatar_url.length > 2 * 1024 * 1024) return res.status(400).json({ success: false, message: 'Immagine troppo grande (max 1.5MB)' });
    await sequelize.query('UPDATE users SET avatar_url = ? WHERE id = ?', { replacements: [avatar_url, req.user.id], type: QueryTypes.UPDATE });
    res.json({ success: true, message: 'Avatar aggiornato', avatar_url });
  } catch (error) { next(error); }
});

// PUT /api/users/password
router.put('/password', [
  body('current_password').notEmpty(),
  body('new_password').isLength({ min: 8 })
], async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body;
    const [user] = await sequelize.query('SELECT password FROM users WHERE id = ?', { replacements: [req.user.id], type: QueryTypes.SELECT });

    if (!await bcrypt.compare(current_password, user.password)) {
      return res.status(400).json({ success: false, message: 'Password attuale non corretta' });
    }

    const hashed = await bcrypt.hash(new_password, 12);
    await sequelize.query('UPDATE users SET password = ? WHERE id = ?', { replacements: [hashed, req.user.id], type: QueryTypes.UPDATE });
    res.json({ success: true, message: 'Password aggiornata' });
  } catch (error) { next(error); }
});

// GET /api/users/addresses
router.get('/addresses', async (req, res, next) => {
  try {
    const addresses = await sequelize.query(
      'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    res.json({ success: true, addresses });
  } catch (error) { next(error); }
});

// POST /api/users/addresses
router.post('/addresses', async (req, res, next) => {
  try {
    const { label, first_name, last_name, company, address_line1, address_line2, city, state, postal_code, country, phone, is_default } = req.body;

    if (is_default) {
      await sequelize.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', { replacements: [req.user.id], type: QueryTypes.UPDATE });
    }

    await sequelize.query(
      'INSERT INTO user_addresses (user_id, label, first_name, last_name, company, address_line1, address_line2, city, state, postal_code, country, phone, is_default) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      { replacements: [req.user.id, label||'Casa', first_name, last_name, company||null, address_line1, address_line2||null, city, state||null, postal_code, country||'IT', phone||null, is_default ? 1 : 0], type: QueryTypes.INSERT }
    );

    res.status(201).json({ success: true, message: 'Indirizzo aggiunto' });
  } catch (error) { next(error); }
});

// PUT /api/users/addresses/:id
router.put('/addresses/:id', async (req, res, next) => {
  try {
    const { label, first_name, last_name, company, address_line1, address_line2, city, state, postal_code, country, phone, is_default } = req.body;

    // Address must belong to the requesting user
    const [existing] = await sequelize.query(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ?',
      { replacements: [req.params.id, req.user.id], type: QueryTypes.SELECT }
    );
    if (!existing) return res.status(404).json({ success: false, message: 'Indirizzo non trovato' });

    if (is_default) {
      await sequelize.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', { replacements: [req.user.id], type: QueryTypes.UPDATE });
    }

    await sequelize.query(
      `UPDATE user_addresses SET label = ?, first_name = ?, last_name = ?, company = ?, address_line1 = ?,
        address_line2 = ?, city = ?, state = ?, postal_code = ?, country = ?, phone = ?, is_default = ?
       WHERE id = ? AND user_id = ?`,
      { replacements: [label||'Casa', first_name, last_name, company||null, address_line1, address_line2||null,
          city, state||null, postal_code, country||'IT', phone||null, is_default ? 1 : 0, req.params.id, req.user.id],
        type: QueryTypes.UPDATE }
    );

    res.json({ success: true, message: 'Indirizzo aggiornato' });
  } catch (error) { next(error); }
});

// DELETE /api/users/addresses/:id
router.delete('/addresses/:id', async (req, res, next) => {
  try {
    await sequelize.query('DELETE FROM user_addresses WHERE id = ? AND user_id = ?', { replacements: [req.params.id, req.user.id], type: QueryTypes.DELETE });
    res.json({ success: true, message: 'Indirizzo eliminato' });
  } catch (error) { next(error); }
});

// GET /api/users/wishlist
router.get('/wishlist', async (req, res, next) => {
  try {
    const wishlist = await sequelize.query(
      `SELECT w.id, w.created_at, p.id as product_id, p.name, p.price, p.compare_price, p.image_url, p.slug, p.avg_rating
       FROM wishlist w JOIN products p ON w.product_id = p.id
       WHERE w.user_id = ? AND p.is_active = 1
       ORDER BY w.created_at DESC`,
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    res.json({ success: true, wishlist });
  } catch (error) { next(error); }
});

module.exports = router;
