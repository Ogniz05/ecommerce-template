const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate, isAdmin, optionalAuth } = require('../middleware/auth');

// GET /api/products - List with filters
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      page = 1, limit = 12, category, search, sort = 'created_at',
      order = 'DESC', min_price, max_price, featured, lang = 'it'
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    let whereConditions = ['p.is_active = 1'];
    const replacements = [];

    if (category) {
      whereConditions.push('(c.id = ? OR c.slug = ? OR c.parent_id = (SELECT id FROM categories WHERE slug = ? OR id = ?))');
      replacements.push(category, category, category, category);
    }

    if (search) {
      whereConditions.push('(p.name LIKE ? OR p.description LIKE ? OR p.name_en LIKE ?)');
      const searchTerm = `%${search}%`;
      replacements.push(searchTerm, searchTerm, searchTerm);
    }

    if (min_price) { whereConditions.push('p.price >= ?'); replacements.push(parseFloat(min_price)); }
    if (max_price) { whereConditions.push('p.price <= ?'); replacements.push(parseFloat(max_price)); }
    if (featured === 'true') { whereConditions.push('p.is_featured = 1'); }

    const validSorts = { price_asc: 'p.price ASC', price_desc: 'p.price DESC', newest: 'p.created_at DESC', rating: 'p.avg_rating DESC', popular: 'p.total_sold DESC', name: 'p.name ASC' };
    const sortSQL = validSorts[sort] || 'p.created_at DESC';

    const whereSQL = whereConditions.length ? 'WHERE ' + whereConditions.join(' AND ') : '';

    const countResult = await sequelize.query(
      `SELECT COUNT(*) as total FROM products p LEFT JOIN categories c ON p.category_id = c.id ${whereSQL}`,
      { replacements, type: QueryTypes.SELECT }
    );

    const products = await sequelize.query(
      `SELECT p.*,
        ${lang === 'en' ? 'COALESCE(p.name_en, p.name)' : 'p.name'} as display_name,
        ${lang === 'en' ? 'COALESCE(p.short_description_en, p.short_description)' : 'p.short_description'} as display_short_desc,
        c.name as category_name, c.slug as category_slug,
        COALESCE(SUM(i.quantity - i.reserved), 0) as stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON i.product_id = p.id AND i.variant_id IS NULL
       ${whereSQL}
       GROUP BY p.id
       ORDER BY ${sortSQL}
       LIMIT ? OFFSET ?`,
      { replacements: [...replacements, parseInt(limit), offset], type: QueryTypes.SELECT }
    );

    res.json({
      success: true,
      products,
      pagination: {
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(countResult[0].total / parseInt(limit))
      }
    });
  } catch (error) { next(error); }
});

// GET /api/products/featured
router.get('/featured', async (req, res, next) => {
  try {
    const { limit = 8, lang = 'it' } = req.query;
    const products = await sequelize.query(
      `SELECT p.*,
        ${lang === 'en' ? 'COALESCE(p.name_en, p.name)' : 'p.name'} as display_name,
        c.name as category_name,
        COALESCE(SUM(i.quantity - i.reserved), 0) as stock
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN inventory i ON i.product_id = p.id AND i.variant_id IS NULL
       WHERE p.is_featured = 1 AND p.is_active = 1
       GROUP BY p.id
       ORDER BY p.avg_rating DESC, p.total_sold DESC
       LIMIT ?`,
      { replacements: [parseInt(limit)], type: QueryTypes.SELECT }
    );
    res.json({ success: true, products });
  } catch (error) { next(error); }
});

