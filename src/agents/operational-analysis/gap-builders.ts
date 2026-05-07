/**
 * Gap-builder helpers and severity weighting for the operational analyzer.
 * Internal — not re-exported from the package barrel.
 */

import type { OpCategory, OperationalGap } from './types';
import { daysBetween, isoOf, parseIsoDate } from './date-utils';

/** Treat a licence as "urgent" if its next renewal is within this many days. */
export const URGENT_WINDOW_DAYS = 30;
export const SOON_WINDOW_DAYS = 60;
export const UPCOMING_WINDOW_DAYS = 180;
export const LEASE_NOTICE_WINDOW_DAYS = 60;

interface RenewalInput {
  id: string;
  category: OpCategory;
  issuedAt: string | null | undefined;
  today: Date;
  titlePrefix: string;
  explanationAr: string;
  actionAr: string;
  officialUrl?: string;
  fineCeilingSar?: number;
  /** Base severity for the "missing date" branch; defaults to 'low'. */
  missingSeverity?: OperationalGap['severity'];
  /** When true, overdue/urgent cases go to 'critical' instead of 'medium'. */
  escalateToCritical?: boolean;
}

/**
 * Build zero-or-one gap for a typical annual-renewal licence. Always returns
 * an array (possibly empty) so call-sites can spread it.
 */
export function buildRenewalGap(input: RenewalInput): OperationalGap[] {
  const {
    id,
    category,
    issuedAt,
    today,
    titlePrefix,
    explanationAr,
    actionAr,
    officialUrl,
    fineCeilingSar,
    missingSeverity = 'low',
    escalateToCritical = false,
  } = input;

  if (!issuedAt) {
    return [
      {
        id: `${id}_missing_date`,
        severity: missingSeverity,
        category,
        titleAr: `${titlePrefix} — التاريخ غير معروف`,
        explanationAr: `أدخل تاريخ آخر تجديد لـ${titlePrefix} عشان نقدر نذكّرك بالموعد.`,
        actionAr: 'حدّث بياناتك بالتاريخ الصحيح',
        daysUntilDeadline: Number.NaN,
        dueDate: '',
        ...(officialUrl ? { officialUrl } : {}),
      },
    ];
  }

  const issued = parseIsoDate(issuedAt);
  if (!issued) return [];
  // Anniversary-based, not 365-day-offset — handles leap years correctly
  // (Feb 29 issue → Feb 28 anniversary in non-leap years, not Mar 1).
  const dueDate = new Date(
    Date.UTC(issued.getUTCFullYear() + 1, issued.getUTCMonth(), issued.getUTCDate()),
  );
  const days = daysBetween(today, dueDate);
  if (days === null) return [];

  let severity: OperationalGap['severity'] = 'low';
  if (days < 0) severity = escalateToCritical ? 'critical' : 'medium';
  else if (days <= URGENT_WINDOW_DAYS) severity = escalateToCritical ? 'critical' : 'medium';
  else if (days <= SOON_WINDOW_DAYS) severity = 'medium';
  else if (days <= UPCOMING_WINDOW_DAYS) severity = 'low';
  else return []; // more than 180 days away — not worth surfacing

  const titleAr =
    days < 0
      ? `${titlePrefix} — منتهية منذ ${Math.abs(days)} يوم`
      : days === 0
        ? `${titlePrefix} — ينتهي اليوم`
        : `${titlePrefix} — يُجدَّد خلال ${days} يوم`;

  return [
    {
      id,
      severity,
      category,
      titleAr,
      explanationAr,
      actionAr,
      daysUntilDeadline: days,
      dueDate: isoOf(dueDate),
      ...(officialUrl ? { officialUrl } : {}),
      ...(fineCeilingSar ? { fineCeilingSar } : {}),
    },
  ];
}

export function missingDateInfo(
  id: string,
  category: OpCategory,
  titleAr: string,
  explanationAr: string,
): OperationalGap {
  return {
    id,
    severity: 'low',
    category,
    titleAr,
    explanationAr,
    actionAr: 'حدّث بياناتك بالتاريخ الصحيح لحصولك على تذكير دقيق',
    daysUntilDeadline: Number.NaN,
    dueDate: '',
  };
}

export function sevWeight(s: OperationalGap['severity']): number {
  return s === 'critical' ? 3 : s === 'medium' ? 2 : 1;
}
