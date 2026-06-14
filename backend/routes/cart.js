const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

// Server-side cart validation
router.post('/validate', async (req, res, next) => {
  try {
    const { items } = req.body;
    if (!items || !items.length) return res.json({ success: true, items: [], warnings: [] });

    const warnings = [];
    const validatedItems = [];

    for (const item of items) {
      const [product] = await sequelize.query(
        'SELECT id, name, price, image_url, slug, is_active FROM products WHERE id = ?',
        { replacements: [item.product_id], type: QueryTypes.SELECT }
      );

      if (!product || !product.is_active) {
        warnings.push(`Prodotto "${item.product_name || item.product_id}" non più disponibile`);
        continue;
      }

      let price = parseFloat(product.price);
      let variantData = null;

      if (item.variant_id) {
        const [variant] = await sequelize.query(
          'SELECT * FROM product_variants WHERE id = ? AND product_id = ?',
          { replacements: [item.variant_id, item.product_id], type: QueryTypes.SELECT }
        );
        if (variant) {
          price += parseFloat(variant.price_adjustment || 0);
          variantData = variant;
        }
      }

      const [stock] = await sequelize.query(
        `SELECT COALESCE(SUM(quantity - reserved), 0) as available FROM inventory
         WHERE product_id = ? AND ${item.variant_id ? 'variant_id = ?' : 'variant_id IS NULL'}`,
        { replacements: item.variant_id ? [item.product_id, item.variant_id] : [item.product_id], type: QueryTypes.SELECT }
      );

      const available = parseInt(stock.available || 0);
      const qty = Math.min(item.quantity, available);

      if (available === 0) {
        warnings.push(`"${product.name}" non più disponibile`);
        continue;
      }

      if (qty < item.quantity) {
        warnings.push(`"${product.name}": solo ${available} pezzi disponibili`);
      }

      validatedItems.push({
        ...item,
        product_name: product.name,
        price,
        image_url: product.image_url,
        slug: product.slug,
        quantity: qty,
        stock: available,
        variant: variantData
      });
    }

    res.json({ success: true, items: validatedItems, warnings });
  } catch (error) { next(error); }
});

module.exports = router;