// GET /api/products/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { lang = 'it' } = req.query;
    const idOrSlug = req.params.id;

    const [product] = await sequelize.query(
      `SELECT p.*,
        c.name as category_name, c.slug as category_slug, c.id as category_id
       FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       WHERE (p.id = ? OR p.slug = ?) AND p.is_active = 1`,
      { replacements: [isNaN(idOrSlug) ? 0 : idOrSlug, idOrSlug], type: QueryTypes.SELECT }
    );

    if (!product) return res.status(404).json({ success: false, message: 'Prodotto non trovato' });

    const variants = await sequelize.query(
      `SELECT pv.*, COALESCE(i.quantity - i.reserved, 0) as stock
       FROM product_variants pv
       LEFT JOIN inventory i ON i.variant_id = pv.id
       WHERE pv.product_id = ? AND pv.is_active = 1
       ORDER BY pv.sort_order`,
      { replacements: [product.id], type: QueryTypes.SELECT }
    );

    const [totalStock] = await sequelize.query(
      'SELECT COALESCE(SUM(quantity - reserved), 0) as stock FROM inventory WHERE product_id = ? AND variant_id IS NULL',
      { replacements: [product.id], type: QueryTypes.SELECT }
    );

    const reviews = await sequelize.query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = 1
       ORDER BY r.created_at DESC LIMIT 10`,
      { replacements: [product.id], type: QueryTypes.SELECT }
    );

    // Related products
    const related = await sequelize.query(
      `SELECT p.id, p.name, p.price, p.image_url, p.avg_rating, p.slug
       FROM products p
       WHERE p.category_id = ? AND p.id != ? AND p.is_active = 1
       ORDER BY RAND() LIMIT 6`,
      { replacements: [product.category_id, product.id], type: QueryTypes.SELECT }
    );

    product.gallery_images = product.gallery_images ? JSON.parse(product.gallery_images) : [];
    product.tags = product.tags ? JSON.parse(product.tags) : [];
    product.stock = totalStock.stock;

    res.json({ success: true, product, variants, reviews, related });
  } catch (error) { next(error); }
});

// GET /api/products/:id/reviews
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sort = 'newest' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const sortSQL = sort === 'helpful' ? 'r.helpful_count DESC' : 'r.created_at DESC';

    const [count] = await sequelize.query(
      'SELECT COUNT(*) as total FROM reviews WHERE product_id = ? AND is_approved = 1',
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );

    const reviews = await sequelize.query(
      `SELECT r.*, u.first_name, u.last_name, u.avatar_url
       FROM reviews r JOIN users u ON r.user_id = u.id
       WHERE r.product_id = ? AND r.is_approved = 1
       ORDER BY ${sortSQL} LIMIT ? OFFSET ?`,
      { replacements: [req.params.id, parseInt(limit), offset], type: QueryTypes.SELECT }
    );

    const [stats] = await sequelize.query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total,
        SUM(rating = 5) as five_star, SUM(rating = 4) as four_star,
        SUM(rating = 3) as three_star, SUM(rating = 2) as two_star, SUM(rating = 1) as one_star
       FROM reviews WHERE product_id = ? AND is_approved = 1`,
      { replacements: [req.params.id], type: QueryTypes.SELECT }
    );

    res.json({ success: true, reviews, stats, pagination: { total: count.total, page: parseInt(page) } });
  } catch (error) { next(error); }
});

// POST /api/products/:id/reviews - Add review
router.post('/:id/reviews', authenticate, async (req, res, next) => {
  try {
    const { rating, title, content } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ success: false, message: 'Rating deve essere tra 1 e 5' });
    }

    const [existing] = await sequelize.query(
      'SELECT id FROM reviews WHERE product_id = ? AND user_id = ?',
      { replacements: [req.params.id, req.user.id], type: QueryTypes.SELECT }
    );
    if (existing) {
      return res.status(400).json({ success: false, message: 'Hai già recensito questo prodotto' });
    }

    await sequelize.query(
      'INSERT INTO reviews (product_id, user_id, rating, title, content) VALUES (?, ?, ?, ?, ?)',
      { replacements: [req.params.id, req.user.id, rating, title, content], type: QueryTypes.INSERT }
    );

    // Update product rating
    await sequelize.query(
      'UPDATE products SET avg_rating = (SELECT AVG(rating) FROM reviews WHERE product_id = ?), review_count = (SELECT COUNT(*) FROM reviews WHERE product_id = ?) WHERE id = ?',
      { replacements: [req.params.id, req.params.id, req.params.id], type: QueryTypes.UPDATE }
    );

    res.status(201).json({ success: true, message: 'Recensione aggiunta!' });
  } catch (error) { next(error); }
});

module.exports = router;
