/**
 * Operational-compliance analyzer — type exports.
 *
 * Public types consumed by:
 *   - components/operational-dashboard.tsx (OperationalReport, OperationalGap)
 *   - lib/project-store.ts (OperationalReport)
 *   - project-orchestrator.ts (runOperationalAnalysis return type)
 */

import type { AgentTraceLike } from '../runtime/types';

export type OpCategory =
  | 'municipal'
  | 'civil_defense'
  | 'sfda'
  | 'cr'
  | 'labor'
  | 'lease'
  | 'extinguishers'
  | 'ventilation'
  | 'refrigeration'
  | 'hygiene'
  | 'signage';

export interface OperationalGap {
  id: string;
  severity: 'critical' | 'medium' | 'low';
  category: OpCategory;
  titleAr: string;
  explanationAr: string;
  actionAr: string;
  /** Negative if overdue, positive if upcoming. NaN when no date is available. */
  daysUntilDeadline: number;
  /** ISO YYYY-MM-DD of the calculated due date. Empty string when N/A. */
  dueDate: string;
  officialUrl?: string;
  fineCeilingSar?: number;
}

export interface OperationalReport {
  gaps: OperationalGap[];
  overdue: OperationalGap[];
  upcomingRenewals: OperationalGap[];
  healthScore: number;
  computedAt: string;
  /** Optional LLM-narrated summary in Arabic — produced by `enrichOperationalReport`.
   *  Falls back to undefined when Claude is unreachable. */
  narrative?: string;
  /** Top-3 actions the LLM picked from the gap list — Arabic, action-oriented. */
  priorityActions?: string[];
  /** Reasoning trace from the narrator pass (mirrors AgentTraceLike shape). */
  trace?: AgentTraceLike;
}
