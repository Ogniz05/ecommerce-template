import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router keeps the scroll offset when the path changes, so navigating
 * from halfway down the catalogue into a product would open it mid-page.
 * Restores the top on every navigation that isn't a back/forward step.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname]);

  return null;
}
