/**
 * Replay — re-run a recorded RunRecord against the same context.
 *
 * Useful for:
 *   - Regression debugging: load a record from prod, replay locally.
 *   - A/B testing specialists: replace one agent with a candidate, see what changes.
 *   - Determinism check: if a specialist's output drifts between runs of the
 *     same context, the diff highlights it.
 *
 * What replay does NOT do:
 *   - Restore wall-clock state (Date.now, random seeds). Specialists that
 *     depend on those will produce different output. That's a known limit;
 *     deterministic specialists are the target audience.
 *   - Reconstruct external services (web search, LLM calls). Whatever the
 *     replaced specialist calls in real-time happens for real.
 */

import type { Agent } from '../types';
import type { AgentId } from '../../types';
import { runAgents } from '../orchestrator-runtime';
import type { RunRecord } from '../telemetry/types';
import { makeRecorder } from '../telemetry/recorder';
import { diffResults, type ResultDiff } from './diff';

export interface ReplayOptions {
  /** Optional substitute for one agent — useful for A/B testing a candidate. */
  replacement?: { agentId: AgentId; agent: Agent };
}

export interface ReplayOutcome {
  originalRunId: string;
  replayRunId: string;
  diff: ResultDiff;
  /** True iff every agent's result was deeply equal between the two runs. */
  identical: boolean;
}

/**
 * Replay a recorded run by re-running the SAME set of agents with the SAME
 * context. The caller provides the agent factory because we don't want
 * to persist live class instances in RunRecord.
 */
export async function replayRun(
  record: RunRecord,
  agentFactory: (id: AgentId) => Agent,
  opts: ReplayOptions = {},
): Promise<ReplayOutcome> {
  const agents: Agent[] = record.agentIds.map((id) => {
    if (opts.replacement && opts.replacement.agentId === id) {
      return opts.replacement.agent;
    }
    return agentFactory(id);
  });

  const recorder = makeRecorder(record.context, record.agentIds);
  await runAgents(agents, record.context, recorder.hooks);
  const newRecord = recorder.finish();

  const diff = diffResults(record.finalResults, newRecord.finalResults);
  const identical =
    diff.changed.length === 0 &&
    diff.missingFromReplay.length === 0 &&
    diff.newInReplay.length === 0;

  return {
    originalRunId: record.runId,
    replayRunId: newRecord.runId,
    diff,
    identical,
  };
}
