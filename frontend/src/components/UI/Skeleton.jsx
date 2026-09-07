import React from 'react';

/**
 * Loading placeholders.
 *
 * The `.skeleton` class (index.css) already carries the shimmer; these are the
 * shapes. Pages were hand-rolling `animate-pulse` divs at whatever size felt
 * right, so the placeholder rarely matched the content that replaced it and
 * the page jumped on load.
 *
 * A skeleton is only worth showing when it is the same shape as what follows.
 * For anything shorter than a moment, a spinner-free blank beats a flash of
 * grey blocks.
 */

export function Skeleton({ className = '', rounded = 'rounded-sm' }) {
  return <div aria-hidden="true" className={`skeleton ${rounded} ${className}`} />;
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

/** Mirrors ProductCard: square image, then title, then price. */
export function SkeletonProductCard() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/5] w-full" rounded="rounded-md" />
      <Skeleton className="h-4 w-3/4 mt-3" />
      <Skeleton className="h-4 w-1/3 mt-2" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 8, className = '' }) {
  return (
    // One live region for the whole grid: announcing each of eight placeholders
    // separately would be noise.
    <div
      role="status"
      aria-live="polite"
      aria-label="Caricamento prodotti"
      className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-5 gap-y-9 ${className}`}
    >
      {Array.from({ length: count }).map((_, i) => <SkeletonProductCard key={i} />)}
    </div>
  );
}

/** Table rows, for the admin panels. */
export function SkeletonRows({ rows = 6, cols = 4, className = '' }) {
  return (
    <div role="status" aria-live="polite" aria-label="Caricamento" className={className}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="flex items-center gap-4 py-3.5 border-b border-line last:border-0">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={`h-3.5 ${c === 0 ? 'w-1/3' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
