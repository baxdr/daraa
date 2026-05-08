/**
 * Renewal-date computation.
 *
 * Takes the user's chat answers + the resolved entity list and produces a
 * concrete calendar of renewals, each with a typed urgency label. The
 * cron endpoint reads this calendar to decide who to email.
 */

import type { Answers } from '@/agents/chat-flow';
import type { GovEntity } from '@/knowledge/entities';
import type { Renewal } from './project-store';

export type Urgency = 'ok' | 'soon' | 'urgent' | 'overdue';

const MS_PER_DAY = 86_400_000;

/** Map answer-date fields to entity IDs they govern. Drives baseline-date lookup. */
const ANSWER_TO_ENTITY: Record<string, keyof Answers> = {
  mci: 'op3_cr_issue_date',
  municipality: 'op4_municipal_last_renewed',
  civil_defense: 'op5_civil_defense_last',
  sfda: 'op6_sfda_cert_date',
};

/**
 * Threshold the urgency badge — drives both the UI color and the cron
 * filter. Anything ≤ 30 days is reminder-eligible.
 */
export function urgencyOf(dueDate: string, today: Date = new Date()): Urgency {
  const due = Date.parse(dueDate);
  if (Number.isNaN(due)) return 'ok';
  const days = Math.floor((due - today.getTime()) / MS_PER_DAY);
  if (days < 0) return 'overdue';
  if (days < 7) return 'urgent';
  if (days <= 30) return 'soon';
  return 'ok';
}

/** Days remaining (negative when overdue). NaN-safe — invalid date returns 0. */
export function daysUntil(dueDate: string, today: Date = new Date()): number {
  const due = Date.parse(dueDate);
  if (Number.isNaN(due)) return 0;
  return Math.floor((due - today.getTime()) / MS_PER_DAY);
}

/** Add `months` to an ISO YYYY-MM-DD baseline; return the resulting ISO date. */
function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split('-').map(Number);
  if (!y || !m || !d) return isoDate;
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCMonth(base.getUTCMonth() + months);
  return base.toISOString().slice(0, 10);
}

/**
 * Build the renewal calendar for a project. Each entity with a fixed
 * cadence (renewalMonths) gets one entry; entities marked continuous
 * (null) are skipped — they aren't renewals, they're postures.
 *
 * Baseline date for each entity is, in priority order:
 *   1. The user-supplied answer date (op3 for CR, op4 for municipality, ...)
 *   2. The CR issue date (used as a proxy when more specific dates are missing)
 *   3. Today (last-resort fallback so the calendar is never empty)
 */
export function computeRenewalsForProject(
  answers: Answers,
  entities: GovEntity[],
  today: Date = new Date(),
): Renewal[] {
  const todayIso = today.toISOString().slice(0, 10);
  const crIssued = answers.op3_cr_issue_date ?? todayIso;

  const out: Renewal[] = [];
  for (const e of entities) {
    if (e.renewalMonths === null) continue;

    const answerKey = ANSWER_TO_ENTITY[e.id];
    const userBaseline = answerKey ? (answers[answerKey] as string | null | undefined) : undefined;
    const baseline = userBaseline ?? crIssued;

    const dueDate = addMonths(baseline, e.renewalMonths);
    out.push({
      entityId: e.id,
      entityNameAr: e.nameSimpleAr,
      dueDate,
      renewalMonths: e.renewalMonths,
      status: urgencyOf(dueDate, today),
      ...(e.officialUrl ? { officialUrl: e.officialUrl } : {}),
    });
  }

  return out.sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
}
