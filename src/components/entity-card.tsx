import type { GovEntity } from '@/knowledge/entities';

/**
 * Editorial entity card — numbered step, hairline rules, RTL-correct arrows.
 */
export function EntityCard({ entity, step }: { entity: GovEntity; step: number }) {
  const costLabel =
    entity.estimatedCostSar.max === 0
      ? 'مجاني'
      : entity.estimatedCostSar.min === entity.estimatedCostSar.max
        ? `~${entity.estimatedCostSar.max.toLocaleString('en-US')} ريال`
        : `${entity.estimatedCostSar.min.toLocaleString('en-US')} – ${entity.estimatedCostSar.max.toLocaleString('en-US')} ريال`;

  return (
    <article className="relative border border-rule bg-white px-5 py-5 md:px-6 md:py-6">
      <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 md:gap-x-8">
        {/* Step number — display type, editorial */}
        <div className="font-display text-4xl font-extrabold tabular-nums leading-none text-accent md:text-5xl">
          {String(step).padStart(2, '0')}
        </div>

        {/* Title + regulator name */}
        <div className="min-w-0">
          <h3 className="font-display text-xl font-extrabold leading-tight tracking-tight md:text-2xl">
            {entity.nameSimpleAr}
          </h3>
          <p className="mt-1 text-xs text-muted">{entity.nameAr}</p>
        </div>

        {/* Explanation — spans the whole row beneath */}
        <div className="col-span-2">
          <p className="text-sm leading-relaxed text-ink-2">{entity.explainAr}</p>
        </div>

        {/* Metadata grid — tighter gutters on mobile so long cost strings don't overflow. */}
        <dl className="col-span-2 mt-2 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-rule pt-4 md:grid-cols-4 md:gap-x-6">
          <MetaItem label="التكلفة" value={costLabel} note="تقديري — راجع الجهة" />
          <MetaItem label="المدة" value={entity.estimatedTimeAr} />
          {entity.renewalPeriodAr && <MetaItem label="التجديد" value={entity.renewalPeriodAr} />}
          {entity.officialUrl && (
            <div>
              <div className="font-mono text-[11px] uppercase tracking-widest text-muted">البوابة</div>
              <a
                href={entity.officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-accent hover:text-accent-strong"
              >
                <span>اذهب للجهة</span>
                <span aria-hidden className="text-xs">↗</span>
              </a>
            </div>
          )}
        </dl>

        {/* Cautions */}
        {entity.criticalWarningAr && (
          <div className="col-span-2 mt-1 flex items-start gap-3 border-s-2 border-warn bg-warn-soft/70 px-4 py-3 text-sm text-ink">
            <span className="shrink-0 font-mono text-xs tracking-widest text-warn-strong">تنبيه</span>
            <span>{entity.criticalWarningAr}</span>
          </div>
        )}
        {entity.commonMistakeAr && (
          <div className="col-span-2 flex items-start gap-3 text-xs text-muted">
            <span className="font-mono tracking-widest text-accent">شائع</span>
            <span>{entity.commonMistakeAr}</span>
          </div>
        )}
      </div>
    </article>
  );
}

function MetaItem({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <div className="min-w-0">
      <div className="font-mono text-xs uppercase tracking-widest text-muted">{label}</div>
      <div className="mt-1 break-words font-display text-sm font-extrabold leading-tight tracking-tight">
        {value}
      </div>
      {note && <div className="mt-0.5 text-xs text-muted">{note}</div>}
    </div>
  );
}
