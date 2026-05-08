/**
 * Shared type definitions for the درع agent pipeline.
 * Kept intentionally flat so it can be consumed in both server code and the UI.
 */

/**
 * Honest naming (post-pivot): a small-shop compliance tracker.
 *
 *   - Coordination: orchestrator, chat, research, analysis, report
 *   - Specialists:  mci, zatca, mohr_gosi, civil_defense, municipality, sfda, moh
 */
export type CoordinationAgent = 'orchestrator' | 'chat' | 'research' | 'analysis' | 'report';

export type EntityAgent =
  | 'mci'
  | 'municipality'
  | 'civil_defense'
  | 'sfda'
  | 'moh'
  | 'mohr_gosi'
  | 'zatca';

export type AgentId = CoordinationAgent | EntityAgent;

/** @deprecated — use AgentId. Kept as a type alias for backwards compat. */
export type AgentName = AgentId;

export interface AgentActivity {
  /** Monotonic sequence number within a run — used by the UI to detect new events. */
  seq: number;
  kind: 'activity';
  agent: AgentId;
  agentAr: string;
  status: 'started' | 'working' | 'completed' | 'error';
  messageAr: string;
  createdAt: number;
}

/**
 * Inter-agent message (A2A protocol).
 *
 * Emitted alongside activities on the run's timeline. The sender and receiver
 * are determined by known entity dependencies (civil_defense → municipality is
 * pre-wired, not emergent), but the UI still renders them as agent-to-agent
 * communication because the protocol IS real.
 */
export interface AgentMessage {
  seq: number;
  kind: 'message';
  from: AgentId;
  to: AgentId | 'ALL';
  type: 'dependency' | 'data_share' | 'warning' | 'update' | 'ack';
  messageAr: string;
  payload?: Record<string, unknown>;
  createdAt: number;
}

export type TimelineEvent = AgentActivity | AgentMessage;

export const AGENT_LABELS_AR: Record<AgentId, string> = {
  // Coordination
  orchestrator: 'المنسّق',
  chat: 'وكيل المحادثة',
  research: 'وكيل البحث',
  analysis: 'وكيل التحليل',
  report: 'وكيل التقرير',
  // Entity specialists
  mci: 'متخصّص التجارة',
  municipality: 'متخصّص البلدية',
  civil_defense: 'متخصّص الدفاع المدني',
  sfda: 'متخصّص الغذاء والدواء',
  moh: 'متخصّص وزارة الصحة',
  mohr_gosi: 'متخصّص الموارد البشرية والتأمينات',
  zatca: 'متخصّص الزكاة والضريبة',
};
