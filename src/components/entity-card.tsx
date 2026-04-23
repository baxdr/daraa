import type { GovEntity } from '@/knowledge/entities';
import type { AgentMessage } from '@/agents/types';
import { AGENT_LABELS_AR } from '@/agents/types';

/**
 * Editorial entity card — numbered step, hairline rules, RTL-correct arrows.
 *
 * When A2A messages are passed, they render as a small inbox/outbox feed
 * at the bottom of the card so the user can see which other agents this
 * one actually talked to.
 */
export function EntityCard({
  entity,
  step,
  incoming,
  outgoing,
}: {
  entity: GovEntity;
  step: number;
  incoming?: AgentMessage[];
  outgoing?: AgentMessage[];
}) {
  const costLabel =
    entity.estimatedCostSar.max === 0
      ? 'مجاني'
      : entity.estimatedCostSar.min === entity.estimatedCostSar.max
        ? `~${entity.estimatedCostSar.max.toLocaleString('en-US')} ريال`
        : `${entity.estimatedCostSar.min.toLocaleString('en-US')} – ${entity.estimatedCostSar.max.toLocaleString('en-US')} ريال`;

  const a2aCount = (incoming?.length ?? 0) + (outgoing?.length ?? 0);

  return (
    <article className="relative border border-rule bg-white px-5 py-5 md:px-6 md:py-6">
      <div className="grid grid-cols-[auto_1fr] gap-x-5 gap-y-3 md:gap-x-8">
        {/* Step number — display type, editorial */}
        <div className="font-display text-4xl font-extrabold tabular-nums leading-none text-accent md:text-5xl">
          {String(step).padStart(2, '0')}
        </div>

        {/* Title + regulator name + status pill */}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-xl font-extrabold leading-tight tracking-tight md:text-2xl">
              {entity.nameSimpleAr}
            </h3>
            <EntityStatusPill entity={entity} />
          </div>
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

        {/* Requirements checklist — derived from the specialist agent's run. */}
        {entity.requirements && entity.requirements.length > 0 && (
          <div className="col-span-2 mt-2">
            <div className="eyebrow mb-2">المتطلبات</div>
            <ul className="space-y-1.5">
              {entity.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-2 text-[13.5px] leading-relaxed text-ink-2">
                  <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* A2A feed — which other agents talked to (or heard from) this one. */}
        {a2aCount > 0 && (
          <div className="col-span-2 mt-2 border-t border-rule pt-4">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="eyebrow">محادثة الوكلاء</div>
              <span className="font-mono text-[10px] tabular-nums text-muted">
                {a2aCount.toString().padStart(2, '0')} رسالة
              </span>
            </div>
            <ul className="space-y-1.5">
              {(incoming ?? []).map((m, i) => (
                <A2ALine key={`in-${i}`} msg={m} direction="in" />
              ))}
              {(outgoing ?? []).map((m, i) => (
                <A2ALine key={`out-${i}`} msg={m} direction="out" />
              ))}
            </ul>
          </div>
        )}
      </div>
    </article>
  );
}

/**
 * Status pill — classifies the entity by what matters most to the user. We
 * don't have a real runtime "status" (this is advisory data), so the pill
 * reflects visibility signals: a critical warning flips it to "تحذير",
 * a common-mistake note flips to "تنبّه لها", otherwise "جاهزة للبدء".
 */
function EntityStatusPill({ entity }: { entity: import('@/knowledge/entities').GovEntity }) {
  if (entity.criticalWarningAr) {
    return (
      <span className="inline-flex items-center gap-1 border border-warn/40 bg-warn-soft px-2 py-0.5 text-[11px] font-bold text-warn-strong">
        <span aria-hidden>⚠</span>
        <span>تحذير — اقرأ قبل التقديم</span>
      </span>
    );
  }
  if (entity.commonMistakeAr) {
    return (
      <span className="inline-flex items-center gap-1 border border-rule bg-paper-2 px-2 py-0.5 text-[11px] font-semibold text-ink-2">
        <span aria-hidden>ℹ</span>
        <span>نقطة شائعة للخطأ</span>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 border border-accent/30 bg-accent-soft px-2 py-0.5 text-[11px] font-bold text-accent-strong">
      <span aria-hidden>✓</span>
      <span>جاهزة للبدء</span>
    </span>
  );
}

function A2ALine({ msg, direction }: { msg: AgentMessage; direction: 'in' | 'out' }) {
  const otherLabel = direction === 'in'
    ? AGENT_LABELS_AR[msg.from] ?? msg.from
    : typeof msg.to === 'string' && msg.to !== 'ALL'
      ? (AGENT_LABELS_AR[msg.to] ?? msg.to)
      : 'جميع المتخصّصين';
  const typeLabel = typeLabelAr(msg.type);
  return (
    <li className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-2">
      <span
        aria-hidden
        className={`mt-0.5 font-mono text-[10px] tracking-widest ${
          direction === 'in' ? 'text-accent' : 'text-ink'
        }`}
      >
        {direction === 'in' ? '→ من' : '← إلى'}
      </span>
      <span>
        <span className="font-display font-extrabold tracking-tight text-ink">{otherLabel}</span>
        <span className="mx-1.5 text-muted">·</span>
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">{typeLabel}</span>
        <span className="mx-1.5 text-muted">—</span>
        <span>{msg.messageAr}</span>
      </span>
    </li>
  );
}

function typeLabelAr(t: AgentMessage['type']): string {
  switch (t) {
    case 'dependency': return 'تبعية';
    case 'data_share': return 'تبادل بيانات';
    case 'warning':    return 'تنبيه';
    case 'update':     return 'تحديث';
    case 'ack':        return 'إقرار';
  }
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
