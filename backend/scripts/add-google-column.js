require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

async function run() {
  const [cols] = await sequelize.query(
    "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'google_id'",
    { type: QueryTypes.SELECT }
  );
  if (!cols) {
    await sequelize.query('ALTER TABLE users ADD COLUMN google_id VARCHAR(255) DEFAULT NULL', { type: QueryTypes.RAW });
    console.log('google_id column added');
  } else {
    console.log('google_id already exists');
  }
  process.exit(0);
}
run().catch(e => { console.error(e.message); process.exit(1); });
