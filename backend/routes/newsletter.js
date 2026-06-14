const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

router.post('/subscribe', [body('email').isEmail().normalizeEmail()], async (req, res, next) => {
  try {
    const { email } = req.body;
    await sequelize.query(
      'INSERT INTO newsletter_subscribers (email) VALUES (?) ON DUPLICATE KEY UPDATE is_active = 1',
      { replacements: [email], type: QueryTypes.INSERT }
    );
    res.json({ success: true, message: 'Iscritto alla newsletter!' });
  } catch (error) { next(error); }
});

router.post('/unsubscribe', [body('email').isEmail().normalizeEmail()], async (req, res, next) => {
  try {
    const { email } = req.body;
    await sequelize.query('UPDATE newsletter_subscribers SET is_active = 0 WHERE email = ?', { replacements: [email], type: QueryTypes.UPDATE });
    res.json({ success: true, message: 'Disiscritto dalla newsletter' });
  } catch (error) { next(error); }
});

module.exports = router;
