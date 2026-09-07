import React from 'react';
import { Link } from 'react-router-dom';

/**
 * The one empty state.
 *
 * Every list in the app had grown its own — different padding, different type
 * scale, some with a border and some without — so "no results" looked like a
 * different product depending on which page you were on.
 *
 * An empty state earns its place by saying three things: what is not here, why,
 * and the one action that changes it. `action` is that one action; a second
 * competing button would make neither read as primary.
 */
// The app has two surfaces — the light storefront and the dark profile/admin
// panels — so a component that only reads correctly on one of them is not
// actually shared. `tone` picks the palette; the structure stays identical.
const TONES = {
  light: {
    frame: 'border-line bg-surface',
    badge: 'bg-sunken text-faint',
    title: 'text-ink',
    body: 'text-muted',
    secondary: 'text-muted hover:text-ink'
  },
  dark: {
    frame: 'border-white/10 bg-white/[0.03]',
    badge: 'bg-white/5 text-white/25',
    title: 'text-white',
    body: 'text-white/45',
    secondary: 'text-white/45 hover:text-white'
  }
};

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionTo,
  onAction,
  secondaryAction,
  onSecondaryAction,
  tone = 'light',
  compact = false,
  bare = false,
  className = ''
}) {
  const c = TONES[tone] || TONES.light;
  const ActionButton = actionTo ? Link : 'button';
  const actionProps = actionTo ? { to: actionTo } : { type: 'button', onClick: onAction };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center rounded-md
        ${bare ? '' : `border ${c.frame}`}
        ${compact ? 'py-10 px-5' : 'py-16 px-6'} ${className}`}
    >
      {Icon && (
        // Decorative: the heading already carries the meaning, so a screen
        // reader announcing the icon would only repeat it.
        <div
          aria-hidden="true"
          className={`flex items-center justify-center rounded-md mb-4 ${c.badge}
            ${compact ? 'w-11 h-11' : 'w-14 h-14'}`}
        >
          <Icon size={compact ? 20 : 24} />
        </div>
      )}

      <h3 className={`font-heading font-semibold ${c.title} ${compact ? 'text-base' : 'text-lg'}`}>
        {title}
      </h3>

      {description && (
        <p className={`${c.body} text-sm mt-1.5 max-w-sm text-balance`}>{description}</p>
      )}

      {action && (
        <ActionButton {...actionProps} className="btn btn-primary btn-sm mt-6 px-5">
          {action}
        </ActionButton>
      )}

      {secondaryAction && (
        <button
          type="button"
          onClick={onSecondaryAction}
          className={`${c.secondary} text-sm mt-3 underline underline-offset-4 transition-colors`}
        >
          {secondaryAction}
        </button>
      )}
    </div>
  );
}
