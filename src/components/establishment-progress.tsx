'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AgentActivity, AgentId, AgentMessage } from '@/agents/types';
import { Timeline } from './timeline';

/**
 * Live progress view for the establishment orchestrator.
 *
 * Mirrors `ScanProgress` but for plan runs — shows the entity-specialists
 * communicating with each other as they assemble the roadmap. When the
 * orchestrator reports status=complete, the page is refreshed so the
 * parent server component can render the final roadmap view.
 */

const STATION_ROW: Array<{ id: AgentId; label: string }> = [
  { id: 'orchestrator',  label: 'المنسّق' },
  { id: 'research',      label: 'البحث' },
  { id: 'mci',           label: 'التجارة' },
  { id: 'civil_defense', label: 'الدفاع المدني' },
  { id: 'municipality',  label: 'البلدية' },
  { id: 'sfda',          label: 'الغذاء والدواء' },
  { id: 'mohr_gosi',     label: 'الموارد والتأمينات' },
  { id: 'zatca',         label: 'الزكاة والضريبة' },
];

export function EstablishmentProgress({ planId }: { planId: string }) {
  const router = useRouter();
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [status, setStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 180;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (cancelledRef.current) return;
      attempts += 1;
      try {
        const res = await fetch(`/api/establishment/${planId}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('فشل التواصل مع الخادم');
        const data = (await res.json()) as {
          status: string;
          activities: AgentActivity[];
          messages: AgentMessage[];
          errorMessage?: string | null;
        };
        if (cancelledRef.current) return;
        setActivities(data.activities ?? []);
        setMessages(data.messages ?? []);
        setStatus(data.status);

        if (data.status === 'complete') {
          timer = setTimeout(() => {
            if (!cancelledRef.current) router.refresh();
          }, 800);
          return;
        }
        if (data.status === 'error') {
          setError(data.errorMessage ?? 'حصل خطأ غير متوقع');
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          setError('استغرق التحضير وقت أطول من اللازم.');
          return;
        }
        timer = setTimeout(poll, 500);
      } catch (e) {
        if (cancelledRef.current) return;
        setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      }
    }

    poll();
    return () => {
      cancelledRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [planId, router]);

  const stationStatus = useMemo(() => computeStationStatus(activities), [activities]);
  const visibleStations = useMemo(
    () => STATION_ROW.filter((s) => s.id in stationStatus || s.id === 'orchestrator' || s.id === 'research'),
    [stationStatus],
  );
  const progress = useMemo(() => {
    const completed = Object.values(stationStatus).filter((s) => s === 'completed').length;
    const expected = Math.max(visibleStations.length, 4);
    return Math.min(100, Math.round((completed / expected) * 100));
  }, [stationStatus, visibleStations.length]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-16">
      <header className="mb-8">
        <span className="eyebrow">جاري التحضير</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          متخصّصو الجهات يتواصلون
        </h1>
        <p className="mt-3 max-w-xl text-base text-ink-2">
          كل متخصّص يعرف جهة حكومية ويتواصل مع الباقيين — يتّفقون على الترتيب ويبنون خريطتك.
        </p>
      </header>

      <div className="rule mb-8" />

      {visibleStations.length > 0 && (
        <section className="mb-10 grid grid-cols-2 gap-0 overflow-hidden border border-rule bg-white sm:grid-cols-4">
          {visibleStations.map((s, i) => (
            <Station
              key={s.id}
              label={s.label}
              state={stationStatus[s.id] ?? 'idle'}
              isLast={i === visibleStations.length - 1}
            />
          ))}
        </section>
      )}

      <div className="mb-10">
        <div className="flex items-baseline justify-between text-xs text-muted">
          <span>التقدّم</span>
          <span className="font-mono tabular-nums">{progress}٪</span>
        </div>
        <div className="mt-2 h-px bg-rule">
          <div
            className="h-full bg-ink transition-[width] duration-700"
            style={{ width: `${progress}%`, marginInlineStart: 'auto' }}
          />
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <span className="eyebrow">السجل المباشر</span>
          <span className="font-mono text-[11px] text-muted">
            {activities.length} نشاط · {messages.length} رسالة A2A
          </span>
        </div>
        <Timeline activities={activities} messages={messages} />
      </section>

      {error && (
        <div className="mt-8 border-s-2 border-danger bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </div>
      )}

      {status !== 'complete' && status !== 'error' && (
        <p className="mt-12 text-[11px] text-muted">
          معرّف الخطة: <code dir="ltr" className="font-mono">{planId}</code>
        </p>
      )}
    </main>
  );
}

/* ------------------------------------------------------------------------- */

type StationState = 'idle' | 'working' | 'completed' | 'error';

function computeStationStatus(activities: AgentActivity[]): Partial<Record<AgentId, StationState>> {
  const out: Partial<Record<AgentId, StationState>> = {};
  for (const a of activities) {
    const current = out[a.agent];
    if (a.status === 'error') out[a.agent] = 'error';
    else if (a.status === 'completed') out[a.agent] = 'completed';
    else if (current !== 'completed' && current !== 'error') out[a.agent] = 'working';
  }
  return out;
}

function Station({
  label,
  state,
  isLast,
}: {
  label: string;
  state: StationState;
  isLast: boolean;
}) {
  const dotColor =
    state === 'error'     ? 'bg-danger' :
    state === 'completed' ? 'bg-accent' :
    state === 'working'   ? 'bg-warn' :
                            'bg-rule';
  const pulsing = state === 'working';
  return (
    <div
      className={`flex items-center gap-2 border-rule px-3 py-3 ${
        isLast ? '' : 'sm:border-s'
      } border-b sm:border-b-0`}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${dotColor} ${pulsing ? 'animate-pulse-subtle' : ''}`}
        aria-hidden
      />
      <span className="font-display text-[11px] font-extrabold text-ink">{label}</span>
    </div>
  );
}
