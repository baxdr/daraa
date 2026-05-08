import type { AgentCardData, AgentEngine } from './data';
import { AGENTS_CATALOG, ENGINE_LABEL } from './data';

/**
 * Workflow diagram — three-lane visual showing how an agent runs.
 *
 *   ┌────────────┐    ┌──────────────┐    ┌────────────┐
 *   │ TRIGGERS   │ →  │   AGENT     │ →  │ EMISSIONS  │
 *   │ inbox/ctx  │    │   run()     │    │ outbox     │
 *   └────────────┘    └──────────────┘    └────────────┘
 *
 * Pulls data straight from AGENTS_CATALOG so the diagram never drifts.
 * Engine type drives both the icon and the colour theme.
 */

const ID_TO_NAME = new Map(AGENTS_CATALOG.map((a) => [a.id, a.nameAr] as const));

const ENGINE_ICON: Record<AgentEngine, JSX.Element> = {
  orchestrator: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="2" />
      <circle cx="5" cy="5" r="1.5" />
      <circle cx="19" cy="5" r="1.5" />
      <circle cx="5" cy="19" r="1.5" />
      <circle cx="19" cy="19" r="1.5" />
      <path d="M6 6 L11 11 M18 6 L13 11 M6 18 L11 13 M18 18 L13 13" />
    </svg>
  ),
  claude_llm: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6 a2 2 0 0 1 2 -2 h12 a2 2 0 0 1 2 2 v8 a2 2 0 0 1 -2 2 h-7 l-4 4 v-4 h-1 a2 2 0 0 1 -2 -2 z" />
      <path d="M9 10 h6 M9 13 h4" />
    </svg>
  ),
  claude_web_search: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="6" />
      <path d="M11 5 a8 6 0 0 1 0 12 M11 5 a8 6 0 0 0 0 12 M5 11 h12" />
      <path d="M16 16 L20 20" />
    </svg>
  ),
  deterministic: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3 v2 M12 19 v2 M3 12 h2 M19 12 h2 M5.6 5.6 l1.4 1.4 M17 17 l1.4 1.4 M5.6 18.4 l1.4 -1.4 M17 7 l1.4 -1.4" />
    </svg>
  ),
  inbox_driven: (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 7 h18 v10 H3 z" />
      <path d="M3 7 L12 14 L21 7" />
      <path d="M7 17 L7 21 M17 17 L17 21" />
    </svg>
  ),
};

const ENGINE_THEME: Record<
  AgentEngine,
  { bg: string; border: string; text: string; ring: string }
> = {
  orchestrator: {
    bg: 'bg-ink',
    border: 'border-ink',
    text: 'text-paper',
    ring: 'ring-ink/20',
  },
  claude_llm: {
    bg: 'bg-accent',
    border: 'border-accent',
    text: 'text-paper',
    ring: 'ring-accent/30',
  },
  claude_web_search: {
    bg: 'bg-accent',
    border: 'border-accent',
    text: 'text-paper',
    ring: 'ring-accent/30',
  },
  deterministic: {
    bg: 'bg-warn-strong',
    border: 'border-warn-strong',
    text: 'text-paper',
    ring: 'ring-warn/30',
  },
  inbox_driven: {
    bg: 'bg-warn-strong',
    border: 'border-warn-strong',
    text: 'text-paper',
    ring: 'ring-warn/30',
  },
};

