/**
 * Agent reasoning traces — transparency panel.
 *
 * Renders each LLM-powered agent's tool-use loop: tools called, latency,
 * tokens, and the final reasoning text. Honest mode indicator (live vs
 * fallback) so judges/users see exactly what ran.
 */

import type { AgentTraceLike } from '@/agents/runtime/types';
import type { AgentId } from '@/agents/types';
import { AGENT_LABELS_AR } from '@/agents/types';
import { AGENTS_CATALOG } from '@/presentation/agents-catalog/data';

const MODE_BADGE: Record<AgentTraceLike['mode'], { label: string; tone: string }> = {
  live: { label: 'AI — حيّ', tone: 'border-accent/40 bg-accent-soft text-accent-strong' },
  fallback: {
    label: 'fallback — كود ثابت',
    tone: 'border-warn/40 bg-warn-soft text-warn-strong',
  },
};

const WAVE_BY_AGENT = new Map<AgentId, number>(
  AGENTS_CATALOG.map((a) => [a.id, a.workflow.wave] as const),
);
const SOURCE_BY_AGENT = new Map<AgentId, string>(
  AGENTS_CATALOG.map((a) => [a.id, a.sourcePath] as const),
);

export function AgentTracesSection({
  traces,
}: {
  traces: Partial<Record<AgentId, AgentTraceLike>>;
}) {
  const entries = (Object.entries(traces) as Array<[AgentId, AgentTraceLike]>).filter(([, t]) =>
    Boolean(t),
  );
  if (entries.length === 0) return null;

  // Sort by execution wave so the trace reads in pipeline order.
  entries.sort(([a], [b]) => (WAVE_BY_AGENT.get(a) ?? 99) - (WAVE_BY_AGENT.get(b) ?? 99));

  const totalTokens = entries.reduce(
    (sum, [, t]) => sum + t.totalInputTokens + t.totalOutputTokens,
    0,
  );
  const totalLatency = entries.reduce((sum, [, t]) => sum + t.totalLatencyMs, 0);
  const liveCount = entries.filter(([, t]) => t.mode === 'live').length;
  const fallbackCount = entries.length - liveCount;
  const totalToolCalls = entries.reduce(
    (sum, [, t]) => sum + t.iterations.reduce((s, it) => s + it.toolCalls.length, 0),
    0,
  );

  return (
    <section id="agent-traces" className="mb-12 scroll-mt-12">
      <div className="mb-6">
        <span className="eyebrow">شفافية الذكاء الاصطناعي</span>
        <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          كيف فكّر الـ AI في تقريرك
        </h2>
        <div className="rule-accent mt-3 w-12" />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
          كل ايجنت AI يستدعي أدوات deterministic للحقائق، ثم يصيغ تفسيراً عربياً. هنا تشوف بالضبط
          ماذا سأل، ماذا رجّعت له الأدوات، وكم استهلك من tokens + وقت.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-0 border border-rule bg-paper-2/40 sm:grid-cols-5">
        <Stat label="ايجنت LLM" value={String(entries.length)} />
        <Stat label="حيّ / fallback" value={`${liveCount} / ${fallbackCount}`} />
        <Stat label="استدعاء tools" value={String(totalToolCalls)} />
        <Stat label="إجمالي tokens" value={totalTokens.toLocaleString('en-US')} />
        <Stat label="الزمن الكلي" value={`${(totalLatency / 1000).toFixed(1)}s`} last />
      </div>

      <div className="space-y-4">
        {entries.map(([agentId, trace]) => (
          <TraceCard key={agentId} agentId={agentId} trace={trace} />
        ))}
      </div>
    </section>
  );
}

