import React, { useState, useRef, useEffect } from 'react';

const GLYPHS = '!<>-_\\/[]{}—=+*^?#ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Decrypt-style hover effect: characters scramble through random glyphs
// and settle left-to-right into the real text.
export default function ScrambleText({ text, className = '' }) {
  const [display, setDisplay] = useState(text);
  const timer = useRef(null);

  useEffect(() => { setDisplay(text); }, [text]);
  useEffect(() => () => clearInterval(timer.current), []);

  const scramble = () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const TOTAL = 12;
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      frame++;
      const progress = frame / TOTAL;
      setDisplay(
        text.split('').map((ch, i) => {
          if (ch === ' ') return ' ';
          return i < progress * text.length ? ch : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        }).join('')
      );
      if (frame >= TOTAL) { clearInterval(timer.current); setDisplay(text); }
    }, 26);
  };

  return (
    <span onMouseEnter={scramble} className={`inline-block whitespace-nowrap ${className}`}>
      {display}
    </span>
  );
}
