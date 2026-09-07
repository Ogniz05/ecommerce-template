import { useEffect, useRef } from 'react';

const FOCUSABLE = [
  'a[href]', 'button:not([disabled])', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

/**
 * Keeps keyboard focus inside an open overlay, and gives it back on close.
 *
 * The cart drawer and the confirmation dialogs render on top of the page but
 * left focus behind them: tabbing walked through the catalogue underneath
 * while the overlay covered it, Escape did nothing, and closing dropped focus
 * to the top of the document instead of the control that opened it. For a
 * keyboard or screen reader user the drawer was effectively unusable.
 *
 * Returns a ref to put on the overlay container.
 */
export function useFocusTrap(active, onEscape) {
  const containerRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    if (!active) return;

    previouslyFocused.current = document.activeElement;
    const container = containerRef.current;
    if (!container) return;

    // Focus the first real control, falling back to the container itself so
    // the announcement starts inside the overlay either way.
    const focusables = () => Array.from(container.querySelectorAll(FOCUSABLE))
      .filter(el => el.offsetParent !== null || el === document.activeElement);

    const first = focusables()[0];
    (first || container).focus?.();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onEscape?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }

      const firstEl = items[0];
      const lastEl = items[items.length - 1];

      // Wrap at both ends so Tab and Shift+Tab cycle within the overlay.
      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    // The page behind must not scroll while an overlay is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = prevOverflow;
      // Returning focus is what makes the overlay feel like a detour rather
      // than a dead end.
      previouslyFocused.current?.focus?.();
    };
  }, [active, onEscape]);

  return containerRef;
}

export default useFocusTrap;
