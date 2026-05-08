/**
 * Real multi-agent runtime — contracts.
 *
 * Every specialist is a class that implements `Agent`. The orchestrator
 * schedules them in waves based on dependencies, delivers their outbox
 * messages through an `AgentBus`, and stops when every agent has run.
 *
 * An agent's `run()` is allowed to be *blocked* when its required inbox
 * messages haven't arrived — it returns `status: 'blocked'` and the
 * orchestrator re-tries it in a later wave. This is the difference from
 * the previous inline-emit pattern: an agent genuinely decides based on
 * what's in its inbox, not based on a hardcoded if-branch in a for-loop.
 */

import type { Answers } from '../chat-flow';
import type { VerticalId } from '@/knowledge/entities';
// Reuse the shared AgentId union so bus messages interop cleanly with the
// UI store (scan-store / plan-store). The specialists only use the entity-
// agent subset; coordination ids (orchestrator, chat, research...) flow
// through the store directly, not the bus.
export type { AgentId } from '../types';
import type { AgentId } from '../types';

/* ─── Context provided to every agent ──────────────────────────────────── */

export interface AgentContext {
  /** Small-shop operational-compliance is the only mode this product
   *  supports post-pivot. Kept as a single literal so call sites stay
   *  unambiguous and future scope additions are explicit. */
  mode: 'operational_compliance';
  vertical: VerticalId;
  answers: Answers;
  cityId?: string;
  cityLabelAr?: string;
}

/* ─── Messages on the bus ──────────────────────────────────────────────── */

export type MessageType = 'dependency' | 'data_share' | 'warning' | 'update' | 'ack';

export interface AgentMessage {
  from: AgentId;
  to: AgentId | 'ALL';
  type: MessageType;
  payload: Record<string, unknown>;
  messageAr: string;
}

/* ─── Agent's produced entity info ─────────────────────────────────────── */

export interface NameCheckResult {
  /** likely_available = searched and found no registrations;
   *  likely_taken     = found one or more registrations with the same name;
   *  inconclusive     = search ran but evidence isn't decisive;
   *  skipped          = we deliberately didn't check. */
  status: 'likely_available' | 'likely_taken' | 'inconclusive' | 'skipped';
  summaryAr: string;
  /** Short evidence snippets (search hits, URLs, quotes). */
  evidence?: string[];
  /** Suggested alternative names — populated when the original looks taken. */
  alternatives?: string[];
  checkedAt: string;
  source: 'claude_web_search' | 'fallback';
}

export interface EntityInfo {
  entityId: string;
  nameAr: string;
  nameSimpleAr: string;
  explainAr: string;
  estimatedCostSar: { min: number; max: number };
  estimatedTimeAr: string;
  officialUrl?: string;
  /** Months between consecutive renewals. null = continuous (no fixed cadence).
   *  Required so the renewal calendar can be built deterministically. */
  renewalMonths: number | null;
  /** Display-only Arabic phrase. The entity-builder re-derives it from
   *  `renewalMonths` if a specialist forgets to set it. */
  renewalPeriodAr?: string;
  criticalWarningAr?: string;
  commonMistakeAr?: string;
  requirements?: string[];
  /** Trade-name availability check — reserved field, currently unused. */
  nameCheck?: NameCheckResult;
}

/* ─── Run outcome ──────────────────────────────────────────────────────── */

/**
 * Reasoning trace emitted by LLM-powered specialists. The runtime treats
 * it as an opaque structured value — the dependency on `llm-base/types`
 * stays one-way (specialists depend on runtime, not the reverse).
 */
export interface AgentTraceLike {
  agentId: AgentId;
  mode: 'live' | 'fallback';
  model: string;
  totalLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  iterations: Array<{
    reasoning?: string;
    toolCalls: Array<{
      name: string;
      input: Record<string, unknown>;
      output: unknown;
      durationMs: number;
      errored: boolean;
    }>;
    inputTokens: number;
    outputTokens: number;
    latencyMs: number;
    stopReason: string;
  }>;
  finalText?: string;
  fallbackReason?: string;
}

export type AgentResult =
  | {
      status: 'complete';
      data: EntityInfo;
      outbox: AgentMessage[];
      /** Present when the agent ran via Claude (LlmSpecialistAgent). */
      trace?: AgentTraceLike;
    }
  | {
      status: 'blocked';
      reason: string;
      /** Blocked agents don't emit outbox messages. */
      outbox?: never;
    }
  | {
      status: 'error';
      error: string;
      outbox?: AgentMessage[];
      trace?: AgentTraceLike;
    };

/* ─── The Agent contract ───────────────────────────────────────────────── */

export interface Agent {
  readonly id: AgentId;
  /** Agents declared here must be `complete` before this one runs. */
  readonly dependencies: readonly AgentId[];
  run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult>;
}

/* ─── Labels for UI ────────────────────────────────────────────────────── */

// Runtime doesn't maintain its own label map — it reuses
// AGENT_LABELS_AR from ../types.ts so UI / runtime / store agree.
export { AGENT_LABELS_AR } from '../types';
