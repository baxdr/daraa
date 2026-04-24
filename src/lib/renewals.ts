/**
 * Renewal-date computation.
 *
 * Each entity in the knowledge base declares a `renewalPeriodAr` — a short
 * Arabic phrase like "سنوي" or "كل 3 سنوات". This module parses those phrases
 * into concrete month-offsets and returns the next-due date from a given
 * baseline (usually the plan's createdAt, standing in for the user's
 * establishment date).
 *
 * No scheduler or notifications — this is presentational only. The UI
 * renders "renews in N days" labels based on the returned dates. Real
 * notifications are out of scope for the MVP.
 */

import type { GovEntity } from '@/knowledge/entities';

export interface RenewalEntry {
  entityId: string;
  nameSimpleAr: string;
  renewalPeriodAr: string;
  nextDueAt: Date;
  daysRemaining: number;
  /** 'ok'       = > 60 days  (green)
   *  'notice'   = 30–60 days (medium — start preparing)
   *  'soon'     = 7–30 days  (amber — act now)
   *  'urgent'   = < 7 days   (red — critical)
   *  'overdue'  = < 0 days   (red — overdue) */
  urgency: 'ok' | 'notice' | 'soon' | 'urgent' | 'overdue';
  officialUrl?: string;
}

/**
 * Parse a renewal period label into a month count. Returns null when the
 * label doesn't describe a recurring interval (e.g. "مستمر" for PDPL
 * readiness — a posture, not a renewal).
 */
export function parseRenewalPeriodMonths(period: string | undefined): number | null {
  if (!period) return null;
  const p = period.trim();
  // Monthly subscriptions (GOSI).
  if (/شهري/.test(p)) return 1;
  // 3 years (contractor classification).
  if (/(٣|3)\s*سنوات|ثلاث سنوات/.test(p)) return 36;
  // Annual — default catch-all for "سنوي" and similar.
  if (/سنوي|سنة|عام/.test(p)) return 12;
  // "مستمر" or anything else — not a fixed-cadence renewal.
  return null;
}

/**
 * Compute the next renewal date for each entity that has a recurring period,
 * starting from `fromDate` (default: now). Sorted earliest-due-first.
 */
export function computeRenewals(
  entities: GovEntity[],
  fromDate: Date = new Date(),
): RenewalEntry[] {
  const now = fromDate.getTime();
  const out: RenewalEntry[] = [];

  for (const e of entities) {
    const months = parseRenewalPeriodMonths(e.renewalPeriodAr);
    if (months === null) continue;

    const nextDue = new Date(fromDate);
    nextDue.setMonth(nextDue.getMonth() + months);
    const diffMs = nextDue.getTime() - now;
    const daysRemaining = Math.floor(diffMs / 86_400_000);
    const urgency: RenewalEntry['urgency'] =
      daysRemaining < 0   ? 'overdue' :
      daysRemaining < 7   ? 'urgent'  :
      daysRemaining <= 30 ? 'soon'    :
      daysRemaining <= 60 ? 'notice'  :
                            'ok';

    out.push({
      entityId: e.id,
      nameSimpleAr: e.nameSimpleAr,
      renewalPeriodAr: e.renewalPeriodAr ?? '',
      nextDueAt: nextDue,
      daysRemaining,
      urgency,
      officialUrl: e.officialUrl,
    });
  }

  out.sort((a, b) => a.nextDueAt.getTime() - b.nextDueAt.getTime());
  return out;
}
