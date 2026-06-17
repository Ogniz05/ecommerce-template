const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate, isAdmin, isAdminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const sharp = require('sharp');
const fs = require('fs');
const { sendEmail, emailTemplates } = require('../config/email');

// authenticate + read-level access (admin OR moderator) for the whole router.
// Individual write routes and admin-only panels add isAdminOnly on top.
router.use(authenticate, isAdmin);

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/products');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Solo immagini permesse'));
}});

// ─── DASHBOARD ───────────────────────────────────────────────────────────────

router.get('/dashboard', isAdminOnly, async (req, res, next) => {
  try {
    const [revenue] = await sequelize.query(
      `SELECT
        SUM(CASE WHEN DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END) as today_revenue,
        SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as month_revenue,
        SUM(CASE WHEN YEAR(created_at) = YEAR(CURDATE()) THEN total_amount ELSE 0 END) as year_revenue,
        COUNT(*) as total_orders,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_orders,
        SUM(CASE WHEN payment_status = 'paid' THEN total_amount ELSE 0 END) as total_revenue
       FROM orders`,
      { type: QueryTypes.SELECT }
    );

    const [users] = await sequelize.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as today FROM users WHERE role = "customer"',
      { type: QueryTypes.SELECT }
    );

    const [products] = await sequelize.query(
      'SELECT COUNT(*) as total, SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive FROM products',
      { type: QueryTypes.SELECT }
    );

    const lowStock = await sequelize.query(
      `SELECT p.id, p.name, p.image_url, SUM(i.quantity - i.reserved) as stock
       FROM products p JOIN inventory i ON i.product_id = p.id AND i.variant_id IS NULL
       WHERE p.is_active = 1
       GROUP BY p.id HAVING stock <= 5 ORDER BY stock ASC LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    const recentOrders = await sequelize.query(
      `SELECT o.*, u.first_name, u.last_name, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    // Monthly revenue chart (last 12 months)
    const salesChart = await sequelize.query(
      `SELECT DATE_FORMAT(created_at, '%Y-%m') as month, SUM(total_amount) as revenue, COUNT(*) as orders
       FROM orders WHERE payment_status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY month ORDER BY month`,
      { type: QueryTypes.SELECT }
    );

    const topProducts = await sequelize.query(
      `SELECT p.id, p.name, p.image_url, p.price, p.total_sold, p.avg_rating,
        SUM(oi.total_price) as total_revenue
       FROM products p
       JOIN order_items oi ON oi.product_id = p.id
       JOIN orders o ON oi.order_id = o.id AND o.payment_status = 'paid'
       GROUP BY p.id ORDER BY total_revenue DESC LIMIT 5`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      success: true,
      stats: { ...revenue, users: users.total, today_users: users.today, products: products.total },
      lowStock, recentOrders, salesChart, topProducts
    });
  } catch (error) { next(error); }
});

// ─── PRODUCTS ────────────────────────────────────────────────────────────────

router.get('/products', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, category, status, min_price, max_price, stock_level, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const replacements = [];

    if (search) { where += ' AND (p.name LIKE ? OR p.sku LIKE ?)'; replacements.push(`%${search}%`, `%${search}%`); }
    if (category) { where += ' AND p.category_id = ?'; replacements.push(category); }
    if (status === 'active') { where += ' AND p.is_active = 1'; }
    else if (status === 'inactive') { where += ' AND p.is_active = 0'; }
    if (min_price) { where += ' AND p.price >= ?'; replacements.push(parseFloat(min_price)); }
    if (max_price) { where += ' AND p.price <= ?'; replacements.push(parseFloat(max_price)); }

    // stock_level filter applied via HAVING after GROUP BY
    const stockHaving = stock_level === 'critical' ? 'HAVING total_stock <= 5'
      : stock_level === 'low' ? 'HAVING total_stock > 5 AND total_stock <= 20'
      : stock_level === 'ok' ? 'HAVING total_stock > 20'
      : stock_level === 'zero' ? 'HAVING total_stock = 0'
      : '';

    const orderBy = sort === 'price_asc' ? 'p.price ASC'
      : sort === 'price_desc' ? 'p.price DESC'
      : sort === 'stock_asc' ? 'total_stock ASC'
      : sort === 'name' ? 'p.name ASC'
      : 'p.created_at DESC';

    const [count] = await sequelize.query(
      `SELECT COUNT(*) as total FROM (
        SELECT p.id, COALESCE(SUM(i.quantity), 0) as total_stock
        FROM products p
        LEFT JOIN inventory i ON i.product_id = p.id AND i.variant_id IS NULL
        ${where} GROUP BY p.id ${stockHaving}
      ) sub`,
      { replacements, type: QueryTypes.SELECT }
    );

    const products = await sequelize.query(
      `SELECT p.*, c.name as category_name, COALESCE(SUM(i.quantity), 0) as total_stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON i.product_id = p.id AND i.variant_id IS NULL
       ${where}
       GROUP BY p.id ${stockHaving} ORDER BY ${orderBy} LIMIT ? OFFSET ?`,
      { replacements: [...replacements, parseInt(limit), offset], type: QueryTypes.SELECT }
    );

    res.json({ success: true, products, pagination: { total: count.total, page: parseInt(page), pages: Math.ceil(count.total / parseInt(limit)) } });
  } catch (error) { next(error); }
});

