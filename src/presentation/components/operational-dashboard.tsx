import type { OperationalReport, OperationalGap } from '@/agents/operational-analysis';

/**
 * Operational-compliance dashboard block. Three visualisations:
 *   1. License-health ring + overdue/upcoming counts (summary header)
 *   2. 180-day license timeline — upcoming renewals plotted on a rail
 *   3. Alert list grouped by severity
 *
 * Pure presentational component. The parent dashboard page decides when
 * to render it (mode === 'operational_compliance').
 */
export function OperationalDashboard({ report }: { report: OperationalReport }) {
  return (
    <div className="space-y-10">
      <OperationalSummary report={report} />
      {report.narrative && <NarrativeBlock report={report} />}
      <LicenseTimeline report={report} />
      <OperationalAlerts report={report} />
    </div>
  );
}

function NarrativeBlock({ report }: { report: OperationalReport }) {
  return (
    <section className="border-s-4 border-accent bg-accent-soft px-6 py-5 md:px-7 md:py-6">
      <div className="mb-2 flex items-center gap-2">
        <span className="eyebrow !text-accent-strong">قراءة المحلّل بالـ AI</span>
      </div>
      <p className="text-sm leading-relaxed text-ink-2 md:text-base">{report.narrative}</p>
      {report.priorityActions && report.priorityActions.length > 0 && (
        <div className="mt-4 border-t border-accent/30 pt-4">
          <div className="eyebrow !text-[10px] !text-accent-strong">أولوياتك هذا الأسبوع</div>
          <ol className="mt-2 space-y-1.5">
            {report.priorityActions.map((action, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-ink-2">
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent font-mono text-[10px] font-bold text-white"
                >
                  {i + 1}
                </span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------------- */
/* 1. Summary — score ring + big counters                                    */
/* ------------------------------------------------------------------------- */

function OperationalSummary({ report }: { report: OperationalReport }) {
  const health = report.healthScore;
  const healthColor =
    health >= 75 ? 'text-accent-strong' : health >= 50 ? 'text-warn-strong' : 'text-danger';

  return (
    <section className="grid gap-10 md:grid-cols-3 md:gap-8">
      <div>
        <div className="eyebrow">صحّة الرخص</div>
        <div
          className={`mt-3 font-display text-6xl font-extrabold tabular-nums leading-none tracking-tighter md:text-7xl ${healthColor}`}
        >
          {health}
          <span className="text-2xl text-muted md:text-3xl">٪</span>
        </div>
        <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-2">
          {health >= 75
            ? 'الوضع جيد — تابع التذكيرات فقط.'
            : health >= 50
              ? 'في تنبيهات تحتاج لتتحرّك — راجع أدناه.'
              : 'وضع حرج — فيه رخص متأخرة أو على وشك الانتهاء.'}
        </p>
      </div>

      <CountBlock
        count={report.overdue.length}
        label="رخصة متأخّرة"
        sublabel="تحتاج تجديد فوري"
        tone="danger"
      />
      <CountBlock
        count={report.upcomingRenewals.length}
        label="تجديد خلال ١٨٠ يوم"
        sublabel="خطّط لها مبكّراً"
        tone={report.upcomingRenewals.length === 0 ? 'ok' : 'warn'}
      />
    </section>
  );
}

function CountBlock({
  count,
  label,
  sublabel,
  tone,
}: {
  count: number;
  label: string;
  sublabel: string;
  tone: 'ok' | 'warn' | 'danger';
}) {
  const color =
    tone === 'danger' ? 'text-danger' : tone === 'warn' ? 'text-warn-strong' : 'text-accent-strong';
  return (
    <div>
      <div className="eyebrow">{label}</div>
      <div
        className={`mt-3 font-display text-6xl font-extrabold tabular-nums leading-none tracking-tighter md:text-7xl ${color}`}
      >
        {String(count).padStart(2, '0')}
      </div>
      <p className="mt-3 text-sm text-ink-2">{sublabel}</p>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* 2. 180-day timeline                                                       */
/* ------------------------------------------------------------------------- */

const TIMELINE_WINDOW_DAYS = 180;

function LicenseTimeline({ report }: { report: OperationalReport }) {
  const dateRows = [...report.overdue, ...report.upcomingRenewals]
    .filter((g) => Number.isFinite(g.daysUntilDeadline))
    .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

  if (dateRows.length === 0) {
    return (
      <section>
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            جدول التجديدات
          </h2>
          <span className="font-mono text-xs text-muted">أفق ١٨٠ يوم</span>
        </div>
        <div className="rule mb-6" />
        <p className="border border-accent/20 bg-accent-soft px-6 py-6 text-sm text-accent-strong">
          ✓ كل الرخص المتاحة بياناتها بعيدة عن موعد التجديد — لا يوجد إجراء عاجل.
        </p>
      </section>
    );
  }

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          جدول التجديدات
        </h2>
        <span className="font-mono text-xs text-muted">أفق {TIMELINE_WINDOW_DAYS} يوم</span>
      </div>
      <div className="rule mb-6" />

      <div className="space-y-3">
        {dateRows.map((g) => (
          <TimelineRow key={g.id} gap={g} />
        ))}
      </div>
    </section>
  );
}

function TimelineRow({ gap }: { gap: OperationalGap }) {
  const days = gap.daysUntilDeadline;
  const isOverdue = days < 0;
  const clamped = Math.max(-30, Math.min(TIMELINE_WINDOW_DAYS, days));
  // Position 0 = today (right edge), TIMELINE_WINDOW_DAYS = left edge (RTL).
  // For overdue values, allow a small negative position shown as a red band.
  const pct = isOverdue ? 100 : Math.max(0, Math.min(100, (clamped / TIMELINE_WINDOW_DAYS) * 100));
  const barColor =
    gap.severity === 'critical' ? 'bg-danger' : gap.severity === 'medium' ? 'bg-warn' : 'bg-accent';

  const statusLabel = isOverdue
    ? 'متأخر'
    : gap.severity === 'critical'
      ? 'حرج'
      : gap.severity === 'medium'
        ? 'متوسط'
        : 'منخفض';
  const statusBgColor =
    isOverdue || gap.severity === 'critical'
      ? 'bg-danger/10 border-danger/40 text-danger'
      : gap.severity === 'medium'
        ? 'bg-warn-soft border-warn/40 text-warn-strong'
        : 'bg-accent-soft border-accent/30 text-accent-strong';

  return (
    <div
      className="border border-rule bg-white px-4 py-3"
      role="region"
      aria-label={`${gap.titleAr} - ${statusLabel}`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <div
              className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-bold tracking-widest ${statusBgColor}`}
              role="status"
              aria-label={statusLabel}
              title={
                isOverdue
                  ? 'متأخر عن الموعد'
                  : gap.severity === 'critical'
                    ? 'حرج — تحرّك الآن'
                    : gap.severity === 'medium'
                      ? 'متوسط — هذا الشهر'
                      : 'منخفض — للعلم'
              }
            >
              <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
              {statusLabel}
            </div>
          </div>
          <div className="font-display text-sm font-extrabold text-ink">{gap.titleAr}</div>
          {gap.dueDate && (
            <div className="mt-0.5 font-mono text-[11px] text-muted" dir="ltr">
              {gap.dueDate}
            </div>
          )}
        </div>
        <div
          className={`shrink-0 font-display text-lg font-extrabold tabular-nums ${
            isOverdue
              ? 'text-danger'
              : gap.severity === 'medium'
                ? 'text-warn-strong'
                : 'text-ink-2'
          }`}
        >
          {days === 0 ? (
            <span className="text-base">اليوم</span>
          ) : (
            <>
              {isOverdue ? `-${Math.abs(days)}` : `+${days}`}
              <span className="text-[10px] font-medium text-muted"> يوم</span>
            </>
          )}
        </div>
      </div>
      <div className="relative mt-3 h-1.5 overflow-hidden bg-paper-2">
        {isOverdue && <div aria-hidden className="absolute inset-y-0 start-0 w-1/6 bg-danger/40" />}
        <div
          aria-hidden
          className={`absolute inset-y-0 ${barColor}`}
          style={{
            insetInlineEnd: 0,
            width: `${pct}%`,
          }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------------- */
/* 3. Alerts                                                                  */
/* ------------------------------------------------------------------------- */

const CATEGORY_LABEL: Record<OperationalGap['category'], string> = {
  municipal: 'البلدية',
  civil_defense: 'الدفاع المدني',
  sfda: 'الغذاء والدواء',
  cr: 'السجل التجاري',
  labor: 'العمل والنطاقات',
  lease: 'عقد الإيجار',
  extinguishers: 'الطفايات والسلامة',
  ventilation: 'التهوية والشفط',
  refrigeration: 'التبريد',
  hygiene: 'الشهادات الصحية',
  signage: 'لوحة المحل',
};

function OperationalAlerts({ report }: { report: OperationalReport }) {
  if (report.gaps.length === 0) return null;
  const critical = report.gaps.filter((g) => g.severity === 'critical');
  const medium = report.gaps.filter((g) => g.severity === 'medium');
  const low = report.gaps.filter((g) => g.severity === 'low');

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          التنبيهات التشغيلية
        </h2>
        <span className="font-mono text-xs text-muted">
          {report.gaps.length.toString().padStart(2, '0')} تنبيه
        </span>
      </div>
      <div className="rule mb-6" />
      <div className="space-y-5">
        {critical.length > 0 && (
          <AlertGroup title="حرج — تحرّك الآن" items={critical} tone="danger" />
        )}
        {medium.length > 0 && <AlertGroup title="متوسط — هذا الشهر" items={medium} tone="warn" />}
        {low.length > 0 && <AlertGroup title="للعلم" items={low} tone="info" />}
      </div>
    </section>
  );
}

function AlertGroup({
  title,
  items,
  tone,
}: {
  title: string;
  items: OperationalGap[];
  tone: 'danger' | 'warn' | 'info';
}) {
  const style =
    tone === 'danger'
      ? { bar: 'bg-danger', label: 'text-danger', bgColor: 'bg-danger/10 border-danger/40' }
      : tone === 'warn'
        ? { bar: 'bg-warn', label: 'text-warn-strong', bgColor: 'bg-warn-soft border-warn/40' }
        : { bar: 'bg-ink-2/30', label: 'text-ink-2', bgColor: 'bg-paper-2 border-rule' };
  const severityMap = {
    danger: 'حرج',
    warn: 'متوسط',
    info: 'منخفض',
  };
  return (
    <div>
      <div className={`eyebrow mb-2 ${style.label}`}>{title}</div>
      <ul className="space-y-3">
        {items.map((g) => (
          <li
            key={g.id}
            className="grid grid-cols-[6px_1fr] overflow-hidden border border-rule bg-white"
            role="region"
            aria-label={`${g.titleAr} - ${severityMap[tone]}`}
          >
            <div className={style.bar} aria-hidden title={severityMap[tone]} />
            <div className="px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-[11px] font-bold tracking-widest ${style.bgColor} ${style.label}`}
                      role="status"
                      aria-label={severityMap[tone]}
                      title={
                        tone === 'danger'
                          ? 'حرج — تحرّك الآن'
                          : tone === 'warn'
                            ? 'متوسط — هذا الشهر'
                            : 'منخفض — للعلم'
                      }
                    >
                      <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
                      {severityMap[tone]}
                    </div>
                  </div>
                  <h3 className="font-display text-lg font-extrabold leading-tight tracking-tight text-ink">
                    {g.titleAr}
                  </h3>
                </div>
                <span className="shrink-0 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {CATEGORY_LABEL[g.category]}
                </span>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{g.explanationAr}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                <span className="font-semibold text-ink">
                  <span className="text-muted">الإجراء — </span>
                  {g.actionAr}
                </span>
                {g.officialUrl && (
                  <a
                    href={g.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-accent hover:text-accent-strong"
                  >
                    افتح البوابة ↗
                  </a>
                )}
                {typeof g.fineCeilingSar === 'number' && g.fineCeilingSar > 0 && (
                  <span className="font-mono text-[11px] text-muted">
                    سقف غرامة: {g.fineCeilingSar.toLocaleString('en-US')} ريال
                  </span>
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
