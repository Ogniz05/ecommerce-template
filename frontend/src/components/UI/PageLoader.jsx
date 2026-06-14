import React from 'react';
import { motion } from 'framer-motion';

export default function PageLoader({ fullscreen = true }) {
  return (
    <div className={`flex items-center justify-center ${fullscreen ? 'fixed inset-0 bg-white z-50' : 'py-20'}`}>
      <div className="flex flex-col items-center gap-4">
        <motion.div
          className="w-12 h-12 rounded-2xl bg-gradient-brand"
          animate={{ rotate: [0, 180, 360], scale: [1, 0.85, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.p
          className="font-heading font-medium text-text-secondary text-sm"
          animate={{ opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        >
          Caricamento...
        </motion.p>
      </div>
    </div>
  );
}
