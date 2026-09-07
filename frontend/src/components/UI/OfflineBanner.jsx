import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { FiWifiOff, FiWifi } from 'react-icons/fi';
import useOnline from '../../hooks/useOnline';

/**
 * Tells the customer the app has lost the network, and confirms when it is back.
 *
 * Without this a dropped connection surfaced only as generic "Errore di rete"
 * toasts on whatever the customer happened to touch next, which reads as the
 * shop being broken rather than the connection being down. That is worst mid-
 * checkout, where people retry a payment they think failed.
 *
 * The recovery note is transient — a persistent "you are online" bar is just
 * furniture — while the offline bar stays until the connection actually returns.
 */
export default function OfflineBanner() {
  const { online, wasOffline, clearWasOffline } = useOnline();
  const [showRecovered, setShowRecovered] = useState(false);

  useEffect(() => {
    if (online && wasOffline) {
      setShowRecovered(true);
      const timer = setTimeout(() => {
        setShowRecovered(false);
        clearWasOffline();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [online, wasOffline, clearWasOffline]);

  const visible = !online || showRecovered;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
          // `assertive` for the loss (it changes what the customer can do right
          // now), `polite` for the recovery.
          role="status"
          aria-live={online ? 'polite' : 'assertive'}
          className={`fixed top-0 inset-x-0 z-[60] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium
            ${online ? 'bg-ink text-white' : 'bg-brand text-white'}`}
        >
          {online
            ? <><FiWifi size={15} aria-hidden="true" /> Connessione ripristinata</>
            : <><FiWifiOff size={15} aria-hidden="true" /> Sei offline — alcune azioni non sono disponibili</>}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
