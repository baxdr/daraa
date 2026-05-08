import type { Turn } from './types';

/** Expected question count per mode — used for a mode-aware progress bar.
 *  Establishment: q0 + q_company_name + est1..est6 = 8
 *  Digital compliance: q0 + q_company_name + q1..q8 (conditional) = up to 10
 *  Operational: q0 + q_company_name + op1..op10 (conditional) = up to 12
 *  We take the max for the branch the user is on; fallback = 8 before mode
 *  is selected. */
export function expectedTurnsForMode(turns: Turn[]): number {
  const first = turns.find(
    (t) => t.role === 'user' && typeof (t as { text: string }).text === 'string',
  );
  const label = first && 'text' in first ? first.text : '';
  if (label.includes('شغّال رقمي') || label.includes('PDPL')) return 10;
  if (label.includes('محل') || label.includes('مطعم') || label.includes('رخصي')) return 12;
  if (label.includes('مشروع جديد')) return 8;
  return 8;
}

export function computeProgress(turns: Turn[]): number {
  const userTurns = turns.filter((t) => t.role === 'user').length;
  const expected = expectedTurnsForMode(turns);
  return Math.min(100, Math.round((userTurns / expected) * 100));
}

export function computeQuestionCount(turns: Turn[]): number {
  return turns.filter((t) => t.role === 'user').length;
}
