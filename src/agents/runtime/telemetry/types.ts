/**
 * Telemetry types — what we record from a single agent run.
 *
 * These are append-only data structures. The recorder builds them up
 * incrementally as the orchestrator fires hooks. The result (`RunRecord`)
 * is consumed by:
 *   - Replay (re-run the same context, compare results).
 *   - Future Supabase sink (Phase 11) for cross-run analytics.
 *   - Debugging (load a record, inspect what each agent saw).
 *
 * Design choices:
 *   - All times are millisecond Unix timestamps (Date.now()).
 *   - `seq` is a monotonic counter PER RUN, not global — easy to merge later.
 *   - Records are JSON-serializable (no Maps, no Sets, no Date instances).
 *     The fs-sink stores them as JSON; the future supabase-sink will too.
 */

import type { AgentContext, AgentMessage, AgentResult } from '../types';
import type { AgentId } from '../../types';

export interface AgentEventRecord {
  runId: string;
  /** Monotonic counter within this run. */
  seq: number;
  ts: number;
  wave: number;
  agentId: AgentId;
  /** 'start' fires when the agent begins; 'finish' when run() returns. */
  phase: 'start' | 'finish';
  /** Only set when phase === 'finish'. Mirrors AgentResult.status. */
  status?: 'complete' | 'blocked' | 'error';
  /** Wall-clock time between start and finish for the SAME (runId, agentId, wave). */
  durationMs?: number;
  /** Only set when status === 'error'. */
  error?: string;
}

export interface MessageRecord {
  runId: string;
  seq: number;
  ts: number;
  wave: number;
  from: AgentId;
  to: AgentId | 'ALL';
  type: AgentMessage['type'];
  payload: Record<string, unknown>;
  messageAr: string;
}

export interface RunRecord {
  runId: string;
  startedAt: number;
  finishedAt?: number;
  /** Snapshot of the context the orchestrator was started with.
   *  Note: contains user answers — treat as PII when persisting beyond local fs. */
  context: AgentContext;
  /** All agents that participated (ids, in registration order). */
  agentIds: AgentId[];
  events: AgentEventRecord[];
  messages: MessageRecord[];
  /** Final outcome per agent — populated as finish events come in. */
  finalResults: Partial<Record<AgentId, AgentResult>>;
}

/** A telemetry sink stores RunRecords somewhere. */
export interface TelemetrySink {
  save(record: RunRecord): Promise<void>;
  load(runId: string): Promise<RunRecord | null>;
  list(): Promise<string[]>;
}
