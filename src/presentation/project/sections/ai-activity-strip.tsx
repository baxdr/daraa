/**
 * AI activity strip — compact summary near the top of the project page.
 *
 * Surfaces the agent run-stats as a small editorial banner so visitors
 * see the AI footprint immediately. Scrolls to the full trace section
 * (#agent-traces) on click. Hidden when no traces are present (e.g. when
 * Claude wasn't reachable for any agent).
 */

import type { AgentTraceLike } from '@/agents/runtime/types';
import type { AgentId } from '@/agents/types';

export function AiActivityStrip({ traces }: { traces: Partial<Record<AgentId, AgentTraceLike>> }) {
  const entries = (Object.entries(traces) as Array<[AgentId, AgentTraceLike]>).filter(([, t]) =>
    Boolean(t),
  );
  if (entries.length === 0) return null;

  const totalTokens = entries.reduce(
    (sum, [, t]) => sum + t.totalInputTokens + t.totalOutputTokens,
    0,
  );
  const totalLatency = entries.reduce((sum, [, t]) => sum + t.totalLatencyMs, 0);
  const liveCount = entries.filter(([, t]) => t.mode === 'live').length;
  const totalToolCalls = entries.reduce(
    (sum, [, t]) => sum + t.iterations.reduce((s, it) => s + it.toolCalls.length, 0),
    0,
  );

  return (
    <a
      href="#agent-traces"
      className="group mb-8 flex flex-wrap items-center justify-between gap-4 border-s-4 border-accent bg-accent-soft px-5 py-4 transition-all hover:bg-accent-soft/80 md:px-6"
    >
      <div className="flex items-center gap-3">
        <span aria-hidden className="h-2 w-2 rounded-full bg-accent" />
        <div>
          <div className="font-display text-sm font-extrabold text-ink md:text-base">
            <span className="text-accent-strong">{entries.length}</span> ايجنت AI اشتغل لتقريرك
          </div>
          <div className="mt-0.5 font-mono text-[10px] text-accent-strong/70" dir="ltr">
            {liveCount} live · {totalToolCalls} tool calls · {totalTokens.toLocaleString('en-US')}{' '}
            tokens · {(totalLatency / 1000).toFixed(1)}s
          </div>
        </div>
      </div>
      <span className="font-mono text-[11px] text-accent-strong group-hover:underline">
        شف التفاصيل ↓
      </span>
    </a>
  );
}
