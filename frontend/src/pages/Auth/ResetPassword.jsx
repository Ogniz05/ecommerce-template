import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiLock, FiEye, FiEyeOff, FiCheckCircle } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error('Minimo 8 caratteri');
    if (password !== confirm) return toast.error('Le password non coincidono');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setDone(true);
    } catch (err) {
      toast.error(err.message || 'Token non valido o scaduto');
    } finally { setLoading(false); }
  };

  if (!token) return (
    <div className="page-wrapper min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-text-secondary">Token mancante. <Link to="/auth/forgot-password" className="text-brand">Richiedi nuovo link</Link></p>
      </div>
    </div>
  );

  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center py-16">
      <div className="w-full max-w-md px-4">
        <motion.div className="card p-8" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {done ? (
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                <FiCheckCircle size={28} className="text-green-500" />
              </div>
              <h2 className="font-display font-bold text-2xl text-dark">Password Aggiornata!</h2>
              <p className="text-text-secondary text-sm mt-2">Ora puoi accedere con la nuova password.</p>
              <Link to="/auth/login"><button className="btn btn-primary w-full mt-6">Vai al Login</button></Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="w-14 h-14 rounded-2xl bg-gradient-brand flex items-center justify-center mx-auto mb-4">
                  <FiLock size={22} className="text-white" />
                </div>
                <h1 className="font-display font-bold text-3xl text-dark">Nuova Password</h1>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="label">Nuova Password</label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input pl-10 pr-11" placeholder="••••••••" />
                    <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-secondary">
                      {showPwd ? <FiEyeOff size={15} /> : <FiEye size={15} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="label">Conferma Password</label>
                  <div className="relative">
                    <FiLock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-secondary" />
                    <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className={`input pl-10 ${confirm && confirm !== password ? 'input-error' : ''}`} placeholder="••••••••" />
                  </div>
                  {confirm && confirm !== password && <p className="error-message">Le password non coincidono</p>}
                </div>
                <motion.button type="submit" disabled={loading} className="btn btn-primary w-full py-3.5" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  {loading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto block" /> : 'Aggiorna Password'}
                </motion.button>
              </form>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
