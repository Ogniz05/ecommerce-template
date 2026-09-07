import axios from 'axios';
import { captureError } from './monitoring';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Retry only what is safe to repeat. A POST that created an order must never be
// replayed automatically — the customer would get two orders — so only
// idempotent verbs qualify, and only for faults that are plausibly transient.
const RETRYABLE_METHODS = ['get', 'head', 'options'];
const RETRYABLE_STATUS = [408, 429, 502, 503, 504];
const MAX_RETRIES = 2;

function isRetryable(error) {
  const config = error.config;
  if (!config || config.__retryCount >= MAX_RETRIES) return false;
  if (!RETRYABLE_METHODS.includes((config.method || '').toLowerCase())) return false;

  // No response at all: connection refused, DNS failure, timeout.
  if (!error.response) return true;
  return RETRYABLE_STATUS.includes(error.response.status);
}

function retryDelay(attempt, error) {
  // Honour the server when it says how long to wait.
  const retryAfter = Number(error.response?.headers?.['retry-after']);
  if (Number.isFinite(retryAfter) && retryAfter > 0) return retryAfter * 1000;
  // Otherwise exponential backoff with jitter, so a server coming back up is
  // not hit by every client in the same instant.
  return Math.min(2 ** attempt * 400, 4000) + Math.random() * 250;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const config = error.config;

    if (isRetryable(error)) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      await new Promise(r => setTimeout(r, retryDelay(config.__retryCount, error)));
      return api(config);
    }

    if (error.response?.status === 401) {
      // Clear both the raw token this file reads on each request AND the
      // zustand-persisted auth blob (useStore's `ecommerce-auth` key) that
      // drives isAuthenticated across the app. Removing only the former left
      // stale/expired sessions "authenticated" after reload, so PublicOnly
      // guards (e.g. on /auth/login) bounced straight back to /profile
      // instead of letting the user log in again.
      localStorage.removeItem('token');
      localStorage.removeItem('ecommerce-auth');
      window.location.href = '/auth/login';
    }

    // A 5xx is our fault and worth a report; 4xx is the client being told no,
    // which is normal traffic and would only bury the real faults.
    if (error.response?.status >= 500) {
      captureError(error, {
        url: config?.url,
        method: config?.method,
        status: error.response.status
      });
    }

    // Normalized so callers can branch on the kind of failure instead of
    // string-matching a message. `offline` is what tells the UI to show the
    // network state rather than a generic error.
    const offline = typeof navigator !== 'undefined' && !navigator.onLine;
    const normalized = error.response?.data || {
      message: offline
        ? 'Sei offline. Controlla la connessione e riprova.'
        : 'Non riusciamo a raggiungere il server. Riprova tra poco.'
    };

    return Promise.reject({
      ...normalized,
      status: error.response?.status ?? 0,
      offline,
      isNetworkError: !error.response
    });
  }
);

export default api;
