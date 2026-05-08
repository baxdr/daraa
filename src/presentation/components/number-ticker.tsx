'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * Animated count-up from 0 → target. Respects prefers-reduced-motion
 * (snaps to target immediately when set). Screen readers get the final
 * value via an `aria-label` on a wrapping container, and the animating
 * digits themselves are marked `aria-hidden` to avoid announcement spam.
 */
export function NumberTicker({
  target,
  durationMs = 1200,
  className,
  locale = 'en-US',
  ariaLabel,
}: {
  target: number;
  durationMs?: number;
  className?: string;
  locale?: string;
  ariaLabel?: string;
}) {
  const reduced = useReducedMotion();
  const [rendered, setRendered] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setRendered(target);
      return;
    }
    let raf = 0;
    let start: number | null = null;
    function tick(ts: number) {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / durationMs);
      const eased = 1 - Math.pow(1 - p, 3);
      setRendered(Math.round(target * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);

  const finalLabel = target.toLocaleString(locale);
  return (
    <span
      className={`tabular-nums ${className ?? ''}`}
      role={ariaLabel ? 'text' : undefined}
      aria-label={ariaLabel ?? finalLabel}
    >
      <span aria-hidden="true">{rendered.toLocaleString(locale)}</span>
    </span>
  );
}
