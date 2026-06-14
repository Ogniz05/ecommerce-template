const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

router.get('/', async (req, res, next) => {
  try {
    const { lang = 'it', subtotal } = req.query;
    const methods = await sequelize.query(
      'SELECT * FROM shipping_methods WHERE is_active = 1 ORDER BY sort_order',
      { type: QueryTypes.SELECT }
    );

    const enriched = methods.map(m => ({
      ...m,
      display_name: lang === 'en' && m.name_en ? m.name_en : m.name,
      effective_price: m.free_above && subtotal && parseFloat(subtotal) >= m.free_above ? 0 : m.price,
      is_free: m.free_above && subtotal ? parseFloat(subtotal) >= m.free_above : false
    }));

    res.json({ success: true, methods: enriched });
  } catch (error) { next(error); }
});

module.exports = router;
