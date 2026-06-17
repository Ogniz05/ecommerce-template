const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate, optionalAuth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const { sendEmail, emailTemplates } = require('../config/email');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const { REDEEM_RATE, MIN_REDEEM, POINTS_PER_EURO } = require('./loyalty').config;

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

// POST /api/orders - Create order (authenticated or guest)
router.post('/', optionalAuth, async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { items, shipping_address, billing_address, shipping_method, coupon_code } = req.body;

    // Guest checkout: resolve or create user from shipping email
    if (!req.user) {
      const guestEmail = shipping_address?.email?.trim().toLowerCase();
      if (!guestEmail) {
        return res.status(400).json({ success: false, message: 'Email obbligatoria per il checkout ospite' });
      }
      let [existingUser] = await sequelize.query(
        'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE email = ?',
        { replacements: [guestEmail], type: QueryTypes.SELECT }
      );
      if (existingUser) {
        req.user = existingUser;
      } else {
        const tempHash = await bcrypt.hash(Math.random().toString(36), 10);
        const [newUserId] = await sequelize.query(
          `INSERT INTO users (email, first_name, last_name, password_hash, is_verified, is_active)
           VALUES (?, ?, ?, ?, 0, 1)`,
          {
            replacements: [guestEmail, shipping_address.first_name || 'Ospite', shipping_address.last_name || '', tempHash],
            type: QueryTypes.INSERT
          }
        );
        req.user = { id: newUserId, email: guestEmail, first_name: shipping_address.first_name || 'Ospite', last_name: shipping_address.last_name || '', role: 'customer' };
      }
    }

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
        `SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1
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
    let totalAmount = taxableAmount + shippingCost + taxAmount;

    // ── Loyalty points redemption ──
    let pointsRedeemed = 0;
    let pointsDiscount = 0;
    const requestedPoints = parseInt(req.body.points_to_redeem) || 0;
    if (requestedPoints >= MIN_REDEEM) {
      const [pointsUser] = await sequelize.query(
        'SELECT loyalty_points FROM users WHERE id = ?',
        { replacements: [req.user.id], type: QueryTypes.SELECT }
      );
      const balance = pointsUser?.loyalty_points || 0;
      if (requestedPoints <= balance) {
        pointsDiscount = Math.min(requestedPoints / REDEEM_RATE, totalAmount);
        pointsRedeemed = Math.round(pointsDiscount * REDEEM_RATE);
        totalAmount -= pointsDiscount;
      }
    }

    // ── Gift card redemption ──
    let giftCardAmount = 0;
    let giftCardCode = null;
    if (req.body.gift_card_code) {
      const code = req.body.gift_card_code.trim().toUpperCase();
      const [card] = await sequelize.query(
        "SELECT code, balance, status, expires_at FROM gift_cards WHERE code = ?",
        { replacements: [code], type: QueryTypes.SELECT }
      );
      if (card && card.status === 'active' && parseFloat(card.balance) > 0 &&
          (!card.expires_at || new Date(card.expires_at) >= new Date())) {
        giftCardAmount = Math.min(parseFloat(card.balance), totalAmount);
        giftCardCode = card.code;
        totalAmount -= giftCardAmount;
      }
    }

    totalAmount = Math.max(0, totalAmount);
    const pointsEarned = Math.floor(totalAmount * POINTS_PER_EURO);

    const orderNumber = generateOrderNumber();

    const [orderResult] = await sequelize.query(
      `INSERT INTO orders (user_id, order_number, status, subtotal, discount_amount, shipping_cost, tax_amount,
        total_amount, coupon_id, coupon_code, shipping_address, billing_address, shipping_method, payment_status,
        points_earned, points_redeemed, gift_card_code, gift_card_amount)
       VALUES (?, ?, 'pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      {
        replacements: [
          req.user.id, orderNumber, subtotal, discount, shippingCost, taxAmount, totalAmount,
          coupon ? coupon.id : null, coupon_code || null,
          JSON.stringify(shipping_address), JSON.stringify(billing_address || shipping_address),
          shippingData?.name || 'Standard',
          pointsEarned, pointsRedeemed, giftCardCode, giftCardAmount
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

    // ── Redeem loyalty points ──
    if (pointsRedeemed > 0) {
      await sequelize.query(
        'UPDATE users SET loyalty_points = GREATEST(0, loyalty_points - ?) WHERE id = ?',
        { replacements: [pointsRedeemed, req.user.id], type: QueryTypes.UPDATE, transaction }
      );
      await sequelize.query(
        `INSERT INTO loyalty_transactions (user_id, order_id, points, type, description)
         VALUES (?, ?, ?, 'redeem', ?)`,
        { replacements: [req.user.id, orderId, -pointsRedeemed, `Riscatto su ordine ${orderNumber}`], type: QueryTypes.INSERT, transaction }
      );
    }

    // ── Deduct gift card balance ──
    if (giftCardCode && giftCardAmount > 0) {
      await sequelize.query(
        `UPDATE gift_cards SET balance = GREATEST(0, balance - ?),
           status = CASE WHEN balance - ? <= 0 THEN 'used' ELSE status END
         WHERE code = ?`,
        { replacements: [giftCardAmount, giftCardAmount, giftCardCode], type: QueryTypes.UPDATE, transaction }
      );
    }

    // ── Earn loyalty points ──
    if (pointsEarned > 0) {
      await sequelize.query(
        'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
        { replacements: [pointsEarned, req.user.id], type: QueryTypes.UPDATE, transaction }
      );
      await sequelize.query(
        `INSERT INTO loyalty_transactions (user_id, order_id, points, type, description)
         VALUES (?, ?, ?, 'earn', ?)`,
        { replacements: [req.user.id, orderId, pointsEarned, `Punti da ordine ${orderNumber}`], type: QueryTypes.INSERT, transaction }
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
      pointsEarned,
      pointsRedeemed,
      giftCardAmount,
      message: 'Ordine creato con successo'
    });
  } catch (error) {
    await transaction.rollback();
    next(error);
  }
});

