import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiMail, FiArrowLeft, FiCheckCircle } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { staggerContainer, staggerItem } from '../../utils/animations';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return toast.error('Email non valida');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
    } catch {
      toast.error('Errore. Riprova.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center py-16 relative overflow-hidden bg-surface-2">
      <motion.div
        className="absolute w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.12) 0%, transparent 65%)', top: '-10%', right: '-5%' }}
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div className="card p-8 md:p-10" variants={staggerContainer} initial="hidden" animate="visible">
          {sent ? (
            <motion.div className="text-center" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring' }}>
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle size={28} className="text-green-500" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark">Email Inviata!</h2>
              <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                Se l'account esiste, riceverai un'email con il link per reimpostare la password.
              </p>
              <Link to="/auth/login">
                <button className="btn btn-primary w-full mt-6">Torna al Login</button>
              </Link>
            </motion.div>
          ) : (
            <>
              <motion.div variants={staggerItem} className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                  <FiMail size={22} className="text-white" />
                </div>
                <h1 className="font-display font-bold text-3xl text-dark">{t('auth.forgotPassword')}</h1>
                <p className="text-text-secondary text-sm mt-2">Inserisci la tua email e ti invieremo un link per reimpostare la password.</p>
              </motion.div>
              <form onSubmit={handleSubmit} className="space-y-5">
                <motion.div variants={staggerItem}>
                  <label className="label">{t('auth.email')}</label>
                  <div className="relative">
                    <FiMail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input pl-10" placeholder="name@example.com" />
                  </div>
                </motion.div>
                <motion.div variants={staggerItem}>
                  <motion.button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5 flex items-center justify-center gap-2" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Invia Link Reset'}
                  </motion.button>
                </motion.div>
              </form>
              <motion.div variants={staggerItem} className="mt-5 text-center">
                <Link to="/auth/login" className="text-brand text-sm hover:underline flex items-center justify-center gap-1">
                  <FiArrowLeft size={14} /> Torna al Login
                </Link>
              </motion.div>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
