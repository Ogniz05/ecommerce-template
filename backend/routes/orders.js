const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');
const { sendEmail, emailTemplates } = require('../config/email');

// Generate order number
function generateOrderNumber() {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `ORD-${year}-${random}`;
}

// GET /api/orders - User's orders
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE o.user_id = ?';
    const replacements = [req.user.id];

    if (status) { where += ' AND o.status = ?'; replacements.push(status); }

    const [count] = await sequelize.query(
      `SELECT COUNT(*) as total FROM orders o ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );

    const orders = await sequelize.query(
      `SELECT o.*, COUNT(oi.id) as item_count
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT ? OFFSET ?`,
      { replacements: [...replacements, parseInt(limit), offset], type: QueryTypes.SELECT }
    );

    res.json({ success: true, orders, pagination: { total: count.total, page: parseInt(page) } });
  } catch (error) { next(error); }
});

// GET /api/orders/:id
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [order] = await sequelize.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      { replacements: [req.params.id, req.user.id], type: QueryTypes.SELECT }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    const items = await sequelize.query(
      `SELECT oi.*, p.image_url, p.slug
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );

    // mysql2 may already return JSON columns as objects; parse only strings
    const parseJSON = (v) => {
      if (!v) return {};
      if (typeof v === 'object') return v;
      try { return JSON.parse(v); } catch { return {}; }
    };
    order.shipping_address = parseJSON(order.shipping_address);
    order.billing_address = parseJSON(order.billing_address);

    res.json({ success: true, order, items });
  } catch (error) { next(error); }
});

// POST /api/orders - Create order
router.post('/', authenticate, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, shipping_address, billing_address, shipping_method, coupon_code } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Carrello vuoto' });
    }

    let subtotal = 0;
    let discount = 0;
    let coupon = null;

    // Validate items and calculate total
    const orderItems = [];
    for (const item of items) {
      const [product] = await sequelize.query(
        'SELECT * FROM products WHERE id = ? AND is_active = 1',
        { replacements: [item.product_id], type: QueryTypes.SELECT }
      );
      if (!product) throw new Error(`Prodotto ${item.product_id} non trovato`);

      let price = parseFloat(product.price);
      let variantName = null;

      if (item.variant_id) {
        const [variant] = await sequelize.query(
          'SELECT * FROM product_variants WHERE id = ? AND product_id = ?',
          { replacements: [item.variant_id, item.product_id], type: QueryTypes.SELECT }
        );
        if (variant) {
          price += parseFloat(variant.price_adjustment || 0);
          variantName = `${variant.type}: ${variant.value}`;
        }
      }

      // Check stock
      const [stock] = await sequelize.query(
        `SELECT SUM(quantity - reserved) as available FROM inventory
         WHERE product_id = ? AND ${item.variant_id ? 'variant_id = ?' : 'variant_id IS NULL'}`,
        { replacements: item.variant_id ? [item.product_id, item.variant_id] : [item.product_id], type: QueryTypes.SELECT }
      );

      if (!stock || stock.available < item.quantity) {
        throw new Error(`Stock insufficiente per ${product.name}`);
      }

      subtotal += price * item.quantity;
      orderItems.push({
        product_id: item.product_id,
        variant_id: item.variant_id || null,
        product_name: product.name,
        variant_name: variantName,
        quantity: item.quantity,
        unit_price: price,
        total_price: price * item.quantity
      });
    }

    // Apply coupon
    if (coupon_code) {
      const [couponData] = await sequelize.query(
        `SELECT * FROM coupons WHERE code = ? AND is_active = 1
         AND (valid_from IS NULL OR valid_from <= NOW())
         AND (valid_until IS NULL OR valid_until >= NOW())
         AND (max_uses IS NULL OR current_uses < max_uses)
         AND minimum_order <= ?`,
        { replacements: [coupon_code, subtotal], type: QueryTypes.SELECT }
      );

      if (couponData) {
        coupon = couponData;
        discount = couponData.discount_type === 'percentage'
          ? subtotal * (couponData.discount_value / 100)
          : parseFloat(couponData.discount_value);
        if (couponData.maximum_discount) discount = Math.min(discount, couponData.maximum_discount);
      }
    }

    // Get shipping cost
    const [shippingData] = await sequelize.query(
      'SELECT * FROM shipping_methods WHERE id = ?',
      { replacements: [shipping_method || 1], type: QueryTypes.SELECT }
    );

    let shippingCost = shippingData ? parseFloat(shippingData.price) : 4.99;
    if (shippingData?.free_above && subtotal >= shippingData.free_above) shippingCost = 0;

    const taxRate = 0.22;
    const taxableAmount = subtotal - discount;
    const taxAmount = taxableAmount * taxRate;
    const totalAmount = taxableAmount + shippingCost + taxAmount;

    const orderNumber = generateOrderNumber();

    const [orderResult] = await sequelize.query(
      `INSERT INTO orders (user_id, order_number, status, subtotal, discount_amount, shipping_cost, tax_amount,
        total_amount, coupon_id, coupon_code, shipping_address, billing_address, shipping_method, payment_status)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      {
        replacements: [
          req.user.id, orderNumber, subtotal, discount, shippingCost, taxAmount, totalAmount,
          coupon ? coupon.id : null, coupon_code || null,
          JSON.stringify(shipping_address), JSON.stringify(billing_address || shipping_address),
          shippingData?.name || 'Standard'
        ],
        type: QueryTypes.INSERT,
        transaction
      }
    );

    const orderId = orderResult;

    // Insert order items
    for (const item of orderItems) {
      await sequelize.query(
        'INSERT INTO order_items (order_id, product_id, variant_id, product_name, variant_name, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        { replacements: [orderId, item.product_id, item.variant_id, item.product_name, item.variant_name, item.quantity, item.unit_price, item.total_price], type: QueryTypes.INSERT, transaction }
      );

      // Reserve inventory
      await sequelize.query(
        `UPDATE inventory SET reserved = reserved + ?
         WHERE product_id = ? AND ${item.variant_id ? 'variant_id = ?' : 'variant_id IS NULL'}`,
        { replacements: item.variant_id ? [item.quantity, item.product_id, item.variant_id] : [item.quantity, item.product_id], type: QueryTypes.UPDATE, transaction }
      );
    }

    // Update coupon usage
    if (coupon) {
      await sequelize.query(
        'UPDATE coupons SET current_uses = current_uses + 1 WHERE id = ?',
        { replacements: [coupon.id], type: QueryTypes.UPDATE, transaction }
      );
    }

    await transaction.commit();

    const [user] = await sequelize.query('SELECT * FROM users WHERE id = ?', { replacements: [req.user.id], type: QueryTypes.SELECT });
    sendEmail({ to: user.email, ...emailTemplates.orderConfirmation({ order_number: orderNumber, total_amount: totalAmount, created_at: new Date() }, user) });

    res.status(201).json({
      success: true,
      orderId,
      orderNumber,
      totalAmount,
      message: 'Ordine creato con successo'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

module.exports = router;
