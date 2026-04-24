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
  /** Which lens the agents reason through. Every specialist gets both modes
   *  from the same `run()`; switching is internal per agent. */
  mode: 'establishment' | 'compliance';
  vertical: VerticalId;
  answers: Answers;
  cityId?: string;
  cityLabelAr?: string;
  partnerCount?: number;
  capitalSar?: number;
  hasForeignPartner?: boolean;
  leaseStatus?: 'not_signed' | 'signed' | 'no_location_yet';
  /** Optional — URL collected from the user; used by pdpl_nca in compliance
   *  mode and passed to the scan pipeline. */
  websiteUrl?: string | null;
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
   *  skipped          = we deliberately didn't check (no key + no fallback worth surfacing,
   *                     or this is a compliance-mode run where the company already exists). */
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
  renewalPeriodAr?: string;
  criticalWarningAr?: string;
  commonMistakeAr?: string;
  requirements?: string[];
  /** Trade-name availability check — currently only populated by the MCI
   *  specialist in establishment mode. */
  nameCheck?: NameCheckResult;
}

/* ─── Run outcome ──────────────────────────────────────────────────────── */

export type AgentResult =
  | {
      status: 'complete';
      data: EntityInfo;
      outbox: AgentMessage[];
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
