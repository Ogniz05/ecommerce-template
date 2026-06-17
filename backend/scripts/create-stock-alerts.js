require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function run() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS stock_alerts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      product_id INT NOT NULL,
      variant_id INT DEFAULT NULL,
      email VARCHAR(255) NOT NULL,
      user_id INT DEFAULT NULL,
      notified_at TIMESTAMP NULL DEFAULT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_alert (product_id, variant_id, email),
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `, { type: QueryTypes.RAW });
  console.log('stock_alerts table created');
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