router.post('/products', upload.array('images', 10), async (req, res, next) => {
  try {
    const {
      name, name_en, description, description_en, short_description, short_description_en,
      price, compare_price, cost_price, sku, category_id, is_featured, is_active,
      weight, tax_class, meta_title, meta_description, tags
    } = req.body;

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now();
    let imageUrl = null;
    const gallery = [];

    if (req.files && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const webpName = file.filename.replace(/\.[^.]+$/, '.webp');
        await sharp(file.path).resize(800, 800, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(path.dirname(file.path), webpName));
        fs.unlinkSync(file.path);
        const url = `/uploads/products/${webpName}`;
        if (i === 0) imageUrl = url;
        else gallery.push(url);
      }
    }

    const [result] = await sequelize.query(
      `INSERT INTO products (name, name_en, slug, description, description_en, short_description, short_description_en,
        price, compare_price, cost_price, sku, category_id, image_url, gallery_images, is_featured, is_active,
        weight, tax_class, meta_title, meta_description, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      { replacements: [name, name_en||null, slug, description||null, description_en||null,
          short_description||null, short_description_en||null,
          parseFloat(price), compare_price||null, cost_price||null, sku||null,
          category_id||null, imageUrl, JSON.stringify(gallery),
          is_featured === 'true' ? 1 : 0, is_active !== 'false' ? 1 : 0,
          weight||null, tax_class||'standard', meta_title||null, meta_description||null,
          tags ? JSON.stringify(tags.split(',').map(t => t.trim())) : null
        ],
        type: QueryTypes.INSERT
      }
    );

    // Add default inventory in warehouse 1
    await sequelize.query(
      'INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES (?, 1, 0)',
      { replacements: [result], type: QueryTypes.INSERT }
    );

    res.status(201).json({ success: true, productId: result, message: 'Prodotto creato!' });
  } catch (error) { next(error); }
});

router.put('/products/:id', upload.array('images', 10), async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body;

    const setClauses = [];
    const replacements = [];
    const allowedFields = ['name', 'name_en', 'description', 'description_en', 'short_description',
      'short_description_en', 'price', 'compare_price', 'cost_price', 'sku', 'category_id',
      'is_featured', 'is_active', 'weight', 'meta_title', 'meta_description', 'tax_class'];

    for (const field of allowedFields) {
      if (fields[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        replacements.push(fields[field]);
      }
    }

    if (req.files && req.files.length > 0) {
      const gallery = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const webpName = file.filename.replace(/\.[^.]+$/, '.webp');
        await sharp(file.path).resize(800, 800, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(path.dirname(file.path), webpName));
        fs.unlinkSync(file.path);
        const url = `/uploads/products/${webpName}`;
        if (i === 0) { setClauses.push('image_url = ?'); replacements.push(url); }
        else gallery.push(url);
      }
      if (gallery.length) { setClauses.push('gallery_images = ?'); replacements.push(JSON.stringify(gallery)); }
    }

    if (!setClauses.length) return res.json({ success: true, message: 'Nessuna modifica' });

    replacements.push(id);
    await sequelize.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, { replacements, type: QueryTypes.UPDATE });
    res.json({ success: true, message: 'Prodotto aggiornato!' });
  } catch (error) { next(error); }
});

// PATCH: JSON-only partial update (no file upload) used by the admin modal
router.patch('/products/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const productFields = ['name', 'name_en', 'description', 'description_en', 'short_description',
      'price', 'compare_price', 'cost_price', 'sku', 'category_id',
      'is_featured', 'is_active', 'weight', 'meta_title', 'meta_description', 'tax_class'];

    const setClauses = [];
    const replacements = [];
    for (const field of productFields) {
      if (fields[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        replacements.push(fields[field]);
      }
    }

    if (setClauses.length) {
      replacements.push(id);
      await sequelize.query(`UPDATE products SET ${setClauses.join(', ')} WHERE id = ?`, { replacements, type: QueryTypes.UPDATE });
    }

    // stock lives in inventory, not products table
    if (fields.stock_quantity !== undefined) {
      const newQty = parseInt(fields.stock_quantity) || 0;
      const [currentInv] = await sequelize.query(
        'SELECT quantity - reserved as available FROM inventory WHERE product_id = ? AND variant_id IS NULL',
        { replacements: [id], type: QueryTypes.SELECT }
      );
      await sequelize.query(
        'UPDATE inventory SET quantity = ? WHERE product_id = ? AND variant_id IS NULL',
        { replacements: [newQty, id], type: QueryTypes.UPDATE }
      );
      if (currentInv && currentInv.available <= 0 && newQty > 0) {
        const [product] = await sequelize.query(
          'SELECT id, name, slug, image_url FROM products WHERE id = ?',
          { replacements: [id], type: QueryTypes.SELECT }
        );
        if (product) {
          const alerts = await sequelize.query(
            'SELECT email FROM stock_alerts WHERE product_id = ? AND variant_id IS NULL AND notified_at IS NULL',
            { replacements: [id], type: QueryTypes.SELECT }
          );
          for (const alert of alerts) {
            sendEmail({ to: alert.email, ...emailTemplates.stockAlert(product, alert.email) });
          }
          if (alerts.length > 0) {
            await sequelize.query(
              'UPDATE stock_alerts SET notified_at = NOW() WHERE product_id = ? AND variant_id IS NULL AND notified_at IS NULL',
              { replacements: [id], type: QueryTypes.UPDATE }
            );
          }
        }
      }
    }

    res.json({ success: true, message: 'Prodotto aggiornato!' });
  } catch (error) { next(error); }
});

router.delete('/products/:id', async (req, res, next) => {
  try {
    await sequelize.query('UPDATE products SET is_active = 0 WHERE id = ?', { replacements: [req.params.id], type: QueryTypes.UPDATE });
    res.json({ success: true, message: 'Prodotto disattivato' });
  } catch (error) { next(error); }
});

// ─── ORDERS ───────────────────────────────────────────────────────────────────

router.get('/orders', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status, search, from, to } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const replacements = [];

    if (status) { where += ' AND o.status = ?'; replacements.push(status); }
    if (search) { where += ' AND (o.order_number LIKE ? OR u.email LIKE ? OR u.first_name LIKE ?)'; replacements.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (from) { where += ' AND o.created_at >= ?'; replacements.push(from); }
    if (to) { where += ' AND o.created_at <= ?'; replacements.push(to + ' 23:59:59'); }

    const [count] = await sequelize.query(`SELECT COUNT(*) as total FROM orders o JOIN users u ON o.user_id = u.id ${where}`, { replacements, type: QueryTypes.SELECT });

    const orders = await sequelize.query(
      `SELECT o.*, u.first_name, u.last_name, u.email
       FROM orders o JOIN users u ON o.user_id = u.id
       ${where}
       ORDER BY o.created_at DESC LIMIT ? OFFSET ?`,
      { replacements: [...replacements, parseInt(limit), offset], type: QueryTypes.SELECT }
    );

    res.json({ success: true, orders, pagination: { total: count.total, page: parseInt(page), pages: Math.ceil(count.total / parseInt(limit)) } });
  } catch (error) { next(error); }
});

// Full order detail for the admin panel (any user's order). Read access for
// admin + moderator.
router.get('/orders/:id', async (req, res, next) => {
  try {
    const [order] = await sequelize.query(
      `SELECT o.*, u.first_name, u.last_name, u.email, u.phone
       FROM orders o JOIN users u ON o.user_id = u.id
       WHERE o.id = ?`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    const items = await sequelize.query(
      `SELECT oi.*, p.image_url, p.slug
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );

    const parse = (v) => {
      if (!v) return {};
      if (typeof v === 'object') return v;
      try { return JSON.parse(v); } catch { return {}; }
    };
    order.shipping_address = parse(order.shipping_address);
    order.billing_address = parse(order.billing_address);

    res.json({ success: true, order, items });
  } catch (error) { next(error); }
});

