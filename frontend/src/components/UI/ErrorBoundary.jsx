import React from 'react';
import { FiAlertTriangle, FiRefreshCw, FiHome } from 'react-icons/fi';
import { captureError } from '../../utils/monitoring';

/**
 * Last line of defence against a white screen.
 *
 * A render-time throw anywhere in the tree used to unmount the whole app and
 * leave an empty document — no message, no way back, and no report, so the
 * failure was invisible to us and total for the customer.
 *
 * Must be a class: `componentDidCatch` has no hook equivalent.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    captureError(error, {
      componentStack: info?.componentStack,
      boundary: this.props.name || 'root'
    });
  }

  handleReset = () => {
    // Clearing the error re-renders the same subtree. That is enough for a
    // transient fault; a reproducible one throws again and the customer still
    // has "reload" and "home" below.
    this.setState({ error: null });
    this.props.onReset?.();
  };

  handleReload = () => window.location.reload();

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) {
      return this.props.fallback({ error, reset: this.handleReset });
    }

    return (
      <div
        role="alert"
        className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 py-16"
      >
        <div
          aria-hidden="true"
          className="w-14 h-14 rounded-md bg-sunken text-muted flex items-center justify-center mb-5"
        >
          <FiAlertTriangle size={24} />
        </div>

        <h1 className="font-heading font-semibold text-ink text-xl">
          Qualcosa si è rotto
        </h1>
        <p className="text-muted text-sm mt-2 max-w-md text-balance">
          Questa pagina ha smesso di funzionare. L&apos;errore è stato registrato: puoi
          riprovare o tornare alla home.
        </p>

        {/* The stack is a development aid; in production it would only expose
            internals to the customer without helping them. */}
        {import.meta.env.DEV && (
          <pre className="mt-6 max-w-2xl w-full overflow-x-auto text-left text-xs bg-sunken border border-line rounded-md p-4 text-body">
            {error.message}
            {error.stack ? `\n\n${error.stack}` : ''}
          </pre>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3 mt-7">
          <button onClick={this.handleReset} className="btn btn-primary btn-sm px-5 inline-flex items-center gap-2">
            <FiRefreshCw size={14} aria-hidden="true" /> Riprova
          </button>
          <button onClick={this.handleReload} className="btn btn-outline btn-sm px-5">
            Ricarica la pagina
          </button>
          <a href="/" className="btn btn-ghost btn-sm px-5 inline-flex items-center gap-2">
            <FiHome size={14} aria-hidden="true" /> Home
          </a>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