// GET /api/orders/:id/invoice - Download PDF invoice (auth via ?token= for window.open)
router.get('/:id/invoice', async (req, res, next) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(401).json({ success: false, message: 'Token mancante' });

    let userId;
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.id;
    } catch {
      return res.status(401).json({ success: false, message: 'Token non valido' });
    }

    const parseJSON = (v) => {
      if (!v) return {};
      if (typeof v === 'object') return v;
      try { return JSON.parse(v); } catch { return {}; }
    };

    const [order] = await sequelize.query(
      `SELECT o.*, u.first_name, u.last_name, u.email as user_email
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = ? AND o.user_id = ?`,
      { replacements: [req.params.id, userId], type: QueryTypes.SELECT }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    const items = await sequelize.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );

    const addr = parseJSON(order.shipping_address);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="fattura-${order.order_number}.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    doc.pipe(res);

    const brand = '#D8125B';
    const gray = '#6b7280';
    const dark = '#111827';

    // Header
    doc.fontSize(24).fillColor(brand).font('Helvetica-Bold').text('ShopTemplate', 50, 50);
    doc.fontSize(9).fillColor(gray).font('Helvetica').text('Via Example 1, 00100 Roma • info@shoptemplate.it', 50, 80);

    doc.moveTo(50, 100).lineTo(545, 100).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Invoice title + meta
    doc.fontSize(20).fillColor(dark).font('Helvetica-Bold').text('FATTURA', 50, 115);
    doc.fontSize(10).fillColor(gray).font('Helvetica')
      .text(`N. ${order.order_number}`, 50, 142)
      .text(`Data: ${new Date(order.created_at).toLocaleDateString('it-IT')}`, 50, 157)
      .text(`Stato pagamento: ${order.payment_status === 'paid' ? 'Pagato' : order.payment_status}`, 50, 172);

    // Customer info
    doc.fontSize(10).fillColor(gray).font('Helvetica').text('Intestatario:', 350, 115);
    doc.fontSize(10).fillColor(dark).font('Helvetica-Bold').text(
      `${addr.first_name || order.first_name || ''} ${addr.last_name || order.last_name || ''}`.trim() || order.user_email,
      350, 130
    );
    doc.fontSize(9).fillColor(gray).font('Helvetica');
    if (addr.address) doc.text(addr.address, 350, 145);
    if (addr.city) doc.text(`${addr.postal_code || ''} ${addr.city} ${addr.country || ''}`.trim(), 350, 158);
    doc.text(order.user_email, 350, 171);

    doc.moveTo(50, 200).lineTo(545, 200).strokeColor('#e5e7eb').lineWidth(1).stroke();

    // Table header
    const tableTop = 215;
    doc.fontSize(9).fillColor(gray).font('Helvetica-Bold')
      .text('PRODOTTO', 50, tableTop)
      .text('QTÀ', 340, tableTop, { align: 'center', width: 50 })
      .text('PREZZO', 400, tableTop, { align: 'right', width: 70 })
      .text('TOTALE', 480, tableTop, { align: 'right', width: 65 });

    doc.moveTo(50, tableTop + 14).lineTo(545, tableTop + 14).strokeColor('#f3f4f6').lineWidth(0.5).stroke();

    // Items
    let y = tableTop + 22;
    for (const item of items) {
      const name = item.variant_name ? `${item.product_name} (${item.variant_name})` : item.product_name;
      doc.fontSize(9).fillColor(dark).font('Helvetica')
        .text(name, 50, y, { width: 280 })
        .text(String(item.quantity), 340, y, { align: 'center', width: 50 })
        .text(`€ ${parseFloat(item.unit_price).toFixed(2)}`, 400, y, { align: 'right', width: 70 })
        .text(`€ ${parseFloat(item.total_price).toFixed(2)}`, 480, y, { align: 'right', width: 65 });
      y += 20;
      doc.moveTo(50, y - 2).lineTo(545, y - 2).strokeColor('#f9fafb').lineWidth(0.5).stroke();
    }

    // Totals
    y += 10;
    doc.moveTo(350, y).lineTo(545, y).strokeColor('#e5e7eb').lineWidth(1).stroke();
    y += 10;

    const totalRow = (label, value, isBold = false) => {
      doc.fontSize(9)
        .fillColor(isBold ? dark : gray)
        .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
        .text(label, 350, y, { align: 'right', width: 120 })
        .text(value, 480, y, { align: 'right', width: 65 });
      y += 16;
    };

    totalRow('Subtotale', `€ ${parseFloat(order.subtotal).toFixed(2)}`);
    if (parseFloat(order.discount_amount) > 0) totalRow('Sconto', `- € ${parseFloat(order.discount_amount).toFixed(2)}`);
    totalRow('Spedizione', parseFloat(order.shipping_cost) === 0 ? 'Gratuita' : `€ ${parseFloat(order.shipping_cost).toFixed(2)}`);
    totalRow('IVA 22%', `€ ${parseFloat(order.tax_amount).toFixed(2)}`);
    doc.moveTo(350, y).lineTo(545, y).strokeColor('#e5e7eb').lineWidth(0.5).stroke();
    y += 6;
    totalRow('TOTALE', `€ ${parseFloat(order.total_amount).toFixed(2)}`, true);

    // Footer
    doc.fontSize(8).fillColor(gray).font('Helvetica')
      .text('Grazie per il tuo acquisto!', 50, 750, { align: 'center', width: 495 })
      .text('Documento non fiscalmente valido. Per fattura fiscale contattare info@shoptemplate.it', 50, 763, { align: 'center', width: 495 });

    doc.end();
  } catch (error) { next(error); }
});

// PATCH /api/orders/:id/cancel - User cancels own order
router.patch('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const [order] = await sequelize.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      { replacements: [req.params.id, req.user.id], type: QueryTypes.SELECT }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });
    if (!['pending', 'processing'].includes(order.status)) {
      return res.status(400).json({ success: false, message: 'Ordine non annullabile (già spedito o consegnato)' });
    }

    await sequelize.query(
      "UPDATE orders SET status = 'cancelled', updated_at = NOW() WHERE id = ?",
      { replacements: [req.params.id], type: QueryTypes.UPDATE }
    );

    // Release reserved inventory
    const items = await sequelize.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );
    for (const item of items) {
      await sequelize.query(
        `UPDATE inventory SET reserved = GREATEST(0, reserved - ?)
         WHERE product_id = ? AND ${item.variant_id ? 'variant_id = ?' : 'variant_id IS NULL'}`,
        { replacements: item.variant_id ? [item.quantity, item.product_id, item.variant_id] : [item.quantity, item.product_id], type: QueryTypes.UPDATE }
      );
    }

    res.json({ success: true, message: 'Ordine annullato' });
  } catch (error) { next(error); }
});

module.exports = router;
