'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * Hero mockup — a live-feeling preview of the agent timeline.
 *
 * Not a screenshot. Real DOM with a staggered state machine so the user
 * can feel the product running in-place on the landing page. Respects
 * `prefers-reduced-motion` by freezing the final frame.
 */

type Status = 'idle' | 'working' | 'done';

interface Stage {
  id: string;
  label: string;
  detail: string;
  /** seconds from t=0 when this stage flips to "working" */
  startAt: number;
  /** seconds from t=0 when this stage flips to "done" */
  endAt: number;
}

const STAGES: Stage[] = [
  {
    id: 'mci',
    label: 'وكيل التجارة',
    detail: 'السجل التجاري جاهز — نوع الكيان ذ.م.م',
    startAt: 0.0,
    endAt: 1.8,
  },
  { id: 'zatca', label: 'وكيل الزكاة', detail: 'التسجيل الضريبي مكتمل', startAt: 1.4, endAt: 2.8 },
  {
    id: 'cd',
    label: 'وكيل الدفاع المدني',
    detail: 'شهادة السلامة جاهزة للإصدار',
    startAt: 2.2,
    endAt: 3.8,
  },
  {
    id: 'muni',
    label: 'وكيل البلدية',
    detail: 'رخصة (نشاط غذائي) قيد الإصدار…',
    startAt: 3.2,
    endAt: 5.0,
  },
  {
    id: 'sfda',
    label: 'وكيل الغذاء والدواء',
    detail: 'بانتظار رخصة البلدية',
    startAt: 4.8,
    endAt: 6.2,
  },
];

const LOOP_SEC = 7.4;

const MESSAGES: Array<{ t: number; from: string; to: string; text: string }> = [
  { t: 1.6, from: 'وكيل التجارة', to: 'الجميع', text: 'السجل جاهز — نوع الكيان: ذ.م.م' },
  {
    t: 3.6,
    from: 'وكيل الدفاع المدني',
    to: 'وكيل البلدية',
    text: 'شهادة السلامة جاهزة — تقدر تبدأ الرخصة',
  },
  {
    t: 5.1,
    from: 'وكيل البلدية',
    to: 'وكيل الغذاء والدواء',
    text: 'رخصة بلدية (نشاط غذائي) قيد الإصدار',
  },
];

export function HeroAgentsMockup() {
  const reduced = useReducedMotion();
  const [t, setT] = useState(reduced ? LOOP_SEC : 0);

  useEffect(() => {
    if (reduced) return;
    let raf = 0;
    let start: number | null = null;
    function tick(ts: number) {
      if (start === null) start = ts;
      const elapsed = ((ts - start) / 1000) % LOOP_SEC;
      setT(elapsed);
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [reduced]);

  const stageStatus = (s: Stage): Status => {
    if (t >= s.endAt) return 'done';
    if (t >= s.startAt) return 'working';
    return 'idle';
  };

  const visibleMsgs = MESSAGES.filter((m) => t >= m.t).slice(-2);

  return (
    <div
      aria-label="عرض توضيحي للوكلاء وهم يشتغلون"
      className="relative w-full overflow-hidden border border-rule bg-white shadow-sm"
    >
      {/* Window chrome — editorial, minimal */}
      <div className="flex items-center justify-between border-b border-rule bg-paper-2/60 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-2 w-2 rounded-full bg-danger/70" />
          <span aria-hidden className="h-2 w-2 rounded-full bg-warn/70" />
          <span aria-hidden className="h-2 w-2 rounded-full bg-accent/70" />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted">
          <span
            className="inline-block h-1.5 w-1.5 animate-pulse-subtle rounded-full bg-accent"
            aria-hidden
          />
          <span className="font-mono">daraa.sa/project/.../agents</span>
        </div>
        <span className="font-mono text-[11px] tabular-nums text-muted">
          {Math.min(t, LOOP_SEC).toFixed(1)}s
        </span>
      </div>

      {/* Header — project name */}
      <div className="border-b border-rule px-5 py-3">
        <div className="eyebrow">جاري التحضير</div>
        <div className="mt-0.5 font-display text-base font-extrabold tracking-tight">
          خريطة كوفي الأصالة — الرياض
        </div>
      </div>

      {/* Stations row */}
      <div className="grid grid-cols-5 gap-0 border-b border-rule bg-paper-2/40">
        {STAGES.map((s, i) => {
          const state = stageStatus(s);
          const color =
            state === 'done' ? 'bg-accent' : state === 'working' ? 'bg-warn' : 'bg-rule';
          return (
            <div
              key={s.id}
              className={`flex flex-col items-center gap-1 px-1.5 py-2.5 ${i < STAGES.length - 1 ? 'border-s border-rule/60' : ''}`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 shrink-0 rounded-full transition-colors ${color} ${state === 'working' ? 'animate-pulse-subtle' : ''}`}
              />
              <span className="text-center font-display text-[10px] font-extrabold leading-tight text-ink">
                {s.label.replace('وكيل ', '')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live log — activities + A2A messages */}
      <div className="relative max-h-[260px] overflow-hidden px-5 py-4">
        <ul className="space-y-2 text-[12.5px]">
          {STAGES.map((s) => {
            const state = stageStatus(s);
            if (state === 'idle') return null;
            const icon = state === 'done' ? '✓' : '●';
            const tone = state === 'done' ? 'text-accent-strong' : 'text-ink';
            return (
              <li key={s.id} className="flex animate-fade-rise items-baseline gap-2.5">
                <span className={`shrink-0 font-mono text-[11px] ${tone}`} aria-hidden>
                  {icon}
                </span>
                <span className={`flex-1 ${tone}`}>
                  <span className="font-display font-extrabold">{s.label}</span>
                  <span className="mx-1.5 text-muted">·</span>
                  <span className="text-ink-2">{s.detail}</span>
                </span>
                {state === 'working' && (
                  <span
                    aria-hidden
                    className="h-1 w-1 shrink-0 animate-pulse-subtle rounded-full bg-warn"
                  />
                )}
              </li>
            );
          })}

          {visibleMsgs.map((m) => (
            <li key={`${m.t}-${m.from}`} className="flex animate-fade-rise items-start gap-2.5">
              <span className="shrink-0 font-mono text-[11px] text-accent" aria-hidden>
                ⇄
              </span>
              <div className="flex-1 border-s-2 border-accent bg-accent-soft/60 px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 text-[10.5px]">
                  <span className="font-mono tracking-widest text-accent">A2A</span>
                  <span className="text-muted">·</span>
                  <span className="font-display font-extrabold text-ink">{m.from}</span>
                  <span className="text-muted">→</span>
                  <span className="font-display font-extrabold text-ink">{m.to}</span>
                </div>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink">{m.text}</p>
              </div>
            </li>
          ))}
        </ul>

        {/* Fade at the bottom when loop resets */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent"
        />
      </div>
    </div>
  );
}
