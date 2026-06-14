const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');

router.post('/:reviewId/helpful', authenticate, async (req, res, next) => {
  try {
    await sequelize.query(
      'UPDATE reviews SET helpful_count = helpful_count + 1 WHERE id = ?',
      { replacements: [req.params.reviewId], type: QueryTypes.UPDATE }
    );
    res.json({ success: true });
  } catch (error) { next(error); }
});

module.exports = router;
