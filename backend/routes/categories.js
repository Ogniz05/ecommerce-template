const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

router.get('/', async (req, res, next) => {
  try {
    const { lang = 'it' } = req.query;
    const categories = await sequelize.query(
      `SELECT c.*,
        ${lang === 'en' ? 'COALESCE(c.name_en, c.name)' : 'c.name'} as display_name,
        COUNT(p.id) as product_count
       FROM categories c
       LEFT JOIN products p ON p.category_id = c.id AND p.is_active = 1
       WHERE c.is_active = 1
       GROUP BY c.id
       ORDER BY c.parent_id IS NOT NULL, c.sort_order, c.name`,
      { type: QueryTypes.SELECT }
    );

    // Build tree structure
    const roots = categories.filter(c => !c.parent_id);
    const children = categories.filter(c => c.parent_id);
    const tree = roots.map(r => ({ ...r, children: children.filter(c => c.parent_id === r.id) }));

    res.json({ success: true, categories, tree });
  } catch (error) { next(error); }
});

router.get('/:slug', async (req, res, next) => {
  try {
    const [category] = await sequelize.query(
      'SELECT * FROM categories WHERE (slug = ? OR id = ?) AND is_active = 1',
      { replacements: [req.params.slug, isNaN(req.params.slug) ? 0 : req.params.slug], type: QueryTypes.SELECT }
    );
    if (!category) return res.status(404).json({ success: false, message: 'Categoria non trovata' });
    res.json({ success: true, category });
  } catch (error) { next(error); }
});

module.exports = router;
