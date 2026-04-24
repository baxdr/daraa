import type { RenewalEntry } from '@/lib/renewals';

/**
 * Active-monitoring panel — shown on every project's dashboard once the
 * initial pipeline finishes, regardless of mode. Each entity with a
 * recurring `renewalPeriodAr` gets a row in a license-status grid plus a
 * horizontal 180-day timeline.
 *
 * Urgency thresholds (60 / 30 / 7 days) drive the colour coding:
 *   - overdue (red)     — < 0 days
 *   - urgent  (red)     — < 7 days
 *   - soon    (amber)   — 7–30 days
 *   - notice  (yellow)  — 30–60 days
 *   - ok      (green)   — > 60 days
 */

interface ActiveMonitoringPanelProps {
  renewals: RenewalEntry[];
  /** If any entity never sets renewalPeriod → it's excluded from the grid.
   *  The count is shown so the user knows we considered the full set. */
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
        <p className="border border-rule bg-paper-2 px-6 py-6 text-sm text-ink-2">
          ما فيه رخص تتطلب تجديداً دورياً لهذا المشروع.
        </p>
      </section>
    );
  }

  const critical = renewals.filter((r) => r.urgency === 'urgent' || r.urgency === 'overdue').length;
  const upcoming = renewals.filter((r) => r.urgency === 'soon' || r.urgency === 'notice').length;
  const healthy  = renewals.filter((r) => r.urgency === 'ok').length;

  return (
    <section className="mb-12">
      <div className="mb-4 flex items-baseline justify-between">
        <div>
          <span className="eyebrow">مرحلة التشغيل</span>
          <h2 className="mt-1 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            المراقبة المستمرة
          </h2>
        </div>
        <span className="font-mono text-[11px] text-muted">
          {renewals.length.toString().padStart(2, '0')} من {totalEntities.toString().padStart(2, '0')} جهة
        </span>
      </div>
      <div className="rule mb-6" />

      {/* Summary pills */}
      <div className="mb-6 grid grid-cols-3 gap-0 border border-rule">
        <SummaryPill count={critical} label="تحتاج إجراء الآن" tone="danger" />
        <SummaryPill count={upcoming} label="قرب موعد التجديد" tone="warn"   />
        <SummaryPill count={healthy}  label="سارية"             tone="ok"     last />
      </div>

      {/* Status rows */}
      <ul className="space-y-3">
        {renewals.map((r) => (
          <RenewalRow key={r.entityId} renewal={r} />
        ))}
      </ul>

      <p className="mt-4 text-[11px] text-muted">
        التنبيهات محسوبة على افتراض أن كل الرخص أُصدرت يوم إنشاء المشروع.
        لو عندك تواريخ دقيقة،{' '}
        <a href="/chat" className="font-semibold text-accent hover:text-accent-strong">
          ابدأ مساراً تشغيلياً جديداً
        </a>{' '}
        للحصول على تنبيهات بتواريخ حقيقية.
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
    tone === 'danger' ? 'text-danger'       :
    tone === 'warn'   ? 'text-warn-strong'  :
                        'text-accent-strong';
  return (
    <div
      className={`px-5 py-4 text-center ${last ? '' : 'border-e border-rule'}`}
    >
      <div className={`font-display text-3xl font-extrabold tabular-nums leading-none md:text-4xl ${color}`}>
        {String(count).padStart(2, '0')}
      </div>
      <div className="mt-2 text-[11px] leading-tight text-ink-2">{label}</div>
    </div>
  );
}

function RenewalRow({ renewal: r }: { renewal: RenewalEntry }) {
  const style = urgencyStyle(r.urgency);
  const dateLabel = r.nextDueAt.toLocaleDateString('ar-SA-u-ca-gregory', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <li className="grid grid-cols-[6px_1fr] overflow-hidden border border-rule bg-white">
      <div className={style.bar} aria-hidden />
      <div className="px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className={`shrink-0 font-mono text-[10px] font-bold tracking-widest ${style.label}`}>
                {style.icon}
              </span>
              <h3 className="font-display text-lg font-extrabold leading-tight tracking-tight text-ink">
                {r.nameSimpleAr}
              </h3>
            </div>
            <div className="mt-1 text-xs text-muted">
              دورة: {r.renewalPeriodAr}
              <span className="mx-2 text-rule">·</span>
              موعد التجديد: <span className="font-mono" dir="ltr">{dateLabel}</span>
            </div>
          </div>
          <div className="shrink-0 text-end">
            <div className={`font-display text-2xl font-extrabold tabular-nums leading-none ${style.numColor}`}>
              {r.daysRemaining < 0 ? `-${Math.abs(r.daysRemaining)}` : r.daysRemaining}
            </div>
            <div className="mt-0.5 text-[11px] text-muted">يوم</div>
          </div>
        </div>
        {r.urgency !== 'ok' && r.officialUrl && (
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

function urgencyStyle(u: RenewalEntry['urgency']): {
  bar: string;
  label: string;
  icon: string;
  numColor: string;
  actionLabel: string;
} {
  switch (u) {
    case 'overdue':
      return {
        bar: 'bg-danger',
        label: 'text-danger',
        icon: '🔴',
        numColor: 'text-danger',
        actionLabel: 'متأخّر — جدّد فوراً ↗',
      };
    case 'urgent':
      return {
        bar: 'bg-danger',
        label: 'text-danger',
        icon: '⚠️',
        numColor: 'text-danger',
        actionLabel: 'عاجل جداً — ابدأ الآن',
      };
    case 'soon':
      return {
        bar: 'bg-warn',
        label: 'text-warn-strong',
        icon: '⏳',
        numColor: 'text-warn-strong',
        actionLabel: 'ابدأ إجراءات التجديد',
      };
    case 'notice':
      return {
        bar: 'bg-warn/60',
        label: 'text-warn-strong',
        icon: '📅',
        numColor: 'text-ink',
        actionLabel: 'خطّط للتجديد مبكراً',
      };
    case 'ok':
    default:
      return {
        bar: 'bg-accent',
        label: 'text-accent-strong',
        icon: '✓',
        numColor: 'text-ink-2',
        actionLabel: 'افتح البوابة',
      };
  }
}