// Register tracking number → update DB + push to AfterShip
router.post('/orders/:id/tracking', async (req, res, next) => {
  try {
    const { tracking_number, carrier_slug } = req.body;
    if (!tracking_number) return res.status(400).json({ success: false, message: 'Tracking number obbligatorio' });

    const [order] = await sequelize.query('SELECT id, order_number FROM orders WHERE id = ?', { replacements: [req.params.id], type: QueryTypes.SELECT });
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    // Save tracking to DB + mark as shipped
    await sequelize.query(
      'UPDATE orders SET tracking_number = ?, carrier_slug = ?, status = IF(status = "processing", "shipped", status), shipped_at = IF(status = "processing", NOW(), shipped_at) WHERE id = ?',
      { replacements: [tracking_number, carrier_slug || null, req.params.id], type: QueryTypes.UPDATE }
    );

    // Register on AfterShip if API key present
    let aftershipId = null;
    if (process.env.AFTERSHIP_API_KEY) {
      const body = {
        tracking: {
          tracking_number,
          ...(carrier_slug && { slug: carrier_slug }),
          order_id: order.order_number,
          custom_fields: { order_id: String(req.params.id) }
        }
      };

      const r = await fetch('https://api.aftership.com/v4/trackings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'aftership-api-key': process.env.AFTERSHIP_API_KEY
        },
        body: JSON.stringify(body)
      });

      const data = await r.json();
      if (data.meta?.code === 201 || data.meta?.code === 4003) {
        aftershipId = data.data?.tracking?.id;
        console.log(`[AfterShip] Tracking registrato: ${tracking_number} (${carrier_slug})`);
      } else {
        console.warn('[AfterShip] Registrazione fallita:', JSON.stringify(data.meta));
      }
    }

    res.json({ success: true, message: 'Tracking aggiornato', aftership: !!aftershipId });
  } catch (error) { next(error); }
});

