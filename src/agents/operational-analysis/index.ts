/**
 * Operational analysis — public barrel.
 *
 * Consumers import from `@/agents/operational-analysis` (no path change
 * required by Phase 5d split — the original file became this directory).
 */

export { runOperationalAnalysis } from './runner';
export type { OpCategory, OperationalGap, OperationalReport } from './types';
