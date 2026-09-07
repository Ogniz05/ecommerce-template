const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Which emails a customer has agreed to receive.
 *
 * Two kinds of mail, and they are not interchangeable:
 *
 * `transactional` messages report on something the customer asked for — an
 * order confirmation, a shipping update, a refund. They are not marketing and
 * are not opt-out; suppressing them would leave someone who paid with no
 * record of it. They are listed here as `alwaysOn` so the distinction is
 * explicit in code rather than assumed.
 *
 * `marketing` messages are opt-out, and the switch has to actually reach the
 * sender: the profile panel used to write these to localStorage only.
 *
 * [CUSTOMIZE] Add a category here and honour it at the send site.
 */
const CATEGORIES = {
  order_updates: { alwaysOn: true,  default: true },
  restock:       { alwaysOn: false, default: true },
  reviews:       { alwaysOn: false, default: true },
  promotions:    { alwaysOn: false, default: false },
  newsletter:    { alwaysOn: false, default: false }
};

const DEFAULTS = Object.fromEntries(
  Object.entries(CATEGORIES).map(([k, v]) => [k, v.default])
);

async function getPreferences(userId) {
  const [row] = await sequelize.query(
    'SELECT notification_prefs FROM users WHERE id = ?',
    { replacements: [userId], type: QueryTypes.SELECT }
  );

  let stored = row?.notification_prefs;
  if (typeof stored === 'string') {
    try { stored = JSON.parse(stored); } catch { stored = null; }
  }

  const merged = { ...DEFAULTS, ...(stored || {}) };
  // A customer cannot switch off the mail that tells them what happened to
  // their money, so this is enforced on read rather than trusted from storage.
  for (const [key, meta] of Object.entries(CATEGORIES)) {
    if (meta.alwaysOn) merged[key] = true;
  }
  return merged;
}

async function setPreferences(userId, incoming) {
  const next = {};
  for (const [key, meta] of Object.entries(CATEGORIES)) {
    if (meta.alwaysOn) continue;
    if (key in incoming) next[key] = Boolean(incoming[key]);
  }

  const current = await getPreferences(userId);
  const merged = { ...current, ...next };

  await sequelize.query(
    'UPDATE users SET notification_prefs = ? WHERE id = ?',
    { replacements: [JSON.stringify(merged), userId], type: QueryTypes.UPDATE }
  );

  return getPreferences(userId);
}

/**
 * Gate for the send sites. Unknown categories return true so that adding a new
 * transactional mail never silently sends nothing; opting out is an explicit
 * act, recorded above.
 */
async function canSend(userId, category) {
  if (!userId) return true;
  if (CATEGORIES[category]?.alwaysOn) return true;
  if (!(category in CATEGORIES)) return true;
  const prefs = await getPreferences(userId);
  return prefs[category] !== false;
}

module.exports = { getPreferences, setPreferences, canSend, CATEGORIES, DEFAULTS };
