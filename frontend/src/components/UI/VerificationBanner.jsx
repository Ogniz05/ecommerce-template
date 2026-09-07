import React, { useState } from 'react';
import { FiMail, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/useStore';
import api from '../../utils/api';

/**
 * Reminds a signed-in customer that their email is still unverified.
 *
 * Registration sent a verification link and then never mentioned it again: an
 * unverified account looked identical to a verified one, so nobody had a
 * reason to act, and order and shipping mail went to an address we had never
 * confirmed could receive it.
 *
 * Verification is not enforced as a hard gate — blocking checkout on it loses
 * real sales for a template shop — so this is a standing nudge with the one
 * action that resolves it.
 */
export default function VerificationBanner() {
  const { user, updateUser } = useAuthStore();
  const [sending, setSending] = useState(false);
  // Dismissal lives for the session only. Reappearing next visit is the point;
  // persisting it would let the reminder be silenced forever in one click.
  const [dismissed, setDismissed] = useState(
    () => sessionStorage.getItem('verify-banner-dismissed') === '1'
  );

  if (!user || user.is_verified || dismissed) return null;

  const resend = async () => {
    setSending(true);
    try {
      const res = await api.post('/auth/resend-verification');
      if (res.alreadyVerified) {
        updateUser({ is_verified: 1 });
        toast.success('Email già verificata');
      } else {
        toast.success('Email inviata. Controlla la posta.');
      }
    } catch (err) {
      toast.error(err.message || 'Invio non riuscito');
    } finally {
      setSending(false);
    }
  };

  const dismiss = () => {
    sessionStorage.setItem('verify-banner-dismissed', '1');
    setDismissed(true);
  };

  return (
    <div
      role="status"
      className="bg-brand-50 border-b border-brand-100 px-4 py-2.5"
    >
      <div className="container-app flex items-center gap-3 flex-wrap">
        <FiMail size={15} className="text-brand shrink-0" aria-hidden="true" />
        <p className="text-ink text-sm flex-1 min-w-[12rem]">
          Verifica il tuo indirizzo email per ricevere conferme d&apos;ordine e aggiornamenti di spedizione.
        </p>
        <button
          onClick={resend}
          disabled={sending}
          className="btn btn-primary btn-sm px-4 disabled:opacity-60"
        >
          {sending ? 'Invio…' : 'Invia di nuovo'}
        </button>
        <button
          onClick={dismiss}
          aria-label="Nascondi avviso di verifica"
          className="text-muted hover:text-ink transition-colors p-1"
        >
          <FiX size={16} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