router.patch('/orders/:id/status', async (req, res, next) => {
  try {
    const { status, tracking_number, admin_notes } = req.body;
    const valid = ['pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Status non valido' });

    const setClauses = ['status = ?'];
    const replacements = [status];

    if (tracking_number) { setClauses.push('tracking_number = ?'); replacements.push(tracking_number); }
    if (admin_notes) { setClauses.push('admin_notes = ?'); replacements.push(admin_notes); }
    if (status === 'shipped') { setClauses.push('shipped_at = NOW()'); }
    if (status === 'delivered') { setClauses.push('delivered_at = NOW()'); }

    replacements.push(req.params.id);
    await sequelize.query(`UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`, { replacements, type: QueryTypes.UPDATE });

    const EMAIL_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled'];
    if (EMAIL_STATUSES.includes(status)) {
      try {
        const [order] = await sequelize.query(
          'SELECT o.*, u.email, u.first_name, u.last_name FROM orders o JOIN users u ON u.id = o.user_id WHERE o.id = ?',
          { replacements: [req.params.id], type: QueryTypes.SELECT }
        );
        if (order) {
          sendEmail({ to: order.email, ...emailTemplates.orderStatusChanged(order, order, status) }).catch(() => {});
        }
      } catch {}
    }

    res.json({ success: true, message: 'Stato ordine aggiornato' });
  } catch (error) { next(error); }
});

// ─── USERS ────────────────────────────────────────────────────────────────────

