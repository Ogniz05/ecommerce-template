const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { authenticate } = require('../middleware/auth');

// POST /api/payments/stripe/create-intent
router.post('/stripe/create-intent', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.body;

    const [order] = await sequelize.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ? AND payment_status = "pending"',
      { replacements: [orderId, req.user.id], type: QueryTypes.SELECT }
    );

    if (!order) return res.status(404).json({ success: false, message: 'Ordine non trovato' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(parseFloat(order.total_amount) * 100),
      currency: 'eur',
      metadata: { orderId: order.id.toString(), orderNumber: order.order_number, userId: req.user.id.toString() },
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
router.post('/stripe/confirm', authenticate, async (req, res, next) => {
  try {
    const { paymentIntentId, orderId } = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded') {
      await sequelize.query(
        'UPDATE orders SET payment_status = "paid", status = "processing", payment_method = "stripe" WHERE id = ? AND user_id = ?',
        { replacements: [orderId, req.user.id], type: QueryTypes.UPDATE }
      );

      // Decrement actual inventory
      const items = await sequelize.query(
        'SELECT * FROM order_items WHERE order_id = ?',
        { replacements: [orderId], type: QueryTypes.SELECT }
      );

      for (const item of items) {
        await sequelize.query(
          `UPDATE inventory SET quantity = quantity - ?, reserved = reserved - ?
           WHERE product_id = ? AND ${item.variant_id ? 'variant_id = ?' : 'variant_id IS NULL'}`,
          { replacements: item.variant_id
            ? [item.quantity, item.quantity, item.product_id, item.variant_id]
            : [item.quantity, item.quantity, item.product_id],
            type: QueryTypes.UPDATE
          }
        );

        await sequelize.query(
          'UPDATE products SET total_sold = total_sold + ? WHERE id = ?',
          { replacements: [item.quantity, item.product_id], type: QueryTypes.UPDATE }
        );
      }

      res.json({ success: true, message: 'Pagamento confermato!' });
    } else {
      res.status(400).json({ success: false, message: `Pagamento non riuscito: ${paymentIntent.status}` });
    }
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

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object;
    const orderId = pi.metadata?.orderId;
    if (orderId) {
      await sequelize.query(
        'UPDATE orders SET payment_status = "paid", status = "processing" WHERE id = ? AND payment_status = "pending"',
        { replacements: [orderId], type: QueryTypes.UPDATE }
      );
    }
  }

  res.json({ received: true });
};

// POST /api/payments/paypal/create-order
router.post('/paypal/create-order', authenticate, async (req, res, next) => {
  try {
    const { orderId } = req.body;
    const [order] = await sequelize.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      { replacements: [orderId, req.user.id], type: QueryTypes.SELECT }
    );
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
router.post('/paypal/capture', authenticate, async (req, res, next) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    const accessToken = await getPayPalAccessToken();

    const capture = await fetch(`${getPayPalBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      }
    }).then(r => r.json());

    if (capture.status === 'COMPLETED') {
      await sequelize.query(
        'UPDATE orders SET payment_status = "paid", status = "processing", payment_method = "paypal" WHERE id = ? AND user_id = ?',
        { replacements: [orderId, req.user.id], type: QueryTypes.UPDATE }
      );
      res.json({ success: true, message: 'Pagamento PayPal confermato!' });
    } else {
      res.status(400).json({ success: false, message: 'Pagamento PayPal non riuscito' });
    }
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
