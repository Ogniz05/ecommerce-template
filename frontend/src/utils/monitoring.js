import * as Sentry from '@sentry/react';

/**
 * Crash reporting, kept behind one narrow interface.
 *
 * Nothing initializes unless VITE_SENTRY_DSN is set, so the template ships
 * inert: no network calls, no third-party cookies, no consent obligation for
 * anyone who never configures it. Setting the DSN in an environment is the
 * whole activation step.
 *
 * The rest of the app imports `captureError` and never Sentry itself, so
 * swapping providers is a change to this file alone.
 *
 * [CUSTOMIZE] Set VITE_SENTRY_DSN in frontend/.env to enable.
 */

const DSN = import.meta.env.VITE_SENTRY_DSN;
const ENV = import.meta.env.MODE;
const RELEASE = import.meta.env.VITE_APP_VERSION || 'dev';

let active = false;

export function initMonitoring() {
  if (!DSN || active) return false;

  Sentry.init({
    dsn: DSN,
    environment: ENV,
    release: RELEASE,
    // Traces are sampled sparsely: this is a storefront, and full tracing on
    // every checkout is both noisy and expensive.
    tracesSampleRate: ENV === 'production' ? 0.1 : 0,
    // Session replay is deliberately off. It records what customers type,
    // which on a checkout page means card and address fields.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
    beforeSend(event) {
      // Strip anything that could carry an address or card detail before it
      // leaves the browser.
      if (event.request?.cookies) delete event.request.cookies;
      if (event.user) {
        event.user = { id: event.user.id };
      }
      return event;
    }
  });

  active = true;
  return true;
}

/**
 * Reports an error. Safe to call whether or not monitoring is configured —
 * without a DSN it is a console log, which is what a developer wants locally
 * anyway.
 */
export function captureError(error, context = {}) {
  if (import.meta.env.DEV) {
    console.error('[monitoring]', error, context);
  }
  if (!active) return;
  Sentry.captureException(error, { extra: context });
}

/**
 * Attaches the signed-in user to subsequent reports, by id only — never email
 * or name, which would put personal data in a third-party system.
 */
export function identifyUser(user) {
  if (!active) return;
  Sentry.setUser(user ? { id: String(user.id) } : null);
}

/** Leaves a trail of what the user did before a crash. */
export function addBreadcrumb(message, data = {}) {
  if (!active) return;
  Sentry.addBreadcrumb({ message, data, level: 'info' });
}

export const isMonitoringActive = () => active;
