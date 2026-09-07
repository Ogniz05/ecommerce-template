import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMessageSquare, FiX, FiSend } from 'react-icons/fi';
import toast from 'react-hot-toast';
import useFocusTrap from '../../hooks/useFocusTrap';
import api from '../../utils/api';

/**
 * A way for beta testers to report what they found, from wherever they found it.
 *
 * The beta programme was a password prompt and nothing else: people were let
 * in, and then had no channel, so findings arrived as scattered messages or
 * were never written down at all. The value of testers is their reports.
 *
 * The current page and viewport go with the report automatically — the two
 * things a tester always forgets to mention and that are always needed to
 * reproduce anything.
 *
 * [CUSTOMIZE] Set VITE_BETA_FEEDBACK=on to show it. Off by default so a
 * production storefront does not carry a bug-report button.
 */

const KINDS = [
  { id: 'bug', label: 'Non funziona' },
  { id: 'confusing', label: 'Poco chiaro' },
  { id: 'idea', label: 'Idea' },
  { id: 'praise', label: 'Funziona bene' }
];

const ENABLED = import.meta.env.VITE_BETA_FEEDBACK === 'on';

export default function BetaFeedback() {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState('bug');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const panelRef = useFocusTrap(open, () => setOpen(false));

  if (!ENABLED) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (message.trim().length < 5) return toast.error('Scrivi qualche parola in più.');
    setSending(true);
    try {
      await api.post('/gate/feedback', {
        kind,
        message,
        pageUrl: window.location.pathname + window.location.search,
        viewport: `${window.innerWidth}x${window.innerHeight}`
      });
      toast.success('Grazie: la segnalazione è arrivata.');
      setMessage('');
      setOpen(false);
    } catch (err) {
      toast.error(err.message || 'Invio non riuscito');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Segnala un problema"
        // Bottom-left: the cart and toasts live bottom-right, and a report
        // button that covers the buy flow would be its own bug report.
        className="fixed bottom-4 left-4 z-[65] w-11 h-11 rounded-full bg-ink text-white shadow-[0_4px_14px_rgba(23,23,27,0.28)] flex items-center justify-center hover:bg-ink/90 transition-colors"
      >
        <FiMessageSquare size={18} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[76] bg-ink/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => !sending && setOpen(false)}
          >
            <motion.form
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="beta-feedback-title"
              tabIndex={-1}
              onSubmit={submit}
              onClick={e => e.stopPropagation()}
              initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 32, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
              className="w-full sm:max-w-md bg-surface border border-line rounded-t-md sm:rounded-md p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 id="beta-feedback-title" className="font-heading font-semibold text-ink">
                  Cosa hai trovato?
                </h2>
                <button type="button" onClick={() => setOpen(false)} aria-label="Chiudi" className="text-muted hover:text-ink p-1 -mt-1 -mr-1">
                  <FiX size={18} aria-hidden="true" />
                </button>
              </div>

              <div className="flex flex-wrap gap-2 mt-4" role="radiogroup" aria-label="Tipo di segnalazione">
                {KINDS.map(k => (
                  <button
                    key={k.id}
                    type="button"
                    role="radio"
                    aria-checked={kind === k.id}
                    onClick={() => setKind(k.id)}
                    className={`text-sm px-3 py-1.5 rounded-md border transition-colors
                      ${kind === k.id ? 'border-ink bg-ink text-white' : 'border-line text-body hover:border-line-strong'}`}
                  >
                    {k.label}
                  </button>
                ))}
              </div>

              <label htmlFor="beta-feedback-message" className="label mt-4 block">Descrizione</label>
              <textarea
                id="beta-feedback-message"
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={4}
                className="input resize-y"
                placeholder="Cosa stavi facendo e cosa è successo?"
              />

              <p className="text-muted text-xs mt-2">
                Alleghiamo automaticamente la pagina corrente e la dimensione dello schermo.
              </p>

              <button
                type="submit"
                disabled={sending}
                className="btn btn-primary btn-sm w-full mt-5 inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <FiSend size={14} aria-hidden="true" />
                {sending ? 'Invio…' : 'Invia segnalazione'}
              </button>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
