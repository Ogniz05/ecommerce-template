import React from 'react';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

// Slot-machine number: each digit is a vertical 0-9 column that spins
// into place when the counter scrolls into view.
function DigitColumn({ digit, delay }) {
  return (
    <span className="inline-block overflow-hidden align-baseline" style={{ height: '1em' }}>
      <motion.span
        className="block"
        initial={{ y: 0 }}
        animate={{ y: `-${digit}em` }}
        transition={{ duration: 1.4, delay, ease: [0.22, 1, 0.36, 1] }}
      >
        {[...Array(10)].map((_, d) => (
          <span key={d} className="block" style={{ height: '1em', lineHeight: 1 }}>{d}</span>
        ))}
      </motion.span>
    </span>
  );
}

export default function RollingCounter({ to, suffix = '' }) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const str = to.toLocaleString('it-IT');

  return (
    <span ref={ref} className="inline-flex items-baseline" style={{ lineHeight: 1 }}>
      {inView
        ? str.split('').map((ch, i) =>
            /\d/.test(ch)
              ? <DigitColumn key={i} digit={parseInt(ch)} delay={0.1 + i * 0.08} />
              : <span key={i}>{ch}</span>
          )
        : <span style={{ visibility: 'hidden' }}>{str}</span>}
      {suffix}
    </span>
  );
}
