const { v4: uuidv4 } = require('uuid');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Erasure under GDPR Art. 17, for a shop that also has to keep its books.
 *
 * A customer with orders cannot simply be deleted. Invoices and order records
 * are retained under a legal obligation (Art. 17(3)(b)), and `orders.user_id`
 * is ON DELETE NO ACTION, so a hard delete fails at the database anyway. The
 * answer is to erase the person while leaving the accounting record: personal
 * fields are overwritten in place, the row stops being an account, and the
 * orders keep pointing at an entry that no longer identifies anyone.
 *
 * A customer with no orders has nothing to retain and is deleted outright; the
 * cascades on addresses, wishlist, reviews and loyalty rows do the rest.
 */

async function summarizeAccount(userId) {
  const [orders] = await sequelize.query(
    'SELECT COUNT(*) AS c FROM orders WHERE user_id = ?',
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  return { orderCount: Number(orders.c) };
}

/**
 * Refuses to remove the last remaining admin, which would lock everyone out of
 * the panel with no way back in short of editing the database by hand.
 */
async function isLastAdmin(userId) {
  const [user] = await sequelize.query(
    'SELECT role FROM users WHERE id = ?',
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  if (user?.role !== 'admin') return false;

  const [others] = await sequelize.query(
    "SELECT COUNT(*) AS c FROM users WHERE role = 'admin' AND is_active = 1 AND id <> ?",
    { replacements: [userId], type: QueryTypes.SELECT }
  );
  return Number(others.c) === 0;
}

async function deleteAccount(userId) {
  const { orderCount } = await summarizeAccount(userId);
  const transaction = await sequelize.transaction();

  try {
    // Rows that are purely the customer's own data go regardless of which
    // path we take — none of them are needed for the accounting record.
    await sequelize.query('DELETE FROM user_addresses WHERE user_id = ?',
      { replacements: [userId], type: QueryTypes.DELETE, transaction });
    await sequelize.query('DELETE FROM wishlist WHERE user_id = ?',
      { replacements: [userId], type: QueryTypes.DELETE, transaction });
    await sequelize.query('DELETE FROM stock_alerts WHERE user_id = ?',
      { replacements: [userId], type: QueryTypes.DELETE, transaction });

    const [user] = await sequelize.query('SELECT email FROM users WHERE id = ?',
      { replacements: [userId], type: QueryTypes.SELECT, transaction });

    if (user?.email) {
      await sequelize.query('DELETE FROM newsletter_subscribers WHERE email = ?',
        { replacements: [user.email], type: QueryTypes.DELETE, transaction });
    }

    if (orderCount === 0) {
      await sequelize.query('DELETE FROM reviews WHERE user_id = ?',
        { replacements: [userId], type: QueryTypes.DELETE, transaction });
      await sequelize.query('DELETE FROM loyalty_transactions WHERE user_id = ?',
        { replacements: [userId], type: QueryTypes.DELETE, transaction });
      await sequelize.query('DELETE FROM users WHERE id = ?',
        { replacements: [userId], type: QueryTypes.DELETE, transaction });

      await transaction.commit();
      return { mode: 'deleted', orderCount };
    }

    // Anonymize. The address blobs stored on each order are rewritten too —
    // erasing the user row while leaving their street address on the order
    // would not be erasure at all.
    const anonEmail = `deleted-${uuidv4()}@deleted.invalid`;

    await sequelize.query(
      `UPDATE users SET
         email = ?, first_name = 'Utente', last_name = 'eliminato',
         phone = NULL, avatar_url = NULL, password = ?, google_id = NULL,
         is_active = 0, is_verified = 0,
         email_verify_token = NULL, reset_password_token = NULL, reset_password_expires = NULL,
         loyalty_points = 0
       WHERE id = ?`,
      { replacements: [anonEmail, `deleted:${uuidv4()}`, userId], type: QueryTypes.UPDATE, transaction }
    );

    await sequelize.query(
      `UPDATE orders SET
         shipping_address = JSON_OBJECT('anonymized', true),
         billing_address = JSON_OBJECT('anonymized', true),
         notes = NULL
       WHERE user_id = ?`,
      { replacements: [userId], type: QueryTypes.UPDATE, transaction }
    );

    // Reviews are public text that may name the author; the rating is
    // aggregate data worth keeping, the identity is not.
    await sequelize.query(
      'UPDATE reviews SET title = NULL, content = NULL WHERE user_id = ?',
      { replacements: [userId], type: QueryTypes.UPDATE, transaction }
    );

    await transaction.commit();
    return { mode: 'anonymized', orderCount };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Everything held about one person, for Art. 15 access and Art. 20
 * portability. JSON rather than a rendered document so it is genuinely
 * machine-readable, which is what portability asks for.
 */
async function exportAccountData(userId) {
  const q = (sql, replacements = [userId]) =>
    sequelize.query(sql, { replacements, type: QueryTypes.SELECT });

  const [user] = await q(
    `SELECT id, email, first_name, last_name, phone, role, is_verified,
            loyalty_points, created_at, last_login
       FROM users WHERE id = ?`
  );

  const [addresses, orders, reviews, loyalty, wishlist, returns] = await Promise.all([
    q('SELECT * FROM user_addresses WHERE user_id = ?'),
    q(`SELECT id, order_number, status, payment_status, payment_method, subtotal,
              discount_amount, shipping_cost, tax_amount, total_amount, currency,
              coupon_code, shipping_address, billing_address, shipping_method,
              tracking_number, points_earned, points_redeemed, created_at
         FROM orders WHERE user_id = ? ORDER BY created_at DESC`),
    q('SELECT id, product_id, rating, title, content, created_at FROM reviews WHERE user_id = ?'),
    q('SELECT id, order_id, points, type, description, created_at FROM loyalty_transactions WHERE user_id = ?'),
    q('SELECT product_id, created_at FROM wishlist WHERE user_id = ?'),
    q('SELECT id, order_id, status, reason, description, refund_amount, created_at FROM return_requests WHERE user_id = ?')
  ]);

  const orderIds = orders.map(o => o.id);
  const items = orderIds.length
    ? await sequelize.query(
        'SELECT order_id, product_name, variant_name, quantity, unit_price, total_price FROM order_items WHERE order_id IN (?)',
        { replacements: [orderIds], type: QueryTypes.SELECT }
      )
    : [];

  return {
    exported_at: new Date().toISOString(),
    format_version: 1,
    account: user || null,
    addresses,
    orders: orders.map(o => ({ ...o, items: items.filter(i => i.order_id === o.id) })),
    reviews,
    loyalty_transactions: loyalty,
    wishlist,
    return_requests: returns
  };
}

module.exports = { deleteAccount, exportAccountData, summarizeAccount, isLastAdmin };
