'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

interface ScoreRingProps {
  score: number;
  label: string;
  sublabel?: string;
}

export function ScoreRing({ score, label, sublabel }: ScoreRingProps) {
  const clamped = Math.max(0, Math.min(100, score));
  const reduced = useReducedMotion();
  const [rendered, setRendered] = useState(reduced ? clamped : 0);

  useEffect(() => {
    if (reduced) {
      setRendered(clamped);
      return;
    }
    let start: number | null = null;
    const DURATION = 900;
    let raf = 0;
    function tick(ts: number) {
      if (start === null) start = ts;
      const p = Math.min(1, (ts - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      setRendered(clamped * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [clamped, reduced]);

  const strokeColor = clamped >= 75 ? '#166534' : clamped >= 50 ? '#B8571E' : '#9B2C2C';
  const circumference = 2 * Math.PI * 56;
  const dash = (rendered / 100) * circumference;

  const roundedScore = Math.round(rendered);
  const ariaLabel = `${label} ${Math.round(clamped)} بالمئة`;

  return (
    <div className="flex items-center gap-5">
      <div
        className="relative h-32 w-32 shrink-0 md:h-36 md:w-36"
        role="img"
        aria-label={ariaLabel}
      >
        <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" aria-hidden="true">
          <circle cx="64" cy="64" r="56" fill="none" stroke="#D9D1C3" strokeWidth="2" />
          <circle
            cx="64"
            cy="64"
            r="56"
            fill="none"
            stroke={strokeColor}
            strokeWidth="3"
            strokeLinecap="butt"
            strokeDasharray={`${dash} ${circumference}`}
            style={{ transition: reduced ? 'none' : 'stroke-dasharray 60ms linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div
            aria-hidden="true"
            className="font-display text-4xl font-extrabold tabular-nums leading-none tracking-tighter text-ink md:text-5xl"
          >
            {roundedScore}
            <span className="text-xl text-muted md:text-2xl">٪</span>
          </div>
        </div>
      </div>
      <div>
        <div className="eyebrow">الامتثال الإجمالي</div>
        <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight">
          {label}
        </h2>
        {sublabel && <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink-2">{sublabel}</p>}
      </div>
    </div>
  );
}
