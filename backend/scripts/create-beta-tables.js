require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');
const crypto = require('crypto');

/**
 * Tables for the beta programme.
 *
 * The access gate was a single shared token in ACCESS_TOKEN: everyone typed
 * the same string, so there was no way to tell who was testing, to revoke one
 * person's access without locking out everyone, or to know whether an invite
 * was ever used. And testers had nowhere to report what they found — the whole
 * point of having them.
 *
 * `beta_testers` gives each person their own code; `beta_feedback` is where
 * their reports land, with the page and viewport attached so a report is
 * actionable without a follow-up email.
 */
(async () => {
  try {
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS beta_testers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL,
        name VARCHAR(255) NULL,
        invite_code CHAR(12) NOT NULL,
        is_active TINYINT(1) NOT NULL DEFAULT 1,
        first_seen_at DATETIME NULL,
        last_seen_at DATETIME NULL,
        visit_count INT NOT NULL DEFAULT 0,
        notes TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_beta_code (invite_code),
        UNIQUE KEY uq_beta_email (email)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS beta_feedback (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tester_id INT NULL,
        user_id INT NULL,
        kind ENUM('bug','idea','confusing','praise') NOT NULL DEFAULT 'bug',
        message TEXT NOT NULL,
        page_url VARCHAR(500) NULL,
        viewport VARCHAR(32) NULL,
        user_agent VARCHAR(255) NULL,
        status ENUM('new','triaged','resolved','wontfix') NOT NULL DEFAULT 'new',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        KEY idx_feedback_status (status),
        CONSTRAINT fk_feedback_tester FOREIGN KEY (tester_id)
          REFERENCES beta_testers(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const [count] = await sequelize.query(
      'SELECT COUNT(*) AS c FROM beta_testers', { type: QueryTypes.SELECT }
    );

    console.log('✓ beta_testers and beta_feedback ready');
    console.log(`  testers registered: ${count.c}`);

    // Convenience: `node scripts/create-beta-tables.js invite a@b.com "Nome"`
    const [, , cmd, email, name] = process.argv;
    if (cmd === 'invite' && email) {
      const code = crypto.randomBytes(6).toString('hex').toUpperCase();
      await sequelize.query(
        `INSERT INTO beta_testers (email, name, invite_code) VALUES (?, ?, ?)
         ON DUPLICATE KEY UPDATE invite_code = VALUES(invite_code), is_active = 1`,
        { replacements: [email.toLowerCase(), name || null, code], type: QueryTypes.INSERT }
      );
      console.log(`\n✓ Invite for ${email}: ${code}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
})();
