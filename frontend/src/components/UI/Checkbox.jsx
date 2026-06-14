import React, { useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

export default function Checkbox({ checked, onChange, children, error, className = '' }) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-start gap-3 cursor-pointer group select-none">
        <div className="relative mt-0.5 flex-shrink-0">
          <input
            id={id}
            type="checkbox"
            checked={checked}
            onChange={e => onChange(e.target.checked)}
            className="sr-only"
          />
          <motion.div
            animate={{
              backgroundColor: checked ? 'rgb(216, 18, 91)' : 'transparent',
              borderColor: error
                ? 'rgb(239, 68, 68)'
                : checked
                ? 'rgb(216, 18, 91)'
                : 'rgb(203, 213, 225)',
            }}
            transition={{ duration: 0.15 }}
            className="w-5 h-5 rounded-md border-2 flex items-center justify-center group-hover:border-brand transition-colors"
          >
            <AnimatePresence>
              {checked && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                >
                  <FiCheck size={12} className="text-white" strokeWidth={3} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
        <span className="text-sm text-text-secondary leading-relaxed">{children}</span>
      </label>
      {error && <p className="error-message mt-1.5 ml-8">{error}</p>}
    </div>
  );
}
