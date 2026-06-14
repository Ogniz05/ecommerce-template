import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Brand splash on first load (once per session): logo pop + percentage
// counter, then panels slide away revealing the page.
export default function Preloader() {
  const [show, setShow] = useState(() => !sessionStorage.getItem('preloaded'));
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!show) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      sessionStorage.setItem('preloaded', '1');
      setShow(false);
      return;
    }
    document.body.style.overflow = 'hidden';
    const start = performance.now();
    const DURATION = 1100;
    let raf;
    const tick = (now) => {
      const p = Math.min(1, (now - start) / DURATION);
      setCount(Math.floor(p * 100));
      if (p < 1) raf = requestAnimationFrame(tick);
      else {
        sessionStorage.setItem('preloaded', '1');
        setTimeout(() => {
          setShow(false);
          document.body.style.overflow = '';
        }, 350);
      }
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); document.body.style.overflow = ''; };
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] bg-dark flex items-center justify-center overflow-hidden"
          exit={{ y: '-100%', transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } }}
        >
          {/* Glow */}
          <div className="absolute w-[500px] h-[500px] rounded-full blur-3xl"
            style={{ background: 'radial-gradient(circle, rgba(216,18,91,0.25) 0%, transparent 65%)' }} />

          <div className="relative flex flex-col items-center gap-6">
            <motion.div
              className="w-20 h-20 rounded-3xl bg-gradient-brand flex items-center justify-center"
              initial={{ scale: 0, rotate: -25 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 220, damping: 16 }}
            >
              <span className="text-white font-display font-bold text-3xl">Y</span>
            </motion.div>
            <motion.span
              className="font-display font-bold text-5xl text-white tabular-nums"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {count}<span className="text-brand">%</span>
            </motion.span>
            {/* Progress line */}
            <div className="w-48 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-brand to-brand-light transition-[width] duration-75" style={{ width: `${count}%` }} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
