'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { AgentActivity, AgentId, AgentMessage } from '@/agents/types';
import { Timeline } from './timeline';

const STATION_ROW: Array<{ id: AgentId; label: string }> = [
  { id: 'orchestrator', label: 'المنسّق' },
  { id: 'research', label: 'البحث' },
  { id: 'mci', label: 'التجارة' },
  { id: 'zatca', label: 'الزكاة' },
  { id: 'mohr_gosi', label: 'الموارد والتأمينات' },
  { id: 'civil_defense', label: 'الدفاع المدني' },
  { id: 'municipality', label: 'البلدية' },
  { id: 'sfda', label: 'الغذاء والدواء' },
  { id: 'moh', label: 'الصحة' },
  { id: 'pdpl_nca', label: 'حماية البيانات' },
  { id: 'scan', label: 'الفحص' },
  { id: 'analysis', label: 'التحليل' },
];

/**
 * Live-timeline view for /project/[id]/agents. Polls the unified project
 * endpoint and navigates to the dashboard when status flips to complete.
 * Shows which specialists actually spoke during the run — others stay
 * grey-dot idle so the user sees the true execution set, not a padded list.
 */
export function ProjectAgentsView({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [activities, setActivities] = useState<AgentActivity[]>([]);
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [status, setStatus] = useState<string>('pending');
  const [mode, setMode] = useState<string>('');
  const [companyName, setCompanyName] = useState<string>('');
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const startedAtRef = useRef<number>(Date.now());

  // Elapsed-time ticker — independent of polling so the UI feels alive
  // even between network round-trips.
  useEffect(() => {
    if (status === 'complete' || status === 'error') return;
    const id = setInterval(() => {
      setElapsedSec((Date.now() - startedAtRef.current) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  const [stalled, setStalled] = useState(false);

  useEffect(() => {
    cancelledRef.current = false;
    startedAtRef.current = Date.now();
    let attempts = 0;
    let consecutiveFailures = 0;
    const MAX_ATTEMPTS = 180;
    const MAX_CONSECUTIVE_FAILURES = 5;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      if (cancelledRef.current) return;
      attempts += 1;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8_000);
      try {
        const res = await fetch(`/api/project/${projectId}`, {
          cache: 'no-store',
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as {
          status: string;
          mode: string;
          companyName?: string;
          activities: AgentActivity[];
          messages: AgentMessage[];
          errorMessage?: string | null;
        };
        if (cancelledRef.current) return;
        consecutiveFailures = 0;
        setError(null);
        setActivities(data.activities ?? []);
        setMessages(data.messages ?? []);
        setStatus(data.status);
        setMode(data.mode);
        if (data.companyName) setCompanyName(data.companyName);

        if (data.status === 'complete') {
          timer = setTimeout(() => {
            if (!cancelledRef.current) router.replace(`/project/${projectId}`);
          }, 900);
          return;
        }
        if (data.status === 'error') {
          setError(data.errorMessage ?? 'حصل خطأ غير متوقع');
          return;
        }
        if (attempts >= MAX_ATTEMPTS) {
          setStalled(true);
          return;
        }
        timer = setTimeout(() => void poll(), 500);
      } catch (e) {
        clearTimeout(timeoutId);
        if (cancelledRef.current) return;
        consecutiveFailures += 1;
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          setError(
            e instanceof Error && e.name === 'AbortError'
              ? 'انقطاع اتصال — الخادم لا يستجيب.'
              : 'تعذّر الاتصال بالخادم بعد عدة محاولات.',
          );
          return;
        }
        // Transient failure — retry with exponential backoff (1s, 2s, 4s, ...).
        const delay = Math.min(8_000, 1_000 * 2 ** (consecutiveFailures - 1));
        timer = setTimeout(() => void poll(), delay);
      }
    }

    void poll();
    return () => {
      cancelledRef.current = true;
      if (timer) clearTimeout(timer);
    };
  }, [projectId, router]);

  const stationStatus = useMemo(() => computeStationStatus(activities), [activities]);
  const visibleStations = useMemo(
    () => STATION_ROW.filter((s) => s.id in stationStatus),
    [stationStatus],
  );
  const progress = useMemo(() => {
    const completed = Object.values(stationStatus).filter((s) => s === 'completed').length;
    const expected = Math.max(visibleStations.length, 4);
    return Math.min(100, Math.round((completed / expected) * 100));
  }, [stationStatus, visibleStations.length]);

  const title = companyName
    ? mode === 'compliance'
      ? `درع يفحص امتثال ${companyName}`
      : `درع يجهّز خريطة ${companyName}`
    : 'الوكلاء يتواصلون';

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-16">
      {/* Breadcrumb */}
      <nav aria-label="مسار التنقّل" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          درع
        </Link>
        <span aria-hidden>›</span>
        <Link href="/chat" className="hover:text-ink">
          المحادثة
        </Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">الوكلاء</span>
      </nav>

      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <span className="eyebrow">{mode === 'compliance' ? 'الفحص جارٍ' : 'جاري التحضير'}</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight tracking-tight md:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-xl text-sm text-ink-2 md:text-base">
            وكيل البحث يجلب التحديثات، المتخصّصون يتبادلون الرسائل على الحافلة، ووكيل التحليل يُنتج
            النتيجة. السجل أدناه مباشر.
          </p>
        </div>

        {/* Elapsed-time badge — live */}
        {status !== 'complete' && status !== 'error' && (
          <div
            className="shrink-0 border border-rule bg-paper-2 px-3 py-2 text-center"
            aria-live="polite"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-muted">الزمن</div>
            <div className="mt-1 font-display text-xl font-extrabold tabular-nums leading-none text-ink">
              {elapsedSec.toFixed(1)}s
            </div>
          </div>
        )}
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
        {activities.length === 0 && messages.length === 0 ? (
          <TimelineSkeleton />
        ) : (
          <Timeline activities={activities} messages={messages} />
        )}
      </section>

      {error && (
        <div className="mt-8 border-s-2 border-danger bg-danger/5 px-4 py-4">
          <p className="text-sm text-danger">{error}</p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="border border-ink bg-paper px-3 py-1.5 font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              حاول مجدداً
            </button>
            <Link
              href={`/project/${projectId}`}
              className="border border-rule bg-white px-3 py-1.5 font-semibold text-ink-2 hover:border-ink hover:text-ink"
            >
              اذهب للتقرير كما هو
            </Link>
          </div>
        </div>
      )}

      {stalled && !error && (
        <div className="mt-8 border-s-2 border-warn bg-warn-soft/70 px-4 py-4">
          <p className="text-sm text-ink">
            استغرق التحضير وقتاً أطول من المعتاد. غالباً التقرير جاهز — جرّب تفتحه مباشرة.
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-xs">
            <button
              type="button"
              onClick={() => {
                setStalled(false);
                window.location.reload();
              }}
              className="border border-ink bg-paper px-3 py-1.5 font-semibold text-ink hover:bg-ink hover:text-paper"
            >
              تحقق من الحالة
            </button>
            <Link
              href={`/project/${projectId}`}
              className="border border-rule bg-white px-3 py-1.5 font-semibold text-ink-2 hover:border-ink hover:text-ink"
            >
              افتح التقرير ←
            </Link>
          </div>
        </div>
      )}

      {status !== 'complete' && status !== 'error' && (
        <p className="mt-12 text-xs text-muted">
          معرّف المشروع:{' '}
          <code dir="ltr" className="font-mono">
            {projectId}
          </code>
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

function TimelineSkeleton() {
  // 4 shimmering placeholder rows that mimic activity + message shapes.
  return (
    <ol aria-hidden className="space-y-0">
      {[0, 1, 2, 3].map((i) => (
        <li key={i} className="flex items-baseline gap-4 border-b border-rule/50 py-3">
          <span className="h-2 w-2 shrink-0 animate-pulse-subtle rounded-full bg-rule" />
          <span
            className="h-3 animate-pulse-subtle bg-paper-2"
            style={{ width: `${60 - i * 8}%` }}
          />
        </li>
      ))}
    </ol>
  );
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
    state === 'error'
      ? 'bg-danger'
      : state === 'completed'
        ? 'bg-accent'
        : state === 'working'
          ? 'bg-warn'
          : 'bg-rule';
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
