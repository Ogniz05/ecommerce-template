import { useEffect, useState, useCallback } from 'react';

/**
 * Whether the browser currently has a network connection.
 *
 * `navigator.onLine` is the cheap signal, but it lies in one direction: it
 * reports true for a captive portal or a connected-but-dead network. So a
 * regained connection is confirmed with a real request before the app claims
 * to be back — otherwise the offline banner flickers away and every retry
 * still fails.
 */
export function useOnline({ verifyUrl = '/api/health', verifyTimeout = 4000 } = {}) {
  const [online, setOnline] = useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );
  // Distinguishes "never lost it" from "lost it and got it back", so callers
  // can refetch only in the second case.
  const [wasOffline, setWasOffline] = useState(false);

  const verify = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), verifyTimeout);
      const res = await fetch(verifyUrl, { method: 'GET', cache: 'no-store', signal: controller.signal });
      clearTimeout(timer);
      return res.ok;
    } catch {
      return false;
    }
  }, [verifyUrl, verifyTimeout]);

  useEffect(() => {
    let cancelled = false;

    const goOnline = async () => {
      const reachable = await verify();
      if (cancelled) return;
      if (reachable) setOnline(true);
    };

    const goOffline = () => {
      if (cancelled) return;
      setOnline(false);
      setWasOffline(true);
    };

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      cancelled = true;
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, [verify]);

  const clearWasOffline = useCallback(() => setWasOffline(false), []);

  return { online, wasOffline, clearWasOffline, verify };
}

export default useOnline;
