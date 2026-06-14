// One-off helper: create/update a test Moderator user.
// Run: node scripts/make-moderator.js
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

(async () => {
  try {
    const email = 'mod@yourcompany.com';
    const hash = await bcrypt.hash('Admin@123456', 12);
    const [ex] = await sequelize.query('SELECT id FROM users WHERE email = ?', { replacements: [email], type: QueryTypes.SELECT });
    if (ex) {
      await sequelize.query("UPDATE users SET role='moderator', password=?, is_active=1, is_verified=1 WHERE id=?", { replacements: [hash, ex.id], type: QueryTypes.UPDATE });
      console.log('UPDATED moderator id', ex.id);
    } else {
      const [id] = await sequelize.query(
        "INSERT INTO users (email, password, first_name, last_name, role, is_active, is_verified) VALUES (?, ?, 'Mod', 'Eratore', 'moderator', 1, 1)",
        { replacements: [email, hash], type: QueryTypes.INSERT });
      console.log('CREATED moderator id', id);
    }
    process.exit(0);
  } catch (e) { console.error('ERR', e.message); process.exit(1); }
})();
