import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="page-wrapper min-h-screen flex items-center justify-center overflow-hidden relative">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand/10 blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-dark/5 blur-3xl" />

      <div className="relative text-center px-4 max-w-lg">
        {/* Big 404 */}
        <motion.div
          className="relative mb-8"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <span className="font-display font-bold text-[160px] md:text-[200px] leading-none text-gradient-brand select-none">
            404
          </span>
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-brand/10 blur-2xl"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="font-display font-bold text-3xl text-dark mb-3">Pagina Non Trovata</h1>
          <p className="text-text-secondary leading-relaxed mb-8">
            La pagina che stai cercando non esiste o è stata spostata.<br />
            Torna alla home o esplora il nostro catalogo.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <motion.button
              onClick={() => navigate(-1)}
              className="btn btn-ghost px-8 py-3"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              ← Torna Indietro
            </motion.button>
            <Link to="/">
              <motion.button
                className="btn btn-primary px-8 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Home
              </motion.button>
            </Link>
            <Link to="/catalogo">
              <motion.button
                className="btn btn-outline px-8 py-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Catalogo
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
