const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');

// Loyalty config — earn 1 point per €1 spent; redeem 100 points = €1
const POINTS_PER_EURO = 1;
const REDEEM_RATE = 100; // points per €1
const MIN_REDEEM = 100;  // minimum points to redeem

// GET /api/loyalty — balance + history
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [user] = await sequelize.query(
      'SELECT loyalty_points FROM users WHERE id = ?',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );

    const transactions = await sequelize.query(
      `SELECT lt.*, o.order_number
       FROM loyalty_transactions lt
       LEFT JOIN orders o ON lt.order_id = o.id
       WHERE lt.user_id = ?
       ORDER BY lt.created_at DESC LIMIT 50`,
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );

    const points = user?.loyalty_points || 0;
    res.json({
      success: true,
      points,
      value: parseFloat((points / REDEEM_RATE).toFixed(2)),
      config: { points_per_euro: POINTS_PER_EURO, redeem_rate: REDEEM_RATE, min_redeem: MIN_REDEEM },
      transactions
    });
  } catch (error) { next(error); }
});

// POST /api/loyalty/preview — compute discount for a points amount
router.post('/preview', authenticate, async (req, res, next) => {
  try {
    const points = parseInt(req.body.points) || 0;
    const [user] = await sequelize.query(
      'SELECT loyalty_points FROM users WHERE id = ?',
      { replacements: [req.user.id], type: QueryTypes.SELECT }
    );
    const balance = user?.loyalty_points || 0;

    if (points < MIN_REDEEM) {
      return res.status(400).json({ success: false, message: `Minimo ${MIN_REDEEM} punti per il riscatto` });
    }
    if (points > balance) {
      return res.status(400).json({ success: false, message: 'Punti insufficienti' });
    }

    res.json({ success: true, points, discount: parseFloat((points / REDEEM_RATE).toFixed(2)) });
  } catch (error) { next(error); }
});

module.exports = router;
module.exports.config = { POINTS_PER_EURO, REDEEM_RATE, MIN_REDEEM };
