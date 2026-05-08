/**
 * Operational-compliance analyzer — type exports.
 *
 * Public types consumed by:
 *   - components/operational-dashboard.tsx (OperationalReport, OperationalGap)
 *   - lib/project-store.ts (OperationalReport)
 *   - project-orchestrator.ts (runOperationalAnalysis return type)
 */

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
}