router.get('/users', async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = 'WHERE 1=1';
    const replacements = [];

    if (search) { where += ' AND (email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)'; replacements.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (role) { where += ' AND role = ?'; replacements.push(role); }

    const [count] = await sequelize.query(`SELECT COUNT(*) as total FROM users ${where}`, { replacements, type: QueryTypes.SELECT });

    const users = await sequelize.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.is_verified, u.last_login, u.created_at,
        COUNT(o.id) as order_count, COALESCE(SUM(o.total_amount), 0) as total_spent
       FROM users u LEFT JOIN orders o ON o.user_id = u.id AND o.payment_status = 'paid'
       ${where}
       GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?`,
      { replacements: [...replacements, parseInt(limit), offset], type: QueryTypes.SELECT }
    );

    res.json({ success: true, users, pagination: { total: count.total, page: parseInt(page) } });
  } catch (error) { next(error); }
});

router.patch('/users/:id/status', async (req, res, next) => {
  try {
    const { is_active } = req.body;
    await sequelize.query('UPDATE users SET is_active = ? WHERE id = ?', { replacements: [is_active ? 1 : 0, req.params.id], type: QueryTypes.UPDATE });
    res.json({ success: true, message: is_active ? 'Utente attivato' : 'Utente disabilitato' });
  } catch (error) { next(error); }
});

router.patch('/users/:id/role', isAdminOnly, async (req, res, next) => {
  try {
    const { role } = req.body;
    const valid = ['customer', 'moderator', 'admin'];
    if (!valid.includes(role)) return res.status(400).json({ success: false, message: 'Ruolo non valido' });
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: 'Non puoi cambiare il tuo ruolo' });
    await sequelize.query('UPDATE users SET role = ? WHERE id = ?', { replacements: [role, req.params.id], type: QueryTypes.UPDATE });
    res.json({ success: true, message: `Ruolo aggiornato a ${role}` });
  } catch (error) { next(error); }
});

// ─── COUPONS ──────────────────────────────────────────────────────────────────

router.get('/coupons', async (req, res, next) => {
  try {
    const coupons = await sequelize.query('SELECT * FROM coupons ORDER BY created_at DESC', { type: QueryTypes.SELECT });
    res.json({ success: true, coupons });
  } catch (error) { next(error); }
});

router.post('/coupons', async (req, res, next) => {
  try {
    const { code, description, discount_type, discount_value, minimum_order, maximum_discount, max_uses, max_uses_per_user, valid_from, valid_until } = req.body;

    const [existing] = await sequelize.query('SELECT id FROM coupons WHERE code = ?', { replacements: [code], type: QueryTypes.SELECT });
    if (existing) return res.status(400).json({ success: false, message: 'Codice già esistente' });

    await sequelize.query(
      'INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order, maximum_discount, max_uses, max_uses_per_user, valid_from, valid_until) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      { replacements: [code, description||null, discount_type, parseFloat(discount_value), parseFloat(minimum_order||0), maximum_discount||null, max_uses||null, max_uses_per_user||1, valid_from||null, valid_until||null], type: QueryTypes.INSERT }
    );

    res.status(201).json({ success: true, message: 'Coupon creato!' });
  } catch (error) { next(error); }
});

router.delete('/coupons/:id', async (req, res, next) => {
  try {
    await sequelize.query('UPDATE coupons SET is_active = 0 WHERE id = ?', { replacements: [req.params.id], type: QueryTypes.UPDATE });
    res.json({ success: true, message: 'Coupon disattivato' });
  } catch (error) { next(error); }
});

// ─── INVENTORY ────────────────────────────────────────────────────────────────

router.get('/inventory', async (req, res, next) => {
  try {
    const inventory = await sequelize.query(
      `SELECT i.*, p.name as product_name, p.sku as product_sku, p.image_url,
        pv.name as variant_name, pv.value as variant_value, w.name as warehouse_name
       FROM inventory i
       JOIN products p ON i.product_id = p.id
       LEFT JOIN product_variants pv ON i.variant_id = pv.id
       JOIN warehouses w ON i.warehouse_id = w.id
       WHERE p.is_active = 1
       ORDER BY p.name, w.name`,
      { type: QueryTypes.SELECT }
    );
    res.json({ success: true, inventory });
  } catch (error) { next(error); }
});

router.patch('/inventory/:id', async (req, res, next) => {
  try {
    const { quantity, low_stock_threshold } = req.body;
    const newQty = parseInt(quantity);

    // Check current stock before update to detect 0→positive transition
    const [current] = await sequelize.query(
      'SELECT product_id, variant_id, quantity - reserved as available FROM inventory WHERE id = ?',
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );

    await sequelize.query(
      'UPDATE inventory SET quantity = ?, low_stock_threshold = COALESCE(?, low_stock_threshold) WHERE id = ?',
      { replacements: [newQty, low_stock_threshold || null, req.params.id], type: QueryTypes.UPDATE }
    );

    // Trigger stock alerts if product went from 0 → available
    if (current && current.available <= 0 && newQty > 0) {
      const [product] = await sequelize.query(
        'SELECT id, name, slug, image_url FROM products WHERE id = ?',
        { replacements: [current.product_id], type: QueryTypes.SELECT }
      );
      if (product) {
        const alerts = await sequelize.query(
          `SELECT email FROM stock_alerts
           WHERE product_id = ? AND notified_at IS NULL
           AND (variant_id = ? OR variant_id IS NULL)`,
          { replacements: [current.product_id, current.variant_id || null], type: QueryTypes.SELECT }
        );
        for (const alert of alerts) {
          sendEmail({ to: alert.email, ...emailTemplates.stockAlert(product, alert.email) });
        }
        if (alerts.length > 0) {
          await sequelize.query(
            `UPDATE stock_alerts SET notified_at = NOW()
             WHERE product_id = ? AND notified_at IS NULL
             AND (variant_id = ? OR variant_id IS NULL)`,
            { replacements: [current.product_id, current.variant_id || null], type: QueryTypes.UPDATE }
          );
        }
      }
    }

    res.json({ success: true, message: 'Stock aggiornato' });
  } catch (error) { next(error); }
});

// ─── SETTINGS ────────────────────────────────────────────────────────────────

router.get('/settings', isAdminOnly, async (req, res, next) => {
  try {
    const settings = await sequelize.query('SELECT `key`, `value`, group_name FROM settings ORDER BY group_name, `key`', { type: QueryTypes.SELECT });
    res.json({ success: true, settings });
  } catch (error) { next(error); }
});

router.put('/settings', isAdminOnly, async (req, res, next) => {
  try {
    const { settings } = req.body;
    const items = Array.isArray(settings) ? settings : Object.entries(settings).map(([key, value]) => ({ key, value }));
    for (const { key, value } of items) {
      await sequelize.query(
        'INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = ?',
        { replacements: [key, value, value], type: QueryTypes.INSERT }
      );
    }
    res.json({ success: true, message: 'Impostazioni salvate' });
  } catch (error) { next(error); }
});

// ─── CATEGORIES ──────────────────────────────────────────────────────────────

router.get('/categories', async (req, res, next) => {
  try {
    const categories = await sequelize.query('SELECT * FROM categories ORDER BY sort_order, name', { type: QueryTypes.SELECT });
    res.json({ success: true, categories });
  } catch (error) { next(error); }
});

router.post('/categories', isAdminOnly, async (req, res, next) => {
  try {
    const { name, name_en, description, description_en, parent_id, sort_order } = req.body;
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await sequelize.query(
      'INSERT INTO categories (name, name_en, description, description_en, parent_id, slug, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
      { replacements: [name, name_en||null, description||null, description_en||null, parent_id||null, slug, sort_order||0], type: QueryTypes.INSERT }
    );
    res.status(201).json({ success: true, message: 'Categoria creata!' });
  } catch (error) { next(error); }
});

router.put('/categories/:id', isAdminOnly, async (req, res, next) => {
  try {
    const { name, name_en, description, description_en, parent_id, sort_order, is_active } = req.body;
    await sequelize.query(
      'UPDATE categories SET name = ?, name_en = ?, description = ?, description_en = ?, parent_id = ?, sort_order = ?, is_active = ? WHERE id = ?',
      { replacements: [name, name_en||null, description||null, description_en||null, parent_id||null, sort_order||0, is_active !== false ? 1 : 0, req.params.id], type: QueryTypes.UPDATE }
    );
    res.json({ success: true, message: 'Categoria aggiornata' });
  } catch (error) { next(error); }
});

// ─── RETURNS ─────────────────────────────────────────────────────────────────

const stripe = require('../config/stripe');

router.get('/returns', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = '1=1';
    const replacements = [];
    if (status) { where += ' AND rr.status = ?'; replacements.push(status); }
    if (search) {
      where += ' AND (o.order_number LIKE ? OR u.email LIKE ? OR CONCAT(u.first_name," ",u.last_name) LIKE ?)';
      const like = `%${search}%`;
      replacements.push(like, like, like);
    }

    const [returns, [{ total }]] = await Promise.all([
      sequelize.query(
        `SELECT rr.*, o.order_number, o.total_amount, o.stripe_payment_intent_id,
                u.first_name, u.last_name, u.email
         FROM return_requests rr
         JOIN orders o ON o.id = rr.order_id
         JOIN users u ON u.id = rr.user_id
         WHERE ${where}
         ORDER BY rr.created_at DESC
         LIMIT ? OFFSET ?`,
        { replacements: [...replacements, parseInt(limit), offset], type: QueryTypes.SELECT }
      ),
      sequelize.query(
        `SELECT COUNT(*) AS total FROM return_requests rr
         JOIN orders o ON o.id = rr.order_id
         JOIN users u ON u.id = rr.user_id
         WHERE ${where}`,
        { replacements, type: QueryTypes.SELECT }
      )
    ]);

    res.json({ success: true, returns, pagination: { total, page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { next(error); }
});

router.get('/returns/:id', async (req, res, next) => {
  try {
    const [returnReq] = await sequelize.query(
      `SELECT rr.*, o.order_number, o.total_amount, o.status AS order_status,
              o.stripe_payment_intent_id, o.shipping_address,
              u.first_name, u.last_name, u.email
       FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       JOIN users u ON u.id = rr.user_id
       WHERE rr.id = ?`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );
    if (!returnReq) return res.status(404).json({ success: false, message: 'Richiesta non trovata' });

    const items = await sequelize.query(
      'SELECT * FROM order_items WHERE order_id = ?',
      { replacements: [returnReq.order_id], type: QueryTypes.SELECT }
    );

    res.json({ success: true, return_request: returnReq, items });
  } catch (error) { next(error); }
});

router.patch('/returns/:id/approve', isAdminOnly, async (req, res, next) => {
  try {
    const { refund_amount } = req.body;

    const [returnReq] = await sequelize.query(
      `SELECT rr.*, o.stripe_payment_intent_id, o.order_number, o.payment_method,
              u.email, u.first_name, u.last_name
       FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       JOIN users u ON u.id = rr.user_id
       WHERE rr.id = ?`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );
    if (!returnReq) return res.status(404).json({ success: false, message: 'Richiesta non trovata' });
    if (returnReq.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Richiesta già processata' });
    }

    const amount = parseFloat(refund_amount || returnReq.refund_amount);
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Importo rimborso non valido' });
    }

    let stripeRefundId = null;

    if (returnReq.stripe_payment_intent_id && returnReq.payment_method === 'stripe') {
      try {
        const refund = await stripe.refunds.create({
          payment_intent: returnReq.stripe_payment_intent_id,
          amount: Math.round(amount * 100),
          reason: 'requested_by_customer'
        });
        stripeRefundId = refund.id;
      } catch (stripeErr) {
        return res.status(422).json({ success: false, message: `Errore Stripe: ${stripeErr.message}` });
      }
    }

    await sequelize.query(
      `UPDATE return_requests SET status = 'refunded', refund_amount = ?, stripe_refund_id = ?, updated_at = NOW() WHERE id = ?`,
      { replacements: [amount, stripeRefundId, req.params.id], type: QueryTypes.UPDATE }
    );
    await sequelize.query(
      `UPDATE orders SET status = 'refunded', payment_status = 'refunded', updated_at = NOW() WHERE id = ?`,
      { replacements: [returnReq.order_id], type: QueryTypes.UPDATE }
    );

    const [order] = await sequelize.query(
      'SELECT order_number FROM orders WHERE id = ?',
      { replacements: [returnReq.order_id], type: QueryTypes.SELECT }
    );
    const updatedReturn = { ...returnReq, refund_amount: amount };
    sendEmail({
      to: returnReq.email,
      ...emailTemplates.returnApproved({ first_name: returnReq.first_name }, updatedReturn, order)
    }).catch(() => {});

    res.json({ success: true, message: 'Rimborso approvato ed elaborato', stripe_refund_id: stripeRefundId });
  } catch (error) { next(error); }
});

router.patch('/returns/:id/reject', isAdminOnly, async (req, res, next) => {
  try {
    const { admin_notes } = req.body;

    const [returnReq] = await sequelize.query(
      `SELECT rr.*, o.order_number, u.email, u.first_name
       FROM return_requests rr
       JOIN orders o ON o.id = rr.order_id
       JOIN users u ON u.id = rr.user_id
       WHERE rr.id = ?`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );
    if (!returnReq) return res.status(404).json({ success: false, message: 'Richiesta non trovata' });
    if (returnReq.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Richiesta già processata' });
    }

    await sequelize.query(
      `UPDATE return_requests SET status = 'rejected', admin_notes = ?, updated_at = NOW() WHERE id = ?`,
      { replacements: [admin_notes || null, req.params.id], type: QueryTypes.UPDATE }
    );

    const [order] = await sequelize.query(
      'SELECT order_number FROM orders WHERE id = ?',
      { replacements: [returnReq.order_id], type: QueryTypes.SELECT }
    );
    sendEmail({
      to: returnReq.email,
      ...emailTemplates.returnRejected({ first_name: returnReq.first_name }, order, admin_notes)
    }).catch(() => {});

    res.json({ success: true, message: 'Richiesta rifiutata' });
  } catch (error) { next(error); }
});

// ─── GIFT CARDS ──────────────────────────────────────────────────────────────

router.get('/gift-cards', async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = '1=1';
    const replacements = [];
    if (status) { where += ' AND gc.status = ?'; replacements.push(status); }
    if (search) { where += ' AND (gc.code LIKE ? OR gc.recipient_email LIKE ?)'; const l = `%${search}%`; replacements.push(l, l); }

    const cards = await sequelize.query(
      `SELECT gc.*, u.email AS purchaser_email
       FROM gift_cards gc
       LEFT JOIN users u ON u.id = gc.purchaser_user_id
       WHERE ${where} ORDER BY gc.created_at DESC LIMIT ? OFFSET ?`,
      { replacements: [...replacements, parseInt(limit), offset], type: QueryTypes.SELECT }
    );
    const [{ total }] = await sequelize.query(
      `SELECT COUNT(*) total FROM gift_cards gc WHERE ${where}`,
      { replacements, type: QueryTypes.SELECT }
    );
    const [stats] = await sequelize.query(
      `SELECT COUNT(*) count, COALESCE(SUM(initial_amount),0) issued, COALESCE(SUM(balance),0) outstanding
       FROM gift_cards`,
      { type: QueryTypes.SELECT }
    );

    res.json({ success: true, cards, stats, pagination: { total, page: parseInt(page) } });
  } catch (error) { next(error); }
});

// Admin manually issues a gift card
router.post('/gift-cards', isAdminOnly, async (req, res, next) => {
  try {
    const amount = parseFloat(req.body.amount);
    const recipient_email = req.body.recipient_email?.trim().toLowerCase() || null;
    if (!amount || amount <= 0) return res.status(400).json({ success: false, message: 'Importo non valido' });

    const seg = () => Math.random().toString(36).substring(2, 6).toUpperCase();
    const code = `GIFT-${seg()}-${seg()}-${seg()}`;
    await sequelize.query(
      `INSERT INTO gift_cards (code, initial_amount, balance, status, recipient_email, expires_at)
       VALUES (?, ?, ?, 'active', ?, DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      { replacements: [code, amount, amount, recipient_email], type: QueryTypes.INSERT }
    );
    if (recipient_email) {
      sendEmail({ to: recipient_email, ...emailTemplates.giftCard({ code, amount, message: null }) }).catch(() => {});
    }
    res.status(201).json({ success: true, code, message: 'Gift card emessa' });
  } catch (error) { next(error); }
});

