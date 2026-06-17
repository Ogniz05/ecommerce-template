const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');

// POST /api/coupons/validate
router.post('/validate', authenticate, async (req, res, next) => {
  try {
    const { code, subtotal } = req.body;

    const [coupon] = await sequelize.query(
      `SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1
       AND (valid_from IS NULL OR valid_from <= NOW())
       AND (valid_until IS NULL OR valid_until >= NOW())
       AND (max_uses IS NULL OR current_uses < max_uses)`,
      { replacements: [code], type: QueryTypes.SELECT }
    );

    if (!coupon) return res.status(404).json({ success: false, message: 'Codice sconto non valido o scaduto' });

    if (coupon.minimum_order > 0 && parseFloat(subtotal) < parseFloat(coupon.minimum_order)) {
      return res.status(400).json({ success: false, message: `Ordine minimo €${coupon.minimum_order} per questo codice` });
    }

    // Check user usage limit
    const [usage] = await sequelize.query(
      `SELECT COUNT(*) as uses FROM orders WHERE user_id = ? AND coupon_code = ? AND payment_status = 'paid'`,
      { replacements: [req.user.id, code], type: QueryTypes.SELECT }
    );

    if (coupon.max_uses_per_user && usage.uses >= coupon.max_uses_per_user) {
      return res.status(400).json({ success: false, message: 'Hai già usato questo codice' });
    }

    let discount = coupon.discount_type === 'percentage'
      ? parseFloat(subtotal) * (coupon.discount_value / 100)
      : parseFloat(coupon.discount_value);

    if (coupon.maximum_discount) discount = Math.min(discount, parseFloat(coupon.maximum_discount));

    res.json({
      success: true,
      coupon: {
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: parseFloat(discount.toFixed(2))
      }
    });
  } catch (error) { next(error); }
});

module.exports = router;
