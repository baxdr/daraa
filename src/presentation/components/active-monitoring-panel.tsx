import type { Renewal } from '@/lib/project-store';
import { daysUntil } from '@/lib/renewals';

/**
 * Active-monitoring panel — shown on every project's dashboard once the
 * initial pipeline finishes. Each renewal entry gets a row in a license-
 * status grid plus a compact summary at the top.
 *
 * Urgency thresholds (30 / 7 days) drive the colour coding:
 *   - overdue (red)     — < 0 days
 *   - urgent  (red)     — < 7 days
 *   - soon    (amber)   — 7–30 days
 *   - ok      (green)   — > 30 days
 */

interface ActiveMonitoringPanelProps {
  renewals: Renewal[];
  /** Total entity count for context — shown next to "X من Y جهة". */
  totalEntities: number;
}

export function ActiveMonitoringPanel({ renewals, totalEntities }: ActiveMonitoringPanelProps) {
  if (renewals.length === 0) {
    return (
      <section className="mb-12">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            المراقبة المستمرة
          </h2>
        </div>
        <div className="rule mb-6" />
        <div className="rounded-md border border-accent/20 bg-accent-soft px-6 py-10 text-center">
          <h3 className="font-display text-lg font-extrabold text-accent-strong">
            لا توجد رخص تحتاج تجديد دوري
          </h3>
          <p className="mt-3 text-sm text-ink-2">
            جميع الجهات اللي تحتاج رخص دورية — ما فيه إجراءات عاجلة حالياً.
          </p>
        </div>
      </section>
    );
  }

  const critical = renewals.filter((r) => r.status === 'urgent' || r.status === 'overdue').length;
  const upcoming = renewals.filter((r) => r.status === 'soon').length;
  const healthy = renewals.filter((r) => r.status === 'ok').length;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <span className="eyebrow">جدول التذكيرات</span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            المراقبة المستمرة
          </h2>
        </div>
        <span className="font-mono text-[11px] text-muted">
          {renewals.length.toString().padStart(2, '0')} من{' '}
          {totalEntities.toString().padStart(2, '0')} جهة
        </span>
      </div>
      <div className="rule mb-6" />

      <div className="mb-6 grid grid-cols-3 gap-0 border border-rule">
        <SummaryPill count={critical} label="تحتاج إجراء الآن" tone="danger" />
        <SummaryPill count={upcoming} label="قرب موعد التجديد" tone="warn" />
        <SummaryPill count={healthy} label="سارية" tone="ok" last />
      </div>

      <ul className="space-y-3">
        {renewals.map((r) => (
          <RenewalRow key={r.entityId} renewal={r} />
        ))}
      </ul>

      <p className="mt-4 text-[11px] text-muted">
        التذكيرات بالإيميل تُرسَل تلقائياً قبل ٧ و ٣ أيام من كل تجديد. لو حدّثت تواريخ في حساب
        المحل، الجدول يتحدّث تلقائياً.
      </p>
    </section>
  );
}

function SummaryPill({
  count,
  label,
  tone,
  last,
}: {
  count: number;
  label: string;
  tone: 'danger' | 'warn' | 'ok';
  last?: boolean;
}) {
  const color =
    tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn-strong' : 'text-accent-strong';
  return (
    <div className={`px-5 py-4 text-center ${last ? '' : 'border-e border-rule'}`}>
      <div
        className={`font-display text-3xl font-extrabold tabular-nums leading-none md:text-4xl ${color}`}
      >
        {String(count).padStart(2, '0')}
      </div>
      <div className="mt-2 text-[11px] leading-tight text-ink-2">{label}</div>
    </div>
  );
}

function RenewalRow({ renewal: r }: { renewal: Renewal }) {
  const style = urgencyStyle(r.status);
  const days = daysUntil(r.dueDate);
  const dateLabel = formatArabicDate(r.dueDate);

  return (
    <li
      className="grid grid-cols-[6px_1fr] overflow-hidden border border-rule bg-white"
      role="region"
      aria-label={`${r.entityNameAr} - ${style.label}`}
    >
      <div className={style.bar} aria-hidden title={style.label} />
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <div
                className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-bold tracking-widest ${style.badge}`}
                role="status"
              >
                <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
                {style.label}
              </div>
              <h3 className="font-display text-lg font-extrabold leading-tight tracking-tight text-ink">
                {r.entityNameAr}
              </h3>
            </div>
            <div className="mt-1 text-xs text-muted">
              دورة التجديد: كل {r.renewalMonths} شهر
              <span className="mx-2 text-rule">·</span>
              موعد التجديد:{' '}
              <span className="font-mono" dir="ltr">
                {dateLabel}
              </span>
            </div>
          </div>
          <div className="shrink-0 text-end">
            <div
              className={`font-display text-2xl font-extrabold tabular-nums leading-none ${style.numColor}`}
            >
              {days < 0 ? `-${Math.abs(days)}` : days}
            </div>
            <div className="mt-0.5 text-[11px] text-muted">يوم متبقي</div>
          </div>
        </div>
        {r.status !== 'ok' && r.officialUrl && (
          <div className="mt-3 border-t border-rule pt-3">
            <a
              href={r.officialUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-strong"
            >
              <span>{style.actionLabel}</span>
              <span aria-hidden>↗</span>
            </a>
          </div>
        )}
      </div>
    </li>
  );
}

function formatArabicDate(iso: string): string {
  const ts = Date.parse(iso);
  if (Number.isNaN(ts)) return iso;
  return new Date(ts).toLocaleDateString('ar-SA-u-ca-gregory', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function urgencyStyle(u: Renewal['status']): {
  bar: string;
  label: string;
  badge: string;
  numColor: string;
  actionLabel: string;
} {
  switch (u) {
    case 'overdue':
      return {
        bar: 'bg-danger',
        label: 'متأخر',
        badge: 'border-danger/40 bg-danger/10 text-danger',
        numColor: 'text-danger',
        actionLabel: 'متأخّر — جدّد فوراً',
      };
    case 'urgent':
      return {
        bar: 'bg-danger',
        label: 'عاجل',
        badge: 'border-danger/40 bg-danger/10 text-danger',
        numColor: 'text-danger',
        actionLabel: 'عاجل جداً — ابدأ الآن',
      };
    case 'soon':
      return {
        bar: 'bg-warn',
        label: 'قريب',
        badge: 'border-warn/40 bg-warn-soft text-warn-strong',
        numColor: 'text-warn-strong',
        actionLabel: 'ابدأ إجراءات التجديد',
      };
    case 'ok':
    default:
      return {
        bar: 'bg-accent',
        label: 'ساري',
        badge: 'border-accent/30 bg-accent-soft text-accent-strong',
        numColor: 'text-ink-2',
        actionLabel: 'افتح البوابة',
      };
  }
}