router.patch('/gift-cards/:id/disable', isAdminOnly, async (req, res, next) => {
  try {
    await sequelize.query(
      "UPDATE gift_cards SET status = 'disabled' WHERE id = ?",
      { replacements: [req.params.id], type: QueryTypes.UPDATE }
    );
    res.json({ success: true, message: 'Gift card disabilitata' });
  } catch (error) { next(error); }
});

// ─── EMAIL MARKETING ─────────────────────────────────────────────────────────

router.get('/newsletter/subscribers', async (req, res, next) => {
  try {
    const subscribers = await sequelize.query(
      'SELECT email, is_active, created_at FROM newsletter_subscribers ORDER BY created_at DESC',
      { type: QueryTypes.SELECT }
    );
    const active = subscribers.filter(s => s.is_active).length;
    res.json({ success: true, subscribers, total: subscribers.length, active });
  } catch (error) { next(error); }
});

// Send a campaign to all active subscribers
router.post('/newsletter/campaign', isAdminOnly, async (req, res, next) => {
  try {
    const subject = req.body.subject?.trim();
    const heading = req.body.heading?.trim() || subject;
    const bodyHtml = req.body.body?.trim();
    const ctaText = req.body.cta_text?.trim() || null;
    const ctaUrl = req.body.cta_url?.trim() || null;

    if (!subject || !bodyHtml) {
      return res.status(400).json({ success: false, message: 'Oggetto e contenuto obbligatori' });
    }

    const subscribers = await sequelize.query(
      'SELECT email FROM newsletter_subscribers WHERE is_active = 1',
      { type: QueryTypes.SELECT }
    );
    if (subscribers.length === 0) {
      return res.status(400).json({ success: false, message: 'Nessun iscritto attivo' });
    }

    const tpl = emailTemplates.newsletterCampaign({ heading, body: bodyHtml, ctaText, ctaUrl });

    // Fire-and-forget; report count
    let sent = 0;
    for (const sub of subscribers) {
      const r = await sendEmail({ to: sub.email, subject, html: tpl.html });
      if (r.success) sent++;
    }

    res.json({ success: true, message: `Campagna inviata a ${sent}/${subscribers.length} iscritti`, sent, total: subscribers.length });
  } catch (error) { next(error); }
});

