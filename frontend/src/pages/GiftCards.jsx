import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiGift, FiMail, FiCheck, FiCopy, FiArrowRight } from 'react-icons/fi';
import api from '../utils/api';
import { formatPrice } from '../utils/formatters';
import toast from 'react-hot-toast';

const AMOUNTS = [10, 25, 50, 100, 150];

export default function GiftCards() {
  const [amount, setAmount] = useState(50);
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const purchase = async () => {
    setLoading(true);
    try {
      const d = await api.post('/gift-cards/purchase', {
        amount,
        recipient_email: recipient.trim() || null,
        message: message.trim() || null,
      });
      setResult({ code: d.code, amount: d.amount });
      toast.success('Gift card creata!');
    } catch (err) {
      toast.error(err.message || 'Errore creazione gift card');
    } finally { setLoading(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(result.code);
    toast.success('Codice copiato!');
  };

  return (
    <div className="page-wrapper bg-surface-2 min-h-screen">
      <div className="container-app py-12 max-w-4xl">

        <motion.div className="text-center mb-10" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-brand to-purple-600 flex items-center justify-center mx-auto mb-4">
            <FiGift size={28} className="text-white" />
          </div>
          <h1 className="font-display font-bold text-4xl text-dark">Gift Card</h1>
          <p className="text-text-secondary mt-2 font-body">Il regalo perfetto. Scegli l'importo, noi pensiamo al resto.</p>
        </motion.div>

        <AnimatePresence mode="wait">
          {result ? (
            <motion.div
              key="result"
              className="max-w-md mx-auto"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
            >
              <div className="rounded-3xl p-8 text-white text-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #2C2E39, #4a4d5e)' }}>
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-brand/20" />
                <div className="relative">
                  <FiCheck size={40} className="mx-auto mb-3 text-green-400" />
                  <p className="text-white/60 text-sm">Gift card da</p>
                  <p className="font-display font-bold text-5xl my-2">{formatPrice(result.amount)}</p>
                  <p className="text-white/60 text-sm mt-4 mb-1">Codice</p>
                  <button
                    onClick={copyCode}
                    className="font-mono text-xl tracking-widest font-bold bg-white/10 hover:bg-white/20 rounded-xl px-5 py-3 inline-flex items-center gap-2 transition-colors"
                  >
                    {result.code} <FiCopy size={16} />
                  </button>
                </div>
              </div>
              <p className="text-text-secondary text-sm text-center mt-5">
                {recipient ? `Inviata via email a ${recipient}.` : 'Conserva questo codice — usalo al checkout.'}
              </p>
              <button
                onClick={() => { setResult(null); setRecipient(''); setMessage(''); }}
                className="btn btn-outline w-full mt-4 py-3"
              >
                Acquista un'altra gift card
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              className="grid md:grid-cols-2 gap-8 items-start"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            >
              {/* Preview card */}
              <div className="rounded-3xl p-8 text-white relative overflow-hidden md:sticky md:top-24" style={{ background: 'linear-gradient(135deg, #D8125B, #7c3aed)' }}>
                <div className="absolute -bottom-10 -right-8 w-44 h-44 rounded-full bg-white/10" />
                <div className="relative">
                  <FiGift size={32} className="mb-6" />
                  <p className="text-white/70 text-sm">Valore</p>
                  <motion.p key={amount} initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="font-display font-bold text-5xl">
                    {formatPrice(amount)}
                  </motion.p>
                  {message && <p className="text-white/80 text-sm mt-6 italic line-clamp-3">"{message}"</p>}
                  <p className="text-white/50 text-xs mt-8 font-mono tracking-widest">GIFT-XXXX-XXXX-XXXX</p>
                </div>
              </div>

              {/* Form */}
              <div className="space-y-6">
                <div>
                  <label className="label mb-3 block">Scegli l'importo</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {AMOUNTS.map(a => (
                      <motion.button
                        key={a}
                        onClick={() => setAmount(a)}
                        className={`py-3 rounded-xl border-2 font-heading font-bold transition-all ${
                          amount === a ? 'border-brand bg-brand/5 text-brand' : 'border-gray-200 text-dark hover:border-brand/40'
                        }`}
                        whileTap={{ scale: 0.96 }}
                      >
                        {formatPrice(a)}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="label">Email destinatario <span className="text-text-secondary font-normal">(opzionale)</span></label>
                  <div className="relative">
                    <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input
                      type="email"
                      value={recipient}
                      onChange={e => setRecipient(e.target.value)}
                      placeholder="amico@example.com"
                      className="input pl-10"
                    />
                  </div>
                  <p className="text-text-secondary text-xs mt-1.5">Se vuoto, riceverai tu il codice.</p>
                </div>

                <div>
                  <label className="label">Messaggio <span className="text-text-secondary font-normal">(opzionale)</span></label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value.slice(0, 200))}
                    placeholder="Buon compleanno!"
                    rows={3}
                    className="input resize-none"
                  />
                  <p className="text-text-secondary text-xs mt-1.5 text-right">{message.length}/200</p>
                </div>

                <motion.button
                  onClick={purchase}
                  disabled={loading}
                  className="btn btn-primary w-full py-4 flex items-center justify-center gap-2 font-heading font-semibold"
                  whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                >
                  {loading
                    ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    : <>Acquista Gift Card {formatPrice(amount)} <FiArrowRight size={16} /></>
                  }
                </motion.button>
                <p className="text-text-secondary text-xs text-center">Valida 1 anno dall'acquisto. Utilizzabile al checkout.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
