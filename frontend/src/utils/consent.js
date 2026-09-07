/**
 * Cookie/tracking consent.
 *
 * The privacy policy already told visitors they could manage preferences via
 * "il banner presente alla prima visita". There was no banner, and no consent
 * state at all — the promise was in the text only.
 *
 * Under GDPR + ePrivacy, only strictly necessary storage may run before a
 * choice is made, refusing must be no harder than accepting, and consent must
 * be withdrawable later. Everything here follows from that: `analytics` and
 * `marketing` default to false and stay false until someone actively opts in.
 *
 * [CUSTOMIZE] Add a category here if you introduce a new class of third-party
 * script, and gate that script on it.
 */

const STORAGE_KEY = 'ecommerce-consent';
// Bump when the categories change: an old choice cannot be consent for a
// category the visitor was never shown.
const CONSENT_VERSION = 1;

export const CATEGORIES = {
  necessary: {
    id: 'necessary',
    label: 'Necessari',
    description: 'Sessione, carrello e sicurezza. Senza questi il sito non funziona.',
    required: true
  },
  analytics: {
    id: 'analytics',
    label: 'Statistiche',
    description: 'Ci dicono quali pagine funzionano, in forma aggregata.',
    required: false
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    description: 'Permettono di misurare le campagne e mostrare annunci pertinenti.',
    required: false
  }
};

const DENY_ALL = { necessary: true, analytics: false, marketing: false };

const listeners = new Set();

export function getConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.version !== CONSENT_VERSION) return null;
    return { ...DENY_ALL, ...parsed.choices };
  } catch {
    // Corrupt or unavailable storage is treated as "no choice made", which
    // fails closed: nothing non-essential runs.
    return null;
  }
}

/** True only for an explicit opt-in. No stored choice means no consent. */
export function hasConsent(category) {
  if (CATEGORIES[category]?.required) return true;
  return getConsent()?.[category] === true;
}

export function setConsent(choices) {
  const resolved = { ...DENY_ALL, ...choices, necessary: true };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: CONSENT_VERSION,
      decidedAt: new Date().toISOString(),
      choices: resolved
    }));
  } catch {
    // Storage blocked: the banner will ask again next visit, which is the
    // correct fallback — better than assuming consent we cannot record.
  }
  listeners.forEach(fn => fn(resolved));
  return resolved;
}

export const acceptAll = () =>
  setConsent({ necessary: true, analytics: true, marketing: true });

export const rejectAll = () => setConsent(DENY_ALL);

/** Lets the visitor change their mind, as withdrawal must be possible. */
export function resetConsent() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
  listeners.forEach(fn => fn(null));
}

export function onConsentChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const hasDecided = () => getConsent() !== null;
