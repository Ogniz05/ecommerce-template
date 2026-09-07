const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const stripe = require('../config/stripe');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { optionalAuth } = require('../middleware/auth');
const { finalizeOrderPayment } = require('../services/orderPayment');

/**
 * Resolves the order a payment call refers to, for both kinds of buyer.
 *
 * A signed-in customer is matched on user_id. A guest has no session at all —
 * guest checkout creates a shadow account it never hands out credentials for —
 * and instead presents the payment_token returned by POST /orders. Requiring a
 * login here is what previously made guest checkout impossible to pay for.
 *
 * Returns null when nothing matches, so callers answer 404 either way and the
 * endpoint never reveals whether a given order id exists.
 */
async function resolvePayableOrder({ orderId, user, paymentToken, requirePending = true }) {
  if (!orderId) return null;

  const [order] = await sequelize.query(
    'SELECT * FROM orders WHERE id = ?',
    { replacements: [orderId], type: QueryTypes.SELECT }
  );
  if (!order) return null;
  if (requirePending && order.payment_status !== 'pending') return null;

  if (user && order.user_id === user.id) return order;

  if (paymentToken && order.payment_token) {
    const a = Buffer.from(String(paymentToken), 'utf8');
    const b = Buffer.from(String(order.payment_token), 'utf8');
    if (a.length === b.length && crypto.timingSafeEqual(a, b)) return order;
  }

  return null;
}

// POST /api/payments/stripe/create-intent
router.post('/stripe/create-intent', optionalAuth, async (req, res, next) => {
  try {
    const { orderId, paymentToken } = req.body;

    const order = await resolvePayableOrder({ orderId, user: req.user, paymentToken });
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.total_amount) * 100),
      currency: 'eur',
      metadata: { orderId: order.id.toString(), orderNumber: order.order_number, userId: String(order.user_id) },
      automatic_payment_methods: { enabled: true }
    });

    await sequelize.query(
      'UPDATE orders SET stripe_payment_intent_id = ? WHERE id = ?',
      { replacements: [paymentIntent.id, orderId], type: QueryTypes.UPDATE }
    );

    res.json({ success: true, clientSecret: paymentIntent.client_secret });
  } catch (error) { next(error); }
});

// POST /api/payments/stripe/confirm
router.post('/stripe/confirm', optionalAuth, async (req, res, next) => {
  try {
    const { paymentIntentId, orderId, paymentToken } = req.body;

    // An order already finalized by the webhook is no longer "pending", so
    // ownership is checked without that requirement and the duplicate is
    // reported as success — the customer did pay.
    const order = await resolvePayableOrder({ orderId, user: req.user, paymentToken, requirePending: false });
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Trusting the client's orderId alone would let anyone mark any order paid
    // by pointing at someone else's succeeded intent.
    if (paymentIntent.metadata?.orderId !== String(order.id)) {
      return res.status(400).json({ success: false, message: 'Pagamento non corrispondente all\'ordine' });
    }

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: `Pagamento non riuscito: ${paymentIntent.status}` });
    }

    const result = await finalizeOrderPayment({
      orderId: order.id,
      method: 'stripe',
      transactionRef: paymentIntent.id
    });

    res.json({
      success: true,
      message: 'Pagamento confermato!',
      alreadyFinalized: result.alreadyFinalized
    });
  } catch (error) { next(error); }
});

// Stripe webhook
const stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // This is the path that runs when the customer closes the tab after paying,
  // so it has to do the full job — flipping payment_status alone left the
  // stock reserved forever and never decremented it.
  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata?.orderId;
    if (orderId) {
      try {
        await finalizeOrderPayment({ orderId, method: 'stripe', transactionRef: pi.id });
      } catch (err) {
        // Answering non-2xx makes Stripe redeliver, which is what we want.
        console.error(`Webhook: finalize failed for order ${orderId}:`, err.message);
        return res.status(500).json({ received: false });
      }
    }
  }

  res.json({ received: true });
};

// POST /api/payments/paypal/create-order
router.post('/paypal/create-order', optionalAuth, async (req, res, next) => {
  try {
    const { orderId, paymentToken } = req.body;
    const order = await resolvePayableOrder({ orderId, user: req.user, paymentToken });
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    // PayPal order creation via REST API
    const accessToken = await getPayPalAccessToken();
    const paypalOrder = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'EUR', value: parseFloat(order.total_amount).toFixed(2) },
          reference_id: order.order_number
        }]
      })
    }).then(r => r.json());

    await sequelize.query(
      'UPDATE orders SET paypal_order_id = ? WHERE id = ?',
      { replacements: [paypalOrder.id, orderId], type: QueryTypes.UPDATE }
    );

    res.json({ success: true, paypalOrderId: paypalOrder.id });
  } catch (error) { next(error); }
});

// POST /api/payments/paypal/capture
router.post('/paypal/capture', optionalAuth, async (req, res, next) => {
  try {
    const { paypalOrderId, orderId, paymentToken } = req.body;

    const order = await resolvePayableOrder({ orderId, user: req.user, paymentToken, requirePending: false });
    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    // The capture must belong to this order, not merely be some completed one.
    if (order.paypal_order_id && order.paypal_order_id !== paypalOrderId) {
      return res.status(400).json({ success: false, message: 'Pagamento non corrispondente all\'ordine' });
    }

    const accessToken = await getPayPalAccessToken();

    const capture = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    }).then(r => r.json());

    if (capture.status !== 'COMPLETED') {
      return res.status(400).json({ success: false, message: 'Pagamento PayPal non riuscito' });
    }

    // Same finalizer as Stripe: PayPal used to mark the order paid and skip
    // inventory entirely.
    const result = await finalizeOrderPayment({
      orderId: order.id,
      method: 'paypal',
      transactionRef: paypalOrderId
    });

    res.json({
      success: true,
      message: 'Pagamento PayPal confermato!',
      alreadyFinalized: result.alreadyFinalized
    });
  } catch (error) { next(error); }
});

async function getPayPalAccessToken() {
  const base64 = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64');
  const response = await fetch(`${getPayPalBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${base64}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'grant_type=client_credentials'
  });
  const data = await response.json();
  return data.access_token;
}

function getPayPalBaseUrl() {
  return process.env.PAYPAL_MODE === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

router.stripeWebhook = stripeWebhook;
module.exports = router;
