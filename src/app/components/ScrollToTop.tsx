import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Resets scroll to the top on every route change — otherwise React Router
// keeps the browser's scroll position from the previous page.
export function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
