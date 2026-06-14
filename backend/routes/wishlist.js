const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/:productId', async (req, res, next) => {
  try {
    const [existing] = await sequelize.query(
      'SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?',
      { replacements: [req.user.id, req.params.productId], type: QueryTypes.SELECT }
    );

    if (existing) {
      await sequelize.query('DELETE FROM wishlist WHERE user_id = ? AND product_id = ?', { replacements: [req.user.id, req.params.productId], type: QueryTypes.DELETE });
      res.json({ success: true, added: false, message: 'Rimosso dai preferiti' });
    } else {
      await sequelize.query('INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)', { replacements: [req.user.id, req.params.productId], type: QueryTypes.INSERT });
      res.json({ success: true, added: true, message: 'Aggiunto ai preferiti' });
    }
  } catch (error) { next(error); }
});

module.exports = router;
