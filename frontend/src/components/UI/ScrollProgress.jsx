import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

// Thin gradient progress bar fixed at the very top of the viewport
export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 28, mass: 0.4 });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[3px] z-[60] origin-left pointer-events-none"
      style={{
        scaleX,
        background: 'linear-gradient(90deg, #D8125B 0%, #ff6b9d 50%, #D8125B 100%)',
        boxShadow: '0 0 12px rgba(216,18,91,0.6)',
      }}
      aria-hidden="true"
    />
  );
}
