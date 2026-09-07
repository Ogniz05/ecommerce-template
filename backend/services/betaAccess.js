const crypto = require('crypto');
const { sequelize } = require('../config/database');
const { QueryTypes } = require('sequelize');

/**
 * Who is allowed past the access gate, and who they are.
 *
 * The gate previously accepted one shared string from ACCESS_TOKEN. Everybody
 * typed the same thing, so there was no way to know who was testing, to revoke
 * one person without locking out the rest, or to tell whether an invite had
 * ever been used.
 *
 * Per-tester codes fix all three. The shared token still works when it is set,
 * because a template needs a zero-setup way to put a staging site behind a
 * password without provisioning testers first.
 */

function constantTimeEquals(a, b) {
  const bufA = Buffer.from(String(a), 'utf8');
  const bufB = Buffer.from(String(b), 'utf8');
  if (bufA.length !== bufB.length) return false;
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Resolves a submitted code. Returns null when it matches nothing.
 *
 * The per-tester lookup is a direct indexed match rather than a scan-and-
 * compare, so an unknown code costs one query regardless of how many testers
 * exist.
 */
async function resolveAccessCode(code) {
  const trimmed = String(code || '').trim();
  if (!trimmed) return null;

  const shared = process.env.ACCESS_TOKEN;
  if (shared && constantTimeEquals(trimmed, shared)) {
    return { kind: 'shared', testerId: null };
  }

  const [tester] = await sequelize.query(
    'SELECT id, email, name, is_active FROM beta_testers WHERE invite_code = ?',
    { replacements: [trimmed.toUpperCase()], type: QueryTypes.SELECT }
  );

  // A revoked tester is rejected like an unknown code: telling them their
  // invite exists but is disabled is information they do not need.
  if (!tester || !tester.is_active) return null;

  return { kind: 'tester', testerId: tester.id, email: tester.email, name: tester.name };
}

/** Records that a tester actually used their invite, and when they were last seen. */
async function recordVisit(testerId) {
  if (!testerId) return;
  await sequelize.query(
    `UPDATE beta_testers
        SET first_seen_at = COALESCE(first_seen_at, NOW()),
            last_seen_at = NOW(),
            visit_count = visit_count + 1
      WHERE id = ?`,
    { replacements: [testerId], type: QueryTypes.UPDATE }
  );
}

/** True when the gate is switched on at all. */
function gateEnabled() {
  return Boolean(process.env.ACCESS_TOKEN) || process.env.BETA_GATE === 'on';
}

async function isValidCookieValue(value) {
  return (await resolveAccessCode(value)) !== null;
}

module.exports = { resolveAccessCode, recordVisit, gateEnabled, isValidCookieValue, constantTimeEquals };
