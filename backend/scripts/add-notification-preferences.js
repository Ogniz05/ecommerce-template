require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Adds users.notification_prefs.
 *
 * The profile already had a notification preferences panel, but it wrote to
 * localStorage and nothing else — the server never learned the choice, so the
 * shop kept sending every kind of mail regardless of what the customer
 * unticked. A marketing opt-out that does not reach the sender is not an
 * opt-out.
 *
 * Stored as JSON because these are a handful of booleans read together and
 * never queried individually.
 */
(async () => {
  try {
    const [existing] = await sequelize.query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'
          AND COLUMN_NAME = 'notification_prefs'`,
      { type: QueryTypes.SELECT }
    );

    if (existing) {
      console.log('✓ users.notification_prefs already present — nothing to do');
      process.exit(0);
    }

    await sequelize.query(
      'ALTER TABLE users ADD COLUMN notification_prefs JSON NULL AFTER loyalty_points'
    );

    console.log('✓ Added users.notification_prefs');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
})();
