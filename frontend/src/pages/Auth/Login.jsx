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

          {/* Google OAuth */}
          <motion.div variants={staggerItem} className="mb-6">
            <a
              href={`${import.meta.env.VITE_API_URL || '/api'}/auth/google`}
              className="flex items-center justify-center gap-3 w-full py-3 px-4 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all font-heading font-semibold text-dark text-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continua con Google
            </a>
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-text-secondary text-xs font-body">oppure</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
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
