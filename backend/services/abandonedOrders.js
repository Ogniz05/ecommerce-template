const cron = require('node-cron');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const { releaseOrderReservation } = require('./orderPayment');

// How long an unpaid order may hold its stock. Long enough to finish a slow
// card flow (3-D Secure, a bank app round-trip), short enough that a browser
// closed at the payment step does not keep the last unit of a product
// unbuyable indefinitely.
const HOLD_MINUTES = parseInt(process.env.ORDER_RESERVATION_MINUTES) || 60;

/**
 * Releases stock held by orders that were created and never paid.
 *
 * Order creation reserves inventory so two shoppers cannot buy the same last
 * unit while one is typing card details. Nothing ever gave that reservation
 * back: an abandoned checkout subtracted from available stock permanently, and
 * a shop left running long enough would show everything as out of stock while
 * the warehouse was full.
 */
async function releaseAbandonedOrders() {
  const stale = await sequelize.query(
    `SELECT id FROM orders
      WHERE payment_status = 'pending'
        AND created_at < DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
    { replacements: [HOLD_MINUTES], type: QueryTypes.SELECT }
  );

  let released = 0;
  for (const order of stale) {
    try {
      // Each order is claimed independently, so a payment landing mid-sweep
      // loses the race here rather than having its stock pulled out from under it.
      const result = await releaseOrderReservation(order.id);
      if (result.released) released++;
    } catch (error) {
      console.error(`Abandoned-order sweep: order ${order.id} failed:`, error.message);
    }
  }

  if (released > 0) {
    console.log(`🧹 Released stock for ${released} abandoned order(s)`);
  }
  return { scanned: stale.length, released };
}

function startAbandonedOrderSweep() {
  // Every 15 minutes; the hold window is measured per-order, so the sweep
  // cadence only bounds how late a release can be.
  cron.schedule('*/15 * * * *', () => {
    releaseAbandonedOrders().catch(err =>
      console.error('Abandoned-order sweep failed:', err.message)
    );
  });
  console.log(`🧹 Abandoned-order sweep active (hold ${HOLD_MINUTES}min)`);
}

module.exports = { releaseAbandonedOrders, startAbandonedOrderSweep, HOLD_MINUTES };