function TraceCard({ agentId, trace }: { agentId: AgentId; trace: AgentTraceLike }) {
  const label = AGENT_LABELS_AR[agentId] ?? agentId;
  const badge = MODE_BADGE[trace.mode];
  const totalToolCalls = trace.iterations.reduce((s, it) => s + it.toolCalls.length, 0);
  const wave = WAVE_BY_AGENT.get(agentId);
  const source = SOURCE_BY_AGENT.get(agentId);

  return (
    <details className="group border border-rule bg-white">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-4 hover:bg-paper-2/40 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          {wave !== undefined && (
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted" dir="ltr">
              wave {wave}
            </span>
          )}
          <span className="font-display text-base font-extrabold text-ink md:text-lg">{label}</span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted" dir="ltr">
            {agentId}
          </span>
          <span className={`pill border text-[10px] font-bold tracking-widest ${badge.tone}`}>
            {badge.label}
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted" dir="ltr">
          <span className="font-mono tabular-nums">{trace.iterations.length} round</span>
          <span className="font-mono tabular-nums">{totalToolCalls} tools</span>
          <span className="font-mono tabular-nums">
            {(trace.totalInputTokens + trace.totalOutputTokens).toLocaleString('en-US')} tok
          </span>
          <span className="font-mono tabular-nums">{trace.totalLatencyMs}ms</span>
          <span className="text-ink-2 transition-transform group-open:rotate-180">⌄</span>
        </div>
      </summary>

      {trace.fallbackReason && (
        <div className="border-t border-rule bg-warn-soft px-4 py-3 text-xs text-warn-strong md:px-5">
          <span className="font-bold">سبب الرجوع للـ fallback:</span> {trace.fallbackReason}
        </div>
      )}

      {trace.iterations.length === 0 ? (
        <div className="border-t border-rule p-4 text-xs text-muted md:p-5">
          ما تم استدعاء نموذج AI — استخدمنا المسار الـ deterministic فقط.
        </div>
      ) : (
        <div className="border-t border-rule">
          {trace.iterations.map((it, idx) => (
            <IterationBlock key={idx} index={idx} iteration={it} />
          ))}
        </div>
      )}

      {trace.finalText && (
        <div className="border-t border-rule bg-paper-2/40 p-4 md:p-5">
          <div className="eyebrow !text-[10px]">المخرج النهائي للايجنت</div>
          <pre
            className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-ink-2"
            dir="ltr"
          >
            {trace.finalText}
          </pre>
        </div>
      )}

      {source && (
        <div className="border-t border-rule px-4 py-2.5 text-right md:px-5">
          <a
            href={`https://github.com/baxdr/daraa/blob/main/${source}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[10px] text-muted hover:text-accent"
            dir="ltr"
          >
            view source: {source} ↗
          </a>
        </div>
      )}
    </details>
  );
}

function IterationBlock({
  index,
  iteration,
}: {
  index: number;
  iteration: AgentTraceLike['iterations'][number];
}) {
  return (
    <div className="border-b border-rule p-4 last:border-b-0 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Round {String(index + 1).padStart(2, '0')}
        </span>
        <div className="flex gap-3 text-[10px] text-muted" dir="ltr">
          <span className="font-mono tabular-nums">in {iteration.inputTokens}</span>
          <span className="font-mono tabular-nums">out {iteration.outputTokens}</span>
          <span className="font-mono tabular-nums">{iteration.latencyMs}ms</span>
          <span className="font-mono tabular-nums">stop: {iteration.stopReason}</span>
        </div>
      </div>

      {iteration.reasoning && (
        <div className="mb-3 border-s-2 border-ink/20 ps-3">
          <p className="text-[11px] leading-relaxed text-ink-2">{iteration.reasoning}</p>
        </div>
      )}

      {iteration.toolCalls.length > 0 && (
        <div className="space-y-2">
          {iteration.toolCalls.map((call, i) => (
            <div
              key={i}
              className={`border ${call.errored ? 'border-warn/40 bg-warn-soft' : 'border-rule bg-paper-2/40'} p-3`}
            >
              <div className="mb-1 flex items-baseline justify-between gap-2">
                <span className="font-mono text-[11px] font-bold text-ink" dir="ltr">
                  {call.name}()
                </span>
                <span className="font-mono text-[10px] text-muted" dir="ltr">
                  {call.durationMs}ms
                </span>
              </div>
              {Object.keys(call.input).length > 0 && (
                <pre
                  className="mb-1 overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px] text-muted"
                  dir="ltr"
                >
                  → {JSON.stringify(call.input)}
                </pre>
              )}
              <pre
                className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[10px] text-ink-2"
                dir="ltr"
              >
                ← {JSON.stringify(call.output).slice(0, 600)}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`px-4 py-3 md:px-5 md:py-4 ${
        last ? '' : 'border-b border-rule sm:border-b-0 sm:border-s'
      }`}
    >
      <div className="font-display text-2xl font-extrabold tabular-nums leading-none tracking-tight text-ink md:text-3xl">
        {value}
      </div>
      <div className="mt-1.5 text-[11px] text-ink-2">{label}</div>
    </div>
  );
}
