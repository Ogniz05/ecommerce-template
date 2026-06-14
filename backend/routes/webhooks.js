const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { sendEmail, emailTemplates } = require('../config/email');

// AfterShip tag → our order status
const AFTERSHIP_STATUS_MAP = {
  InTransit:          'shipped',
  OutForDelivery:     'shipped',
  Delivered:          'delivered',
  AttemptFail:        null, // no status change, just notify
  Exception:          null,
  Expired:            null,
  AvailableForPickup: null,
  Pending:            null,
  InfoReceived:       null,
};

const STATUS_LABELS = {
  shipped:   'In Spedizione',
  delivered: 'Consegnato',
};

// POST /api/webhooks/aftership
// Raw body needed — mounted before express.json() in server.js
router.post('/aftership', async (req, res) => {
  try {
    // ── HMAC verification ──────────────────────────────────────────────────
    const secret = process.env.AFTERSHIP_WEBHOOK_SECRET;
    if (secret) {
      const sig = req.headers['aftership-hmac-sha256'];
      const expected = crypto
        .createHmac('sha256', secret)
        .update(req.body) // raw Buffer
        .digest('base64');
      if (sig !== expected) {
        console.warn('[AfterShip] Webhook signature mismatch');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    }

    const payload = JSON.parse(req.body.toString());
    const msg = payload.msg;
    if (!msg || payload.event !== 'tracking_update') return res.json({ ok: true });

    const tag = msg.tag;
    const trackingNumber = msg.tracking_number;
    const orderId = msg.custom_fields?.order_id || msg.order_id;

    console.log(`[AfterShip] ${trackingNumber} → ${tag} (order ${orderId})`);

    if (!orderId) return res.json({ ok: true });

    // ── Find order ─────────────────────────────────────────────────────────
    const [order] = await sequelize.query(
      `SELECT o.*, u.email, u.first_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.id = ?`,
      { replacements: [orderId], type: QueryTypes.SELECT }
    );
    if (!order) return res.json({ ok: true });

    // ── Map status ─────────────────────────────────────────────────────────
    const newStatus = AFTERSHIP_STATUS_MAP[tag];

    if (newStatus && newStatus !== order.status) {
      await sequelize.query(
        `UPDATE orders SET status = ?, aftership_tag = ?, updated_at = NOW() ${newStatus === 'shipped' ? ', shipped_at = NOW()' : ''} ${newStatus === 'delivered' ? ', delivered_at = NOW()' : ''} WHERE id = ?`,
        { replacements: [newStatus, tag, orderId], type: QueryTypes.UPDATE }
      );

      // ── Email to customer ───────────────────────────────────────────────
      const label = STATUS_LABELS[newStatus];
      if (label && order.email) {
        const trackingUrl = msg.shipment_delivery_date
          ? null
          : `https://www.aftership.com/track/${msg.slug}/${trackingNumber}`;

        await sendEmail({
          to: order.email,
          subject: `${label} — Ordine #${order.order_number}`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px 24px">
              <h2 style="font-size:22px;margin-bottom:8px">Aggiornamento ordine #${order.order_number}</h2>
              <p style="color:#555;margin-bottom:20px">Ciao ${order.first_name},</p>
              ${newStatus === 'shipped'
                ? `<p style="color:#555">Il tuo ordine è <strong>in spedizione</strong> con numero di tracking <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${trackingNumber}</code>.</p>
                   ${trackingUrl ? `<p><a href="${trackingUrl}" style="color:#d8125b">Traccia il pacco →</a></p>` : ''}`
                : `<p style="color:#555">Il tuo ordine è stato <strong>consegnato</strong>. Grazie per aver acquistato da noi!</p>`
              }
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
              <p style="color:#9ca3af;font-size:13px">Hai domande? Contattaci su <a href="mailto:info@shop.com" style="color:#d8125b">info@shop.com</a></p>
            </div>
          `
        }).catch(err => console.error('[AfterShip] Email error:', err.message));
      }

      console.log(`[AfterShip] Order ${orderId} → ${newStatus}`);
    }

    // Always store latest tag even if no status change
    if (!newStatus) {
      await sequelize.query(
        'UPDATE orders SET aftership_tag = ? WHERE id = ?',
        { replacements: [tag, orderId], type: QueryTypes.UPDATE }
      ).catch(() => {});
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('[AfterShip] Webhook error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

module.exports = router;
