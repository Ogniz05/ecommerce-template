const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sendEmail } = require('../config/email');

router.post('/', [
  body('name').trim().notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('message').trim().isLength({ min: 10 })
], async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

    const { name, email, subject, message } = req.body;

    await sequelize.query(
      'INSERT INTO contact_messages (name, email, subject, message) VALUES (?, ?, ?, ?)',
      { replacements: [name, email, subject || null, message], type: QueryTypes.INSERT }
    );

    // [CUSTOMIZE] Insert your email address to receive messages
    await sendEmail({
      to: process.env.ADMIN_EMAIL || 'admin@yourcompany.com',
      subject: `Nuovo messaggio da ${name}: ${subject || 'Nessun oggetto'}`,
      html: `<p><strong>Nome:</strong> ${name}</p><p><strong>Email:</strong> ${email}</p><p><strong>Messaggio:</strong><br>${message.replace(/\n/g, '<br>')}</p>`
    });

    res.json({ success: true, message: 'Messaggio inviato! Ti risponderemo presto.' });
  } catch (error) { next(error); }
});

module.exports = router;
