const express = require('express');
const router = express.Router();
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');

const VALID_REASONS = ['damaged', 'wrong_item', 'not_as_described', 'changed_mind', 'other'];

// POST /api/orders/:id/return — submit return request
router.post('/orders/:id/return', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;
    const { reason, description, items_to_return } = req.body;

    if (!reason || !VALID_REASONS.includes(reason)) {
      return res.status(400).json({ success: false, message: 'Motivo reso non valido' });
    }

    const [order] = await sequelize.query(
      'SELECT id, status, total_amount FROM orders WHERE id = ? AND user_id = ?',
      { replacements: [orderId, userId], type: QueryTypes.SELECT }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });
    if (order.status !== 'delivered') {
      return res.status(400).json({ success: false, message: 'Il reso è disponibile solo per ordini consegnati' });
    }

    const [existing] = await sequelize.query(
      'SELECT id FROM return_requests WHERE order_id = ?',
      { replacements: [orderId], type: QueryTypes.SELECT }
    );
    if (existing) return res.status(409).json({ success: false, message: 'Richiesta di reso già inviata per questo ordine' });

    await sequelize.query(
      `INSERT INTO return_requests (order_id, user_id, reason, description, items_to_return, refund_amount)
       VALUES (?, ?, ?, ?, ?, ?)`,
      {
        replacements: [
          orderId, userId, reason,
          description || null,
          items_to_return ? JSON.stringify(items_to_return) : null,
          order.total_amount
        ],
        type: QueryTypes.INSERT
      }
    );

    res.status(201).json({ success: true, message: 'Richiesta di reso inviata con successo' });
  } catch (error) { next(error); }
});

// GET /api/orders/:id/return — get return request status
router.get('/orders/:id/return', authenticate, async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.id);
    const userId = req.user.id;

    const [order] = await sequelize.query(
      'SELECT id FROM orders WHERE id = ? AND user_id = ?',
      { replacements: [orderId, userId], type: QueryTypes.SELECT }
    );
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    const [returnReq] = await sequelize.query(
      'SELECT * FROM return_requests WHERE order_id = ?',
      { replacements: [orderId], type: QueryTypes.SELECT }
    );

    res.json({ success: true, return_request: returnReq || null });
  } catch (error) { next(error); }
});

module.exports = router;
