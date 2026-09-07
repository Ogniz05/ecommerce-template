import React from 'react';
import { FiAlertCircle, FiRefreshCw, FiWifiOff } from 'react-icons/fi';

/**
 * A failed fetch, shown in place of the content it was meant to become.
 *
 * Distinct from EmptyState on purpose: "no orders yet" is a normal state a
 * customer can act on, while "we could not load your orders" is a fault that
 * needs a retry, not a call to action. Rendering both the same way taught
 * people to read real failures as normal.
 *
 * Being offline gets its own wording — telling someone to "try again" when
 * their connection is down sends them in a loop.
 */
export default function ErrorState({
  title,
  description,
  onRetry,
  retrying = false,
  offline = false,
  compact = false,
  className = ''
}) {
  const Icon = offline ? FiWifiOff : FiAlertCircle;

  const resolvedTitle = title || (offline ? 'Sei offline' : 'Qualcosa è andato storto');
  const resolvedDescription = description || (offline
    ? 'Controlla la connessione: riproveremo appena torna online.'
    : 'Non siamo riusciti a caricare questi dati. Riprova tra un istante.');

  return (
    <div
      // Announced when it replaces content mid-flow, so someone using a screen
      // reader hears the failure instead of silence where the list should be.
      role="alert"
      className={`flex flex-col items-center justify-center text-center border border-line rounded-md bg-surface
        ${compact ? 'py-10 px-5' : 'py-16 px-6'} ${className}`}
    >
      <div
        aria-hidden="true"
        className={`flex items-center justify-center rounded-md bg-sunken text-muted mb-4
          ${compact ? 'w-11 h-11' : 'w-14 h-14'}`}
      >
        <Icon size={compact ? 20 : 24} />
      </div>

      <h3 className={`font-heading font-semibold text-ink ${compact ? 'text-base' : 'text-lg'}`}>
        {resolvedTitle}
      </h3>
      <p className="text-muted text-sm mt-1.5 max-w-sm text-balance">{resolvedDescription}</p>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={retrying}
          className="btn btn-outline btn-sm mt-6 px-5 inline-flex items-center gap-2 disabled:opacity-60"
        >
          <FiRefreshCw size={14} className={retrying ? 'animate-spin' : ''} aria-hidden="true" />
          {retrying ? 'Riprovo…' : 'Riprova'}
        </button>
      )}
    </div>
  );
}
