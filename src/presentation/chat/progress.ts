import type { Turn } from './types';

/**
 * Single-mode flow now (operational compliance for small shops).
 * Total questions: q_company_name + 13–15 op questions depending on
 * the vertical. We use 16 as a max — it's a touch generous so the bar
 * doesn't visually "complete" before the user reaches the report.
 */
const EXPECTED_TURNS = 16;

export function computeProgress(turns: Turn[]): number {
  const userTurns = turns.filter((t) => t.role === 'user').length;
  return Math.min(100, Math.round((userTurns / EXPECTED_TURNS) * 100));
}

export function computeQuestionCount(turns: Turn[]): number {
  return turns.filter((t) => t.role === 'user').length;
}
