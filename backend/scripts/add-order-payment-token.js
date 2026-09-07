require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Adds orders.payment_token.
 *
 * Guest checkout creates a shadow user but hands the browser no credentials,
 * so the payment endpoints could not authenticate the buyer and were locked
 * behind `authenticate` — leaving guests unable to pay at all. The token is
 * returned once, in the create-order response, and is the guest's proof of
 * ownership for the payment calls on that one order.
 */
(async () => {
  try {
    const [existing] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders' AND COLUMN_NAME = 'payment_token'`,
      { type: QueryTypes.SELECT }
    );

    if (existing) {
      console.log('✓ orders.payment_token already present — nothing to do');
      process.exit(0);
    }

    await sequelize.query(
      'ALTER TABLE orders ADD COLUMN payment_token CHAR(36) NULL AFTER payment_status'
    );
    await sequelize.query(
      'CREATE INDEX idx_orders_payment_token ON orders (payment_token)'
    );

    console.log('✓ Added orders.payment_token + index');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
})();
