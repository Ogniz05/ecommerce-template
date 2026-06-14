import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiEye, FiEyeOff, FiMail, FiLock, FiArrowRight } from 'react-icons/fi';
import { useAuthStore } from '../../store/useStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { fadeInUp, staggerContainer, staggerItem } from '../../utils/animations';

export default function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.email || !form.email.includes('@')) e.email = 'Email non valida';
    if (!form.password) e.password = 'Password obbligatoria';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api.post('/auth/login', form);
      login(data.user, data.token);
      toast.success(t('auth.loginSuccess'));
      navigate(['admin', 'moderator'].includes(data.user?.role) ? '/admin' : '/');
    } catch (err) {
      toast.error(err.message || 'Credenziali non valide');
    } finally { setLoading(false); }
  };

  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center py-16 relative overflow-hidden bg-surface-2">
      {/* Decorative aurora blobs */}
      <motion.div
        className="absolute w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.12) 0%, transparent 65%)', top: '-10%', right: '-5%' }}
        animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(120,60,220,0.10) 0%, transparent 65%)', bottom: '-15%', left: '-8%' }}
        animate={{ x: [0, 50, 0], y: [0, -35, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="w-full max-w-md px-4 relative z-10">
        <motion.div
          className="card p-8 md:p-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {/* Header */}
          <motion.div variants={staggerItem} className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
              <FiLock size={22} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-dark">{t('auth.login')}</h1>
            <p className="text-text-secondary text-sm mt-2">
              {t('auth.noAccount')}{' '}
              <Link to="/auth/register" className="text-brand font-medium hover:underline">{t('auth.register')}</Link>
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div variants={staggerItem}>
              <label className="label">{t('auth.email')}</label>
              <div className="relative">
                <FiMail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`input pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="error-message">{errors.email}</p>}
            </motion.div>

            <motion.div variants={staggerItem}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="label mb-0">{t('auth.password')}</label>
                <Link to="/auth/forgot-password" className="text-brand text-xs font-medium hover:underline">
                  {t('auth.forgotPassword')}
                </Link>
              </div>
              <div className="relative">
                <FiLock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input pl-10 pr-11 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-dark transition-colors"
                >
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
              {errors.password && <p className="error-message">{errors.password}</p>}
            </motion.div>

            <motion.div variants={staggerItem}>
              <motion.button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-base py-3.5 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>{t('auth.login')} <FiArrowRight size={17} /></>
                )}
              </motion.button>
            </motion.div>
          </form>

          <motion.div variants={staggerItem} className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-text-secondary text-xs">
              {t('auth.terms')}{' '}
              <Link to="/privacy" className="text-brand hover:underline">{t('auth.privacyPolicy')}</Link>
              {' '}{t('auth.and')}{' '}
              <Link to="/termini" className="text-brand hover:underline">{t('auth.termsConditions')}</Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
