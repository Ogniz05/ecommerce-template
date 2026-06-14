import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiEye, FiEyeOff, FiMail, FiLock, FiUser, FiPhone, FiArrowRight } from 'react-icons/fi';
import { useAuthStore } from '../../store/useStore';
import api from '../../utils/api';
import toast from 'react-hot-toast';
import { staggerContainer, staggerItem } from '../../utils/animations';
import Checkbox from '../../components/UI/Checkbox';

// Module-level component: defining it inside Register would recreate it on
// every keystroke, remounting the input and dropping focus.
function Field({ name, label, type = 'text', icon, placeholder, autoComplete, form, errors, onFieldChange }) {
  return (
    <motion.div variants={staggerItem}>
      <label className="label">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary">{icon}</div>}
        <input
          type={type}
          value={form[name]}
          onChange={e => onFieldChange(name, e.target.value)}
          className={`input ${icon ? 'pl-10' : ''} ${errors[name] ? 'input-error' : ''}`}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
      {errors[name] && <p className="error-message">{errors[name]}</p>}
    </motion.div>
  );
}

const getPasswordStrength = (pwd) => {
  if (!pwd) return { level: 0, label: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 1, label: 'Debole', color: 'bg-red-400' };
  if (score <= 2) return { level: 2, label: 'Discreta', color: 'bg-orange-400' };
  if (score <= 3) return { level: 3, label: 'Buona', color: 'bg-yellow-400' };
  return { level: 4, label: 'Forte', color: 'bg-green-500' };
};

export default function Register() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', phone: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const strength = getPasswordStrength(form.password);

  const validate = () => {
    const e = {};
    if (!form.first_name.trim()) e.first_name = 'Nome obbligatorio';
    if (!form.last_name.trim()) e.last_name = 'Cognome obbligatorio';
    if (!form.email || !form.email.includes('@')) e.email = 'Email non valida';
    if (form.password.length < 8) e.password = 'Minimo 8 caratteri';
    if (!acceptedTerms) e.terms = 'Devi accettare i termini per continuare';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const data = await api.post('/auth/register', form);
      login(data.user, data.token);
      toast.success(t('auth.registerSuccess'));
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Errore registrazione');
    } finally { setLoading(false); }
  };

  const onFieldChange = (name, value) => setForm(f => ({ ...f, [name]: value }));
  const fieldProps = { form, errors, onFieldChange };

  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center py-16 relative overflow-hidden bg-surface-2">
      {/* Decorative aurora blobs */}
      <motion.div
        className="absolute w-[480px] h-[480px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.12) 0%, transparent 65%)', top: '-10%', left: '-5%' }}
        animate={{ x: [0, 50, 0], y: [0, 40, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(120,60,220,0.10) 0%, transparent 65%)', bottom: '-15%', right: '-8%' }}
        animate={{ x: [0, -50, 0], y: [0, -35, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="w-full max-w-lg px-4 relative z-10">
        <motion.div
          className="card p-8 md:p-10"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={staggerItem} className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
              <FiUser size={22} className="text-white" />
            </div>
            <h1 className="font-display font-bold text-3xl text-dark">{t('auth.register')}</h1>
            <p className="text-text-secondary text-sm mt-2">
              {t('auth.hasAccount')}{' '}
              <Link to="/auth/login" className="text-brand font-medium hover:underline">{t('auth.login')}</Link>
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Field name="first_name" label={t('auth.firstName')} icon={<FiUser size={15} />} placeholder="Mario" autoComplete="given-name" {...fieldProps} />
              <Field name="last_name" label={t('auth.lastName')} placeholder="Rossi" autoComplete="family-name" {...fieldProps} />
            </div>
            <Field name="email" label={t('auth.email')} type="email" icon={<FiMail size={15} />} placeholder="mario@example.com" autoComplete="email" {...fieldProps} />
            <Field name="phone" label={t('auth.phone')} icon={<FiPhone size={15} />} placeholder="+39 02 1234567" autoComplete="tel" {...fieldProps} />

            <motion.div variants={staggerItem}>
              <label className="label">{t('auth.password')}</label>
              <div className="relative">
                <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input pl-10 pr-11 ${errors.password ? 'input-error' : ''}`}
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary hover:text-dark">
                  {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                </button>
              </div>
              {/* Strength indicator */}
              {form.password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(l => (
                      <div key={l} className={`h-1.5 flex-1 rounded-full transition-all ${l <= strength.level ? strength.color : 'bg-gray-200'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-text-secondary">{strength.label}</p>
                </div>
              )}
              {errors.password && <p className="error-message">{errors.password}</p>}
            </motion.div>

            <motion.div variants={staggerItem}>
              <Checkbox
                checked={acceptedTerms}
                onChange={setAcceptedTerms}
                error={errors.terms}
              >
                Accetto i{' '}
                <Link to="/termini" className="text-brand hover:underline font-medium">{t('auth.termsConditions')}</Link>
                {' '}e la{' '}
                <Link to="/privacy" className="text-brand hover:underline font-medium">{t('auth.privacyPolicy')}</Link>
              </Checkbox>
            </motion.div>

            <motion.div variants={staggerItem}>
              <motion.button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full text-base py-3.5 flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <>{t('auth.register')} <FiArrowRight size={17} /></>}
              </motion.button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
