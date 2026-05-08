import type { AgentCardData } from './data';
import { AGENT_GROUP_LABEL } from './data';

const GROUP_ACCENT: Record<AgentCardData['group'], string> = {
  flow: 'border-accent/40 bg-accent-soft text-accent-strong',
  analysis: 'border-ink/30 bg-paper-2 text-ink',
  shop: 'border-accent/30 bg-accent-soft text-accent-strong',
  tax: 'border-warn/40 bg-warn-soft text-warn-strong',
};

export function AgentCard({ agent, index }: { agent: AgentCardData; index: number }) {
  return (
    <article className="group relative border border-rule bg-white p-5 transition-all hover:border-ink hover:shadow-card md:p-6">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[11px] tabular-nums text-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className={`pill border text-[10px] font-bold tracking-widest ${GROUP_ACCENT[agent.group]}`}
        >
          {AGENT_GROUP_LABEL[agent.group]}
        </span>
      </div>
      <h3 className="font-display text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        {agent.nameAr}
      </h3>
      <p className="mt-1 font-mono text-[11px] tracking-wider text-muted" dir="ltr">
        {agent.id}
      </p>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">{agent.roleAr}</p>
      <div className="mt-5 border-t border-rule pt-4">
        <div className="eyebrow !text-[10px]">يُنتج</div>
        <ul className="mt-2 space-y-1.5">
          {agent.outputsAr.map((o) => (
            <li key={o} className="flex items-start gap-2 text-xs text-ink-2">
              <span aria-hidden className="mt-1 text-accent">
                ▸
              </span>
              <span>{o}</span>
            </li>
          ))}
        </ul>
      </div>
    </article>
  );
}