// ─── ANALYTICS ───────────────────────────────────────────────────────────────

router.get('/analytics', isAdminOnly, async (req, res, next) => {
  try {
    const days = Math.min(parseInt(req.query.days) || 30, 365);

    // Daily sales over the window
    const dailySales = await sequelize.query(
      `SELECT DATE(created_at) AS date, COALESCE(SUM(total_amount),0) AS revenue, COUNT(*) AS orders
       FROM orders
       WHERE payment_status = 'paid' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY date`,
      { replacements: [days], type: QueryTypes.SELECT }
    );

    // Revenue by category
    const byCategory = await sequelize.query(
      `SELECT c.name AS category, COALESCE(SUM(oi.total_price),0) AS revenue, COUNT(DISTINCT o.id) AS orders
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'paid'
       JOIN products p ON p.id = oi.product_id
       LEFT JOIN categories c ON c.id = p.category_id
       GROUP BY c.id ORDER BY revenue DESC LIMIT 8`,
      { type: QueryTypes.SELECT }
    );

    // Top products by revenue
    const topProducts = await sequelize.query(
      `SELECT p.id, p.name, p.image_url, SUM(oi.quantity) AS units, SUM(oi.total_price) AS revenue
       FROM order_items oi
       JOIN orders o ON o.id = oi.order_id AND o.payment_status = 'paid'
       JOIN products p ON p.id = oi.product_id
       GROUP BY p.id ORDER BY revenue DESC LIMIT 8`,
      { type: QueryTypes.SELECT }
    );

    // Order status distribution
    const statusDist = await sequelize.query(
      `SELECT status, COUNT(*) count FROM orders GROUP BY status`,
      { type: QueryTypes.SELECT }
    );

    // KPIs
    const [kpi] = await sequelize.query(
      `SELECT
        COALESCE(SUM(CASE WHEN payment_status='paid' THEN total_amount END),0) AS revenue,
        COUNT(CASE WHEN payment_status='paid' THEN 1 END) AS paid_orders,
        COALESCE(AVG(CASE WHEN payment_status='paid' THEN total_amount END),0) AS avg_order_value,
        (SELECT COUNT(*) FROM users WHERE role='customer') AS customers,
        (SELECT COUNT(*) FROM newsletter_subscribers WHERE is_active=1) AS subscribers
       FROM orders WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
      { replacements: [days], type: QueryTypes.SELECT }
    );

    // New customers per day
    const newCustomers = await sequelize.query(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM users WHERE role='customer' AND created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
       GROUP BY DATE(created_at) ORDER BY date`,
      { replacements: [days], type: QueryTypes.SELECT }
    );

    res.json({ success: true, days, dailySales, byCategory, topProducts, statusDist, kpi, newCustomers });
  } catch (error) { next(error); }
});

module.exports = router;
