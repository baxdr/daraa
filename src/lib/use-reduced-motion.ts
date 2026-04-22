'use client';

import { useEffect, useState } from 'react';

/**
 * Returns true when the user has requested reduced motion via OS/browser
 * settings. Updates live if they change the preference mid-session.
 *
 * JS-driven animations (rAF-based score/fine tickers) must short-circuit
 * when this is true — CSS animations are already handled by the global
 * @media (prefers-reduced-motion: reduce) block in globals.css.
 */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}
