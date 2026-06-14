import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../../utils/api';

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    api.get(`/auth/verify-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center">
      <motion.div className="card p-10 text-center max-w-md" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
        {status === 'loading' && <span className="w-10 h-10 border-4 border-brand/20 border-t-brand rounded-full animate-spin mx-auto block" />}
        {status === 'success' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
              <FiCheckCircle size={28} className="text-green-500" />
            </div>
            <h2 className="font-display font-bold text-2xl text-dark mb-2">Email Verificata!</h2>
            <p className="text-text-secondary text-sm">Il tuo account è stato attivato con successo.</p>
            <Link to="/auth/login"><button className="btn btn-primary w-full mt-6">Accedi</button></Link>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4">
              <FiXCircle size={28} className="text-red-500" />
            </div>
            <h2 className="font-display font-bold text-2xl text-dark mb-2">Token Non Valido</h2>
            <p className="text-text-secondary text-sm">Il link di verifica non è valido o è scaduto.</p>
            <Link to="/auth/register"><button className="btn btn-outline w-full mt-6">Registrati di Nuovo</button></Link>
          </>
        )}
      </motion.div>
    </div>
  );
}
