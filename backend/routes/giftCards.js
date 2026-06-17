const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');

function generateGiftCode() {
  const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
  return `GIFT-${seg()}-${seg()}-${seg()}`;
}

const ALLOWED_AMOUNTS = [10, 25, 50, 100, 150];

// POST /api/gift-cards/purchase — buy a gift card
router.post('/gift-cards/purchase', optionalAuth, async (req, res, next) => {
  try {
    const amount = parseFloat(req.body.amount);
    const recipient_email = req.body.recipient_email?.trim().toLowerCase() || null;
    const message = req.body.message?.trim()?.slice(0, 500) || null;

    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return res.status(400).json({ success: false, message: 'Importo non valido' });
    }

    let code;
    // Ensure unique code
    for (let i = 0; i < 5; i++) {
      code = generateGiftCode();
      const [existing] = await sequelize.query(
        'SELECT id FROM gift_cards WHERE code = ?',
        { replacements: [code], type: QueryTypes.SELECT }
      );
      if (!existing) break;
    }

    // Expires 1 year from now
    await sequelize.query(
      `INSERT INTO gift_cards (code, initial_amount, balance, status, purchaser_user_id, recipient_email, message, expires_at)
       VALUES (?, ?, ?, 'active', ?, ?, ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      { replacements: [code, amount, amount, req.user?.id || null, recipient_email, message], type: QueryTypes.INSERT }
    );

    // Email the recipient (or purchaser) with the code
    const notifyEmail = recipient_email || req.user?.email;
    if (notifyEmail) {
      sendEmail({ to: notifyEmail, ...emailTemplates.giftCard({ code, amount, message }) });
    }

    res.status(201).json({ success: true, code, amount, message: 'Gift card creata!' });
  } catch (error) { next(error); }
});

// GET /api/gift-cards/:code/balance — check balance
router.get('/gift-cards/:code/balance', async (req, res, next) => {
  try {
    const [card] = await sequelize.query(
      'SELECT code, balance, initial_amount, status, expires_at FROM gift_cards WHERE code = ?',
      { replacements: [req.params.code.toUpperCase()], type: QueryTypes.SELECT }
    );
    if (!card) return res.status(404).json({ success: false, message: 'Gift card non trovata' });
    res.json({ success: true, card });
  } catch (error) { next(error); }
});

// POST /api/gift-cards/validate — validate at checkout
router.post('/gift-cards/validate', async (req, res, next) => {
  try {
    const code = req.body.code?.trim().toUpperCase();
    if (!code) return res.status(400).json({ success: false, message: 'Codice mancante' });

    const [card] = await sequelize.query(
      `SELECT code, balance, status, expires_at FROM gift_cards WHERE code = ?`,
      { replacements: [code], type: QueryTypes.SELECT }
    );

    if (!card) return res.status(404).json({ success: false, message: 'Gift card non valida' });
    if (card.status !== 'active') return res.status(400).json({ success: false, message: 'Gift card non attiva' });
    if (parseFloat(card.balance) <= 0) return res.status(400).json({ success: false, message: 'Gift card esaurita' });
    if (card.expires_at && new Date(card.expires_at) < new Date()) {
      return res.status(400).json({ success: false, message: 'Gift card scaduta' });
    }

    res.json({ success: true, code: card.code, balance: parseFloat(card.balance) });
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.ALLOWED_AMOUNTS = ALLOWED_AMOUNTS;
