const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/low-stock', authenticate, isAdmin, async (req, res, next) => {
  try {
    const items = await sequelize.query(
      `SELECT p.id, p.name, p.image_url, p.sku, i.quantity, i.reserved, i.low_stock_threshold,
        (i.quantity - i.reserved) as available, w.name as warehouse_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       JOIN warehouses w ON i.warehouse_id = w.id
       WHERE (i.quantity - i.reserved) <= i.low_stock_threshold AND p.is_active = 1
       ORDER BY available ASC`,
      { type: QueryTypes.SELECT }
    );
    res.json({ success: true, items });
  } catch (error) { next(error); }
});

module.exports = router;
