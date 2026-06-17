const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { optionalAuth } = require('../middleware/auth');

// POST /api/products/:id/stock-alert — subscribe
router.post('/products/:id/stock-alert', optionalAuth, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const variantId = req.body.variant_id || null;
    const email = req.body.email?.trim().toLowerCase() || (req.user?.email);

    if (!email) return res.status(400).json({ success: false, message: 'Email obbligatoria' });

    const [product] = await sequelize.query(
      'SELECT id FROM products WHERE id = ? AND is_active = 1',
      { replacements: [productId], type: QueryTypes.SELECT }
    );
    if (!product) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });

    await sequelize.query(
      `INSERT IGNORE INTO stock_alerts (product_id, variant_id, email, user_id)
       VALUES (?, ?, ?, ?)`,
      { replacements: [productId, variantId, email, req.user?.id || null], type: QueryTypes.INSERT }
    );

    res.json({ success: true, message: 'Ti avviseremo quando il prodotto tornerà disponibile!' });
  } catch (error) { next(error); }
});

// DELETE /api/products/:id/stock-alert — unsubscribe
router.delete('/products/:id/stock-alert', optionalAuth, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const variantId = req.body.variant_id || req.query.variant_id || null;
    const email = req.body.email?.trim().toLowerCase() || req.query.email?.trim().toLowerCase() || req.user?.email;

    if (!email) return res.status(400).json({ success: false, message: 'Email obbligatoria' });

    await sequelize.query(
      variantId
        ? 'DELETE FROM stock_alerts WHERE product_id = ? AND variant_id = ? AND email = ?'
        : 'DELETE FROM stock_alerts WHERE product_id = ? AND variant_id IS NULL AND email = ?',
      {
        replacements: variantId ? [productId, variantId, email] : [productId, email],
        type: QueryTypes.DELETE
      }
    );

    res.json({ success: true, message: 'Iscrizione rimossa' });
  } catch (error) { next(error); }
});

// GET /api/products/:id/stock-alert — check if subscribed
router.get('/products/:id/stock-alert', optionalAuth, async (req, res, next) => {
  try {
    const productId = req.params.id;
    const email = req.query.email?.trim().toLowerCase() || req.user?.email;

    if (!email) return res.json({ success: true, subscribed: false });

    const [alert] = await sequelize.query(
      'SELECT id FROM stock_alerts WHERE product_id = ? AND email = ? AND notified_at IS NULL',
      { replacements: [productId, email], type: QueryTypes.SELECT }
    );

    res.json({ success: true, subscribed: !!alert });
  } catch (error) { next(error); }
});

module.exports = router;
