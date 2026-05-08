'use client';

import { useState } from 'react';
import type { AgentCardData } from './data';
import { AGENT_GROUP_LABEL, AGENTS_CATALOG, ENGINE_LABEL, ENGINE_TONE } from './data';

const GROUP_ACCENT: Record<AgentCardData['group'], string> = {
  flow: 'border-accent/40 bg-accent-soft text-accent-strong',
  analysis: 'border-ink/30 bg-paper-2 text-ink',
  shop: 'border-accent/30 bg-accent-soft text-accent-strong',
  tax: 'border-warn/40 bg-warn-soft text-warn-strong',
};

/** Quick lookup map for translating agent IDs to Arabic labels in workflow chips. */
const ID_TO_NAME = new Map(AGENTS_CATALOG.map((a) => [a.id, a.nameAr] as const));

export function AgentCard({ agent, index }: { agent: AgentCardData; index: number }) {
  const [expanded, setExpanded] = useState(false);

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

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span
          className={`inline-flex items-center gap-1 border px-2 py-0.5 text-[10px] font-bold tracking-widest ${ENGINE_TONE[agent.engine]}`}
          title="Engine — كيف يتخذ القرار"
        >
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current" />
          {ENGINE_LABEL[agent.engine]}
        </span>
        <span
          className="inline-flex items-center border border-rule bg-paper-2 px-2 py-0.5 font-mono text-[10px] text-muted"
          title="Wave — متى يتنفّذ"
        >
          Wave {agent.workflow.wave}
        </span>
      </div>

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

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-4 flex w-full items-center justify-between border-t border-rule pt-4 text-xs font-bold uppercase tracking-widest text-accent hover:text-accent-strong"
        aria-expanded={expanded}
      >
        <span>كيف يشتغل (workflow)</span>
        <span aria-hidden className={`transition-transform ${expanded ? 'rotate-180' : ''}`}>
          ⌄
        </span>
      </button>

      {expanded && (
        <div className="mt-4 space-y-4 border-t border-rule pt-4">
          <WorkflowSection title="Inputs — يقرأ" items={agent.workflow.inputs} />
          <WorkflowSection title="Outputs — يُنتج" items={agent.workflow.outputs} />
          {agent.workflow.dependsOn && agent.workflow.dependsOn.length > 0 && (
            <AgentChips title="ينتظر إشارة من" ids={agent.workflow.dependsOn} />
          )}
          {agent.workflow.notifies && agent.workflow.notifies.length > 0 && (
            <AgentChips title="يبلّغ" ids={agent.workflow.notifies} />
          )}
          <div className="text-[11px] text-muted">
            <span className="font-mono" dir="ltr">
              source: {agent.sourcePath}
            </span>
          </div>
        </div>
      )}
    </article>
  );
}

function WorkflowSection({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">{title}</div>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex items-start gap-2 text-xs leading-relaxed text-ink-2">
            <span aria-hidden className="mt-1 font-mono text-accent">
              ›
            </span>
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AgentChips({ title, ids }: { title: string; ids: string[] }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">{title}</div>
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <span
            key={id}
            className="border border-ink bg-paper-2 px-2 py-0.5 font-display text-[11px] font-bold text-ink"
          >
            {ID_TO_NAME.get(id as Parameters<typeof ID_TO_NAME.get>[0]) ?? id}
          </span>
        ))}
      </div>
    </div>
  );
}
