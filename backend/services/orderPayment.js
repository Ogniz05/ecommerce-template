const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

const POINTS_PER_EURO = parseInt(process.env.LOYALTY_POINTS_PER_EURO) || 1;

/**
 * How many rows an UPDATE matched, across the two shapes sequelize returns.
 *
 * With `type: QueryTypes.UPDATE` it hands back `[null, <rows matched>]` — a
 * bare number — while a typeless query yields the raw mysql2 metadata object.
 * Reading `.changedRows` off the number silently produced `undefined`, which
 * made every claim look like it had already been taken.
 */
function rowsMatched(result) {
  const second = Array.isArray(result) ? result[1] : result;
  if (typeof second === 'number') return second;
  return second?.affectedRows ?? second?.changedRows ?? 0;
}

/**
 * Single place where an order becomes paid.
 *
 * Four different code paths can complete a payment — Stripe /confirm, the
 * Stripe webhook, PayPal capture, and any future method — and before this
 * existed only Stripe /confirm decremented inventory. The other paths flipped
 * payment_status to "paid" and left `reserved` held forever and `quantity`
 * untouched, so a customer who closed the tab after paying kept the stock
 * locked and the shop oversold.
 *
 * Exactly-once is enforced by the UPDATE itself: the pending -> paid flip is
 * conditional on the row still being pending, and MySQL reports how many rows
 * it changed. Losing that race means another path already finalized the order,
 * so we stop rather than decrement stock or grant points a second time. That
 * matters most for Stripe, where /confirm and the webhook routinely both fire
 * for the same payment.
 */
async function finalizeOrderPayment({ orderId, method, transactionRef = null }) {
  const transaction = await sequelize.transaction();

  try {
    // Claim the order. The WHERE only matches while the row is still pending,
    // so a second caller matches nothing and stops before touching stock.
    const claim = await sequelize.query(
      `UPDATE orders
          SET payment_status = 'paid',
              status = CASE WHEN status = 'pending' THEN 'processing' ELSE status END,
              payment_method = ?
        WHERE id = ? AND payment_status = 'pending'`,
      { replacements: [method, orderId], type: QueryTypes.UPDATE, transaction }
    );

    if (rowsMatched(claim) === 0) {
      await transaction.rollback();
      return { finalized: false, alreadyFinalized: true };
    }

    const [order] = await sequelize.query(
      'SELECT id, user_id, order_number, total_amount, points_earned FROM orders WHERE id = ?',
      { replacements: [orderId], type: QueryTypes.SELECT, transaction }
    );

    const items = await sequelize.query(
      'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
      { replacements: [orderId], type: QueryTypes.SELECT, transaction }
    );

    for (const item of items) {
      // The reservation taken at order creation is converted into a real
      // decrement here — both counters move together or neither does.
      await sequelize.query(
        `UPDATE inventory
            SET quantity = GREATEST(0, quantity - ?),
                reserved = GREATEST(0, reserved - ?)
          WHERE product_id = ? AND ${item.variant_id ? 'variant_id = ?' : 'variant_id IS NULL'}`,
        {
          replacements: item.variant_id
            ? [item.quantity, item.quantity, item.product_id, item.variant_id]
            : [item.quantity, item.quantity, item.product_id],
          type: QueryTypes.UPDATE,
          transaction
        }
      );

      await sequelize.query(
        'UPDATE products SET total_sold = total_sold + ? WHERE id = ?',
        { replacements: [item.quantity, item.product_id], type: QueryTypes.UPDATE, transaction }
      );
    }

    // Points are granted here rather than at order creation: an unpaid order
    // used to mint spendable points, which turned an abandoned checkout into a
    // discount on the next one.
    const pointsEarned = order?.points_earned ?? Math.floor(parseFloat(order?.total_amount || 0) * POINTS_PER_EURO);
    if (order?.user_id && pointsEarned > 0) {
      await sequelize.query(
        'UPDATE users SET loyalty_points = loyalty_points + ? WHERE id = ?',
        { replacements: [pointsEarned, order.user_id], type: QueryTypes.UPDATE, transaction }
      );
      await sequelize.query(
        `INSERT INTO loyalty_transactions (user_id, order_id, points, type, description)
         VALUES (?, ?, ?, 'earn', ?)`,
        {
          replacements: [order.user_id, orderId, pointsEarned, `Punti da ordine ${order.order_number}`],
          type: QueryTypes.INSERT,
          transaction
        }
      );
    }

    if (transactionRef) {
      await sequelize.query(
        'UPDATE orders SET notes = CONCAT(COALESCE(notes, ""), ?) WHERE id = ?',
        { replacements: [`[${method}:${transactionRef}]`, orderId], type: QueryTypes.UPDATE, transaction }
      );
    }

    await transaction.commit();
    return { finalized: true, alreadyFinalized: false, orderId, pointsEarned };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Releases a reservation for an order that will never be paid, so abandoned
 * checkouts stop counting against available stock.
 */
async function releaseOrderReservation(orderId) {
  const transaction = await sequelize.transaction();
  try {
    const claim = await sequelize.query(
      `UPDATE orders SET payment_status = 'failed', status = 'cancelled'
        WHERE id = ? AND payment_status = 'pending'`,
      { replacements: [orderId], type: QueryTypes.UPDATE, transaction }
    );

    if (rowsMatched(claim) === 0) {
      await transaction.rollback();
      return { released: false };
    }

    const items = await sequelize.query(
      'SELECT product_id, variant_id, quantity FROM order_items WHERE order_id = ?',
      { replacements: [orderId], type: QueryTypes.SELECT, transaction }
    );

    for (const item of items) {
      await sequelize.query(
        `UPDATE inventory SET reserved = GREATEST(0, reserved - ?)
          WHERE product_id = ? AND ${item.variant_id ? 'variant_id = ?' : 'variant_id IS NULL'}`,
        {
          replacements: item.variant_id
            ? [item.quantity, item.product_id, item.variant_id]
            : [item.quantity, item.product_id],
          type: QueryTypes.UPDATE,
          transaction
        }
      );
    }

    await transaction.commit();
    return { released: true };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

module.exports = { finalizeOrderPayment, releaseOrderReservation, POINTS_PER_EURO };
