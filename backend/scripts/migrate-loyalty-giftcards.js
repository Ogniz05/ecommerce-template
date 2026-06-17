require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function columnExists(table, column) {
  const [r] = await sequelize.query(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
    { replacements: [table, column], type: QueryTypes.SELECT }
  );
  return !!r;
}

async function addColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    await sequelize.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`, { type: QueryTypes.RAW });
    console.log(`+ ${table}.${column} added`);
  } else {
    console.log(`= ${table}.${column} exists`);
  }
}

async function run() {
  // 1. Loyalty points balance on users
  await addColumn('users', 'loyalty_points', 'INT DEFAULT 0');

  // 2. Loyalty transactions ledger
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS loyalty_transactions (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT NOT NULL,
      order_id INT DEFAULT NULL,
      points INT NOT NULL,
      type ENUM('earn','redeem','adjust','expire') NOT NULL,
      description VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `, { type: QueryTypes.RAW });
  console.log('= loyalty_transactions ready');

  // 3. Gift cards
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS gift_cards (
      id INT PRIMARY KEY AUTO_INCREMENT,
      code VARCHAR(32) NOT NULL UNIQUE,
      initial_amount DECIMAL(10,2) NOT NULL,
      balance DECIMAL(10,2) NOT NULL,
      status ENUM('active','used','disabled') DEFAULT 'active',
      purchaser_user_id INT DEFAULT NULL,
      recipient_email VARCHAR(255) DEFAULT NULL,
      message TEXT,
      expires_at DATE DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (purchaser_user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `, { type: QueryTypes.RAW });
  console.log('= gift_cards ready');

  // 4. Order columns
  await addColumn('orders', 'points_earned', 'INT DEFAULT 0');
  await addColumn('orders', 'points_redeemed', 'INT DEFAULT 0');
  await addColumn('orders', 'gift_card_code', 'VARCHAR(32) DEFAULT NULL');
  await addColumn('orders', 'gift_card_amount', 'DECIMAL(10,2) DEFAULT 0');

  console.log('\nMigration complete.');
  process.exit(0);
}
run().catch(e => { console.error('FATAL:', e.message); process.exit(1); });
