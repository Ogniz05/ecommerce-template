import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiAward, FiHeart, FiRotateCcw, FiBell, FiX, FiArrowRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useStore';
import useFocusTrap from '../../hooks/useFocusTrap';
import api from '../../utils/api';

/**
 * What a new account gets, shown once, right after registering.
 *
 * There was no onboarding of any kind: registering dropped you back on the
 * home page identical to a logged-out visitor, so loyalty points, the wishlist
 * and free returns — all built and all invisible — went unused because nothing
 * ever mentioned them.
 *
 * Deliberately short. Three panels, skippable from the first, and it asks for
 * exactly one decision (which mail to receive) rather than interviewing
 * someone who came here to buy something. The preference step writes to the
 * same endpoint as the profile panel, so it is a real setting and not a
 * welcome-flow prop.
 */

const FEATURES = [
  {
    icon: FiAward,
    title: 'Punti su ogni acquisto',
    body: 'Accumuli punti a ogni ordine pagato e li scali sui successivi. Nessuna tessera, nessuna scadenza da ricordare.'
  },
  {
    icon: FiHeart,
    title: 'Wishlist e avvisi di riassortimento',
    body: 'Salva quello che ti piace. Se un prodotto esaurito torna disponibile, ti avvisiamo.'
  },
  {
    icon: FiRotateCcw,
    title: 'Resi tracciati dal tuo profilo',
    body: 'Apri una richiesta di reso dall’ordine, senza scrivere a nessuno, e ne segui lo stato.'
  }
];

const STORAGE_KEY = 'onboarding-seen';

export function shouldShowOnboarding() {
  try {
    return localStorage.getItem(STORAGE_KEY) !== '1';
  } catch {
    // Storage unavailable: skip rather than show it on every page load.
    return false;
  }
}

export function markOnboardingSeen() {
  try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* nothing to record */ }
}

/**
 * Clears the "already seen" flag so the flow runs for a newly registered
 * account. The flag is per-browser, so a second person signing up on a shared
 * machine would otherwise never see it.
 */
export function resetOnboarding() {
  try { localStorage.removeItem(STORAGE_KEY); } catch { /* nothing to clear */ }
}

export default function Onboarding({ open, onClose }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [step, setStep] = useState(0);
  const [prefs, setPrefs] = useState({ promotions: false, newsletter: false });
  const [saving, setSaving] = useState(false);

  const finish = async (savePrefs) => {
    if (savePrefs) {
      setSaving(true);
      try {
        await api.put('/users/notification-preferences', { preferences: prefs });
      } catch {
        // A failed preference save must not trap someone in the welcome flow.
        toast.error('Preferenze non salvate: puoi impostarle dal profilo.');
      } finally {
        setSaving(false);
      }
    }
    markOnboardingSeen();
    onClose?.();
  };

  const containerRef = useFocusTrap(open, () => finish(false));

  const isLast = step === FEATURES.length;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[75] bg-ink/70 flex items-end sm:items-center justify-center p-0 sm:p-4"
        >
          <motion.div
            ref={containerRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            tabIndex={-1}
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
            className="w-full sm:max-w-md bg-surface rounded-t-md sm:rounded-md border border-line p-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <p className="eyebrow text-muted">
                {isLast ? 'Ultimo passo' : `${step + 1} di ${FEATURES.length + 1}`}
              </p>
              {/* Skippable from the very first panel: someone who wants to shop
                  should never have to read three screens to get there. */}
              <button
                onClick={() => finish(false)}
                aria-label="Chiudi introduzione"
                className="text-muted hover:text-ink transition-colors -mt-1 -mr-1 p-1"
              >
                <FiX size={18} aria-hidden="true" />
              </button>
            </div>

            {!isLast ? (
              <motion.div key={step} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                <div aria-hidden="true" className="w-12 h-12 rounded-md bg-brand-50 text-brand flex items-center justify-center mb-4">
                  {React.createElement(FEATURES[step].icon, { size: 22 })}
                </div>
                <h2 id="onboarding-title" className="font-heading font-semibold text-ink text-xl">
                  {step === 0 ? `Benvenuto, ${user?.first_name || ''}`.trim() : FEATURES[step].title}
                </h2>
                {step === 0 && (
                  <p className="font-heading font-semibold text-ink mt-2">{FEATURES[0].title}</p>
                )}
                <p className="text-muted text-sm mt-2 leading-relaxed">{FEATURES[step].body}</p>
              </motion.div>
            ) : (
              <motion.div key="prefs" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}>
                <div aria-hidden="true" className="w-12 h-12 rounded-md bg-brand-50 text-brand flex items-center justify-center mb-4">
                  <FiBell size={22} />
                </div>
                <h2 id="onboarding-title" className="font-heading font-semibold text-ink text-xl">
                  Cosa vuoi ricevere?
                </h2>
                <p className="text-muted text-sm mt-2 leading-relaxed">
                  Gli aggiornamenti sui tuoi ordini arrivano sempre. Il resto lo decidi tu,
                  e puoi cambiarlo dal profilo quando vuoi.
                </p>

                <div className="space-y-2.5 mt-5">
                  {[
                    { id: 'promotions', label: 'Offerte e promozioni', desc: 'Saldi e codici sconto' },
                    { id: 'newsletter', label: 'Newsletter', desc: 'Novità e guide, una volta al mese' }
                  ].map(opt => (
                    <label key={opt.id} className="flex items-start gap-3 p-3 border border-line rounded-md cursor-pointer hover:border-line-strong transition-colors">
                      <input
                        type="checkbox"
                        checked={prefs[opt.id]}
                        onChange={e => setPrefs(p => ({ ...p, [opt.id]: e.target.checked }))}
                        className="mt-0.5 accent-[color:var(--brand)]"
                      />
                      <span>
                        <span className="block text-ink text-sm font-medium">{opt.label}</span>
                        <span className="block text-muted text-xs mt-0.5">{opt.desc}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            )}

            <div className="flex items-center gap-2.5 mt-7">
              {!isLast ? (
                <>
                  <button onClick={() => setStep(s => s + 1)} className="btn btn-primary btn-sm px-5 flex-1 inline-flex items-center justify-center gap-2">
                    Avanti <FiArrowRight size={14} aria-hidden="true" />
                  </button>
                  <button onClick={() => finish(false)} className="btn btn-ghost btn-sm px-4">
                    Salta
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={async () => { await finish(true); navigate('/catalogo'); }}
                    disabled={saving}
                    className="btn btn-primary btn-sm px-5 flex-1 disabled:opacity-60"
                  >
                    {saving ? 'Salvo…' : 'Inizia a esplorare'}
                  </button>
                  <button onClick={() => finish(false)} className="btn btn-ghost btn-sm px-4">
                    Più tardi
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
