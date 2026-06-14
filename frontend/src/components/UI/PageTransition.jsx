import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Curtain wipe on every route change: three staggered brand panels sweep
// down and retract, masking the content swap underneath.
const PANELS = ['#D8125B', '#2C2E39', '#0e1016'];

export default function PageTransition() {
  const location = useLocation();
  const [transitionKey, setTransitionKey] = useState(null);
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    setTransitionKey(location.pathname);
  }, [location.pathname]);

  return (
    <AnimatePresence>
      {transitionKey && (
        <motion.div
          key={transitionKey}
          className="fixed inset-0 z-[80] pointer-events-none flex flex-col"
          initial="enter"
          animate="exit"
          onAnimationComplete={() => setTransitionKey(null)}
          aria-hidden="true"
        >
          {PANELS.map((color, i) => (
            <motion.div
              key={i}
              className="flex-1 w-full"
              style={{ backgroundColor: color, originY: 0 }}
              variants={{
                enter: { scaleY: 0 },
                exit: {
                  scaleY: [0, 1, 1, 0],
                  originY: [0, 0, 1, 1],
                  transition: {
                    duration: 0.9,
                    times: [0, 0.35, 0.6, 1],
                    delay: i * 0.07,
                    ease: [0.76, 0, 0.24, 1],
                  },
                },
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
