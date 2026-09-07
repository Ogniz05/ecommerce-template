import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiSliders } from 'react-icons/fi';
import {
  CATEGORIES, acceptAll, rejectAll, setConsent, getConsent, hasDecided, onConsentChange
} from '../../utils/consent';

/**
 * The consent banner the privacy policy already promised.
 *
 * "Rifiuta" is a real button of the same weight as "Accetta", not a link
 * hidden under a settings panel — refusing has to be as easy as accepting, and
 * a banner that buries the refusal is not consent, it is a dark pattern.
 * Nothing is pre-ticked either: the optional toggles start off.
 *
 * It is a dialog, not a decoration: focus moves into it and Escape refuses,
 * so it can be dealt with from the keyboard.
 */
export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [choices, setChoices] = useState({ necessary: true, analytics: false, marketing: false });

  useEffect(() => {
    // Deferred a beat so it does not fight the first paint for attention.
    const timer = setTimeout(() => setVisible(!hasDecided()), 900);
    // Withdrawing consent elsewhere (the privacy page link) brings it back.
    const off = onConsentChange((c) => {
      if (c === null) {
        setChoices({ necessary: true, analytics: false, marketing: false });
        setDetailsOpen(false);
        setVisible(true);
      }
    });
    return () => { clearTimeout(timer); off(); };
  }, []);

  useEffect(() => {
    if (!visible) return;
    const onKey = (e) => {
      // Escape means "no". Dismissing without a decision would leave the
      // visitor tracked-by-default, which is the thing consent exists to stop.
      if (e.key === 'Escape') { rejectAll(); setVisible(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  const decide = (fn) => { fn(); setVisible(false); };
  const saveSelection = () => decide(() => setConsent(choices));

  const optional = Object.values(CATEGORIES).filter(c => !c.required);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-consent-title"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          className="fixed bottom-0 inset-x-0 z-[70] p-3 sm:p-4"
        >
          <div className="max-w-3xl mx-auto bg-surface border border-line rounded-md shadow-[0_16px_40px_rgba(23,23,27,0.12)] p-5 sm:p-6">
            <h2 id="cookie-consent-title" className="font-heading font-semibold text-ink text-base">
              Cookie e privacy
            </h2>
            <p className="text-muted text-sm mt-1.5 text-balance">
              Usiamo cookie necessari al funzionamento del sito. Solo con il tuo consenso
              usiamo anche statistiche e marketing. Puoi cambiare idea quando vuoi dalla{' '}
              <Link to="/privacy" className="text-ink underline underline-offset-2 hover:text-brand transition-colors">
                Privacy Policy
              </Link>.
            </p>

            {detailsOpen && (
              <div className="mt-5 space-y-3 border-t border-line pt-4">
                <label className="flex items-start gap-3 opacity-60 cursor-not-allowed">
                  <input
                    type="checkbox"
                    checked
                    disabled
                    readOnly
                    className="mt-0.5 accent-[color:var(--brand)]"
                  />
                  <span>
                    <span className="block text-ink text-sm font-medium">{CATEGORIES.necessary.label}</span>
                    <span className="block text-muted text-xs mt-0.5">{CATEGORIES.necessary.description}</span>
                  </span>
                </label>

                {optional.map(cat => (
                  <label key={cat.id} className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={choices[cat.id]}
                      onChange={e => setChoices(c => ({ ...c, [cat.id]: e.target.checked }))}
                      className="mt-0.5 accent-[color:var(--brand)]"
                    />
                    <span>
                      <span className="block text-ink text-sm font-medium">{cat.label}</span>
                      <span className="block text-muted text-xs mt-0.5">{cat.description}</span>
                    </span>
                  </label>
                ))}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 mt-5">
              {/* Accept and reject sit side by side, same size, same weight. */}
              <button
                onClick={() => decide(acceptAll)}
                className="btn btn-primary btn-sm px-5 flex-1 sm:flex-none"
                autoFocus
              >
                Accetta tutti
              </button>
              <button
                onClick={() => decide(rejectAll)}
                className="btn btn-outline btn-sm px-5 flex-1 sm:flex-none"
              >
                Rifiuta
              </button>

              {detailsOpen ? (
                <button onClick={saveSelection} className="btn btn-ghost btn-sm px-5 sm:ml-auto">
                  Salva scelta
                </button>
              ) : (
                <button
                  onClick={() => setDetailsOpen(true)}
                  className="btn btn-ghost btn-sm px-5 sm:ml-auto inline-flex items-center gap-2"
                >
                  <FiSliders size={14} aria-hidden="true" /> Personalizza
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
