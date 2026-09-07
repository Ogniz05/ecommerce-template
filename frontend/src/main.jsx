import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import ErrorBoundary from './components/UI/ErrorBoundary';
import { initMonitoring } from './utils/monitoring';
import './index.css';
import './i18n/i18n';

// Before render, so a crash during the first paint is still reported.
// No-ops unless VITE_SENTRY_DSN is configured.
initMonitoring();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* Outside the router: a throw from the router itself, or from a lazy
        chunk that fails to load, has to land somewhere too. */}
    <ErrorBoundary name="root">
      <HelmetProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