export function WorkflowDiagram({ agent }: { agent: AgentCardData }) {
  const theme = ENGINE_THEME[agent.engine];
  const triggers = buildTriggerCards(agent);
  const emissions = buildEmissionCards(agent);

  return (
    <div className="mt-4 border-t border-rule pt-5">
      <div className="mb-4 flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          الـ workflow
        </span>
        <a
          href={`https://github.com/baxdr/daraa/blob/main/${agent.sourcePath}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-[10px] text-muted hover:text-accent"
          dir="ltr"
        >
          {agent.sourcePath} ↗
        </a>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch gap-3">
        {/* Triggers lane (RTL-right side: visually first) */}
        <div className="flex flex-col gap-2">
          <LaneHeader label="يستقبل" sublabel="TRIGGERS" />
          {triggers.length === 0 ? (
            <EmptyEnvelope />
          ) : (
            triggers.map((t, i) => <Envelope key={i} {...t} side="from" />)
          )}
        </div>

        {/* Agent core */}
        <div className="flex flex-col items-center justify-center px-1">
          <Connector />
          <div
            className={`relative flex w-[120px] flex-col items-center justify-center border-2 ${theme.border} ${theme.bg} ${theme.text} px-3 py-4 shadow-[4px_4px_0_0_rgba(28,25,23,0.18)] ring-4 ${theme.ring}`}
          >
            <div className="mb-1.5">{ENGINE_ICON[agent.engine]}</div>
            <div className="text-center font-display text-sm font-extrabold leading-tight">
              {agent.nameAr}
            </div>
            <div className="mt-1 text-center font-mono text-[9px] uppercase tracking-widest opacity-80">
              run()
            </div>
            <div className="border-current/30 mt-2 border-t pt-1.5 text-center font-mono text-[9px] uppercase tracking-widest opacity-80">
              {ENGINE_LABEL[agent.engine]}
            </div>
          </div>
          <Connector />
        </div>

        {/* Emissions lane */}
        <div className="flex flex-col gap-2">
          <LaneHeader label="يبثّ" sublabel="EMISSIONS" />
          {emissions.length === 0 ? (
            <EmptyEnvelope />
          ) : (
            emissions.map((e, i) => <Envelope key={i} {...e} side="to" />)
          )}
        </div>
      </div>

      <div className="mt-4 border-t border-rule/50 pt-3 text-[11px] leading-relaxed text-ink-2">
        <span className="font-bold text-ink">المنطق: </span>
        {agent.workflow.outputs.join(' · ')}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Building blocks                                                    */
/* ────────────────────────────────────────────────────────────────── */

function LaneHeader({ label, sublabel }: { label: string; sublabel: string }) {
  return (
    <div className="mb-1 border-b border-rule/60 pb-1.5">
      <div className="font-display text-[11px] font-extrabold tracking-tight text-ink">{label}</div>
      <div className="font-mono text-[9px] uppercase tracking-widest text-muted">{sublabel}</div>
    </div>
  );
}

interface EnvelopeProps {
  partner?: string; // agent name (translated) or "ALL" / "context"
  partnerKind: 'agent' | 'context' | 'broadcast' | 'user' | 'system';
  body: string;
  side: 'from' | 'to';
}

function Envelope({ partner, partnerKind, body, side }: EnvelopeProps) {
  const partnerStyle =
    partnerKind === 'broadcast'
      ? 'bg-ink text-paper'
      : partnerKind === 'agent'
        ? 'bg-accent-soft text-accent-strong border border-accent/30'
        : partnerKind === 'user'
          ? 'bg-warn-soft text-warn-strong border border-warn/30'
          : 'bg-paper-2 text-ink-2 border border-rule';

  return (
    <div className="group relative border border-rule bg-white p-2 transition-colors hover:border-ink">
      <div className="flex items-baseline justify-between gap-2">
        <span
          className={`px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-widest ${partnerStyle}`}
        >
          {side === 'from' ? '← ' : '→ '}
          {partner ?? '—'}
        </span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-ink">{body}</p>
    </div>
  );
}

function EmptyEnvelope() {
  return (
    <div className="border border-dashed border-rule bg-paper-2/30 p-3 text-center font-mono text-[10px] text-muted">
      —
    </div>
  );
}

function Connector() {
  return (
    <svg aria-hidden width="20" height="14" viewBox="0 0 20 14" className="text-rule" fill="none">
      <path d="M2 7 L18 7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 3" />
    </svg>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* Data adapters                                                      */
/* ────────────────────────────────────────────────────────────────── */

function buildTriggerCards(agent: AgentCardData): EnvelopeProps[] {
  const cards: EnvelopeProps[] = [];

  // Each agent it depends on becomes a "← from agent_name" card.
  for (const depId of agent.workflow.dependsOn ?? []) {
    cards.push({
      partner: ID_TO_NAME.get(depId as Parameters<typeof ID_TO_NAME.get>[0]) ?? depId,
      partnerKind: 'agent',
      body: bodyForDependency(agent.id, depId),
      side: 'from',
    });
  }

  // Plain inputs (chat data, context) — not from another agent.
  for (const input of agent.workflow.inputs) {
    if (input.toLowerCase().includes('inbox')) continue; // already covered by dependsOn
    const partnerKind: EnvelopeProps['partnerKind'] =
      input.includes('chat') || input.includes('user') ? 'user' : 'context';
    cards.push({
      partner: partnerKind === 'user' ? 'المستخدم' : 'context',
      partnerKind,
      body: input,
      side: 'from',
    });
  }

  return cards;
}

function buildEmissionCards(agent: AgentCardData): EnvelopeProps[] {
  const cards: EnvelopeProps[] = [];

  // The first output is usually "produces an EntityInfo" — render as a "self" card.
  const entityOutput = agent.workflow.outputs.find(
    (o) => o.toLowerCase().includes('entityinfo') || o.toLowerCase().includes('entity'),
  );
  if (entityOutput) {
    cards.push({
      partner: 'تقرير المحل',
      partnerKind: 'system',
      body: entityOutput,
      side: 'to',
    });
  }

  // Each notified agent becomes a "→ to agent_name" card.
  for (const notifyId of agent.workflow.notifies ?? []) {
    cards.push({
      partner: ID_TO_NAME.get(notifyId as Parameters<typeof ID_TO_NAME.get>[0]) ?? notifyId,
      partnerKind: 'agent',
      body: bodyForEmission(agent.id, notifyId),
      side: 'to',
    });
  }

  // Broadcast outputs (ALL).
  for (const o of agent.workflow.outputs) {
    if (/all/i.test(o) || /يبثّ/.test(o)) {
      cards.push({
        partner: 'ALL',
        partnerKind: 'broadcast',
        body: o,
        side: 'to',
      });
      break;
    }
  }

  // If nothing accumulated yet, show all outputs as system events.
  if (cards.length === 0) {
    for (const o of agent.workflow.outputs) {
      cards.push({
        partner: 'تقرير المحل',
        partnerKind: 'system',
        body: o,
        side: 'to',
      });
    }
  }

  return cards;
}

/** Hand-tuned message labels — surfaces the actual payload key the agent reads. */
function bodyForDependency(agentId: string, depId: string): string {
  if (depId === 'mci') return 'crReady: true';
  if (depId === 'civil_defense') return 'safetyCertReady + hasKitchen';
  if (depId === 'municipality') return 'licenceLabel + pending-issuance';
  return `إشارة من ${depId}`;
}

function bodyForEmission(agentId: string, notifyId: string): string {
  if (agentId === 'mci') return 'crReady: true';
  if (agentId === 'civil_defense' && notifyId === 'municipality')
    return 'hasKitchen + safetyCertReady';
  if (agentId === 'municipality' && notifyId === 'sfda') return 'licenceLabel + hasKitchen';
  if (agentId === 'municipality' && notifyId === 'moh') return 'licenceLabel';
  if (agentId === 'mohr_gosi') return 'nitaqatZone warning';
  if (agentId === 'sfda' && notifyId === 'mohr_gosi') return 'foodHandlerCertsRequired';
  if (agentId === 'moh' && notifyId === 'mohr_gosi') return 'staffNeedHealthCerts';
  if (agentId === 'orchestrator') return 'استدعاء متسلسل';
  if (agentId === 'research') return 'research update message';
  return 'رسالة';
}
