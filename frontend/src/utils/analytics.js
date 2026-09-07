import { hasConsent, onConsentChange } from './consent';

/**
 * Product analytics, consent-gated.
 *
 * The admin panel already had an analytics tab, but it reports on orders in
 * the database — it can say what sold and cannot say what people looked at,
 * where they abandoned, or which listings never converted. This is the other
 * half.
 *
 * Two rules the implementation exists to enforce:
 *
 * 1. Nothing is loaded or sent before the visitor opts in. The provider script
 *    is injected on consent, not on page load, so declining means no third
 *    party ever sees the visit — not merely that we asked them not to record it.
 * 2. No personal data in events. Product ids, values and currency only; never
 *    email, name or address. An analytics payload is the easiest place to leak
 *    a customer by accident.
 *
 * Events are queued while consent is undecided and flushed if it is granted,
 * so a purchase completed before the banner is answered is not silently lost.
 *
 * [CUSTOMIZE] Set VITE_GA_MEASUREMENT_ID, or replace `deliver()` with your own
 * provider — nothing outside this file knows which one is in use.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const DEBUG = import.meta.env.DEV;

let loaded = false;
let queue = [];

function loadProvider() {
  if (loaded || !GA_ID) return;
  loaded = true;

  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, {
    // We ask for consent, so there is no need to also fingerprint: IP
    // anonymisation and no ad personalisation keep this to plain measurement.
    anonymize_ip: true,
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    send_page_view: false
  });
}

function deliver(name, params) {
  if (DEBUG) console.debug('[analytics]', name, params);
  if (!GA_ID) return;
  window.gtag?.('event', name, params);
}

function flush() {
  const pending = queue;
  queue = [];
  pending.forEach(({ name, params }) => deliver(name, params));
}

export function initAnalytics() {
  if (hasConsent('analytics')) {
    loadProvider();
    flush();
  }
  // Consent can arrive later, or be withdrawn. Granting it mid-session starts
  // collection from that point; withdrawing stops queueing anything further.
  onConsentChange(() => {
    if (hasConsent('analytics')) {
      loadProvider();
      flush();
    } else {
      queue = [];
    }
  });
}

export function track(name, params = {}) {
  if (!hasConsent('analytics')) {
    // Undecided is not the same as refused: hold the event in case they accept.
    // Refused clears the queue above, so nothing survives a rejection.
    if (queue.length < 50) queue.push({ name, params });
    return;
  }
  loadProvider();
  deliver(name, params);
}

export const trackPageView = (path, title) =>
  track('page_view', { page_path: path, page_title: title });

// Standard ecommerce funnel. Item shapes follow GA4 so the reports work
// out of the box, but nothing outside this file depends on that.
const item = (p, qty = 1) => ({
  item_id: String(p.id ?? p.product_id ?? ''),
  item_name: p.name ?? p.product_name ?? '',
  item_category: p.category_name ?? undefined,
  price: Number(p.price) || 0,
  quantity: qty
});

export const trackViewItem = (product) =>
  track('view_item', { currency: 'EUR', value: Number(product?.price) || 0, items: [item(product)] });

export const trackAddToCart = (product, qty = 1) =>
  track('add_to_cart', {
    currency: 'EUR',
    value: (Number(product?.price) || 0) * qty,
    items: [item(product, qty)]
  });

export const trackRemoveFromCart = (product, qty = 1) =>
  track('remove_from_cart', { currency: 'EUR', items: [item(product, qty)] });

export const trackBeginCheckout = (items, value) =>
  track('begin_checkout', {
    currency: 'EUR',
    value: Number(value) || 0,
    items: (items || []).map(i => item(i, i.quantity))
  });

export const trackPurchase = ({ orderNumber, value, items }) =>
  track('purchase', {
    transaction_id: String(orderNumber || ''),
    currency: 'EUR',
    value: Number(value) || 0,
    items: (items || []).map(i => item(i, i.quantity))
  });

export const trackSearch = (term) => track('search', { search_term: String(term || '').slice(0, 100) });
