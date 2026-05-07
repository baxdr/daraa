/**
 * Operational-compliance analyzer.
 *
 * For physical businesses (restaurants, salons, construction, retail) that
 * don't need a PDPL-style website scan. The compliance concern here is
 * license-renewal hygiene:
 *
 *   - Commercial Register — expires 12 months after issue
 *   - Municipal licence — renewed annually
 *   - Civil Defense safety cert — annual inspection cadence
 *   - SFDA cert — annual, restaurants only
 *   - Nitaqat labour-quota standing — flagged at ≥10 employees
 *   - Lease renewal — notice if expiry < 60 days
 *   - Missing dates — surfaced as low-severity "need-to-fill" items
 *
 * Pure function, no LLM. Given the user's answers + today's date, returns
 * an `OperationalReport` with three partitions (overdue / upcoming /
 * informational) and a derived `healthScore` (0–100).
 */

import type { Answers } from './chat-flow';

export type OpCategory = 'municipal' | 'civil_defense' | 'sfda' | 'cr' | 'labor' | 'lease';

export interface OperationalGap {
  id: string;
  severity: 'critical' | 'medium' | 'low';
  category: OpCategory;
  titleAr: string;
  explanationAr: string;
  actionAr: string;
  /** Negative if overdue, positive if upcoming. null if we have no date at all. */
  daysUntilDeadline: number;
  /** ISO YYYY-MM-DD of the calculated due date. Empty string when N/A. */
  dueDate: string;
  officialUrl?: string;
  fineCeilingSar?: number;
}

export interface OperationalReport {
  gaps: OperationalGap[]; // all items regardless of severity
  overdue: OperationalGap[]; // daysUntilDeadline < 0
  upcomingRenewals: OperationalGap[]; // 0 ≤ daysUntilDeadline ≤ 180, critical+medium only
  healthScore: number;
  computedAt: string;
}

/* ------------------------------------------------------------------------- */
/* Constants                                                                  */
/* ------------------------------------------------------------------------- */

const MS_PER_DAY = 86_400_000;
/** Treat a licence as "urgent" if its next renewal is within this many days. */
const URGENT_WINDOW_DAYS = 30;
const SOON_WINDOW_DAYS = 60;
const UPCOMING_WINDOW_DAYS = 180;
const LEASE_NOTICE_WINDOW_DAYS = 60;

/* ------------------------------------------------------------------------- */
/* Public API                                                                 */
/* ------------------------------------------------------------------------- */

export function runOperationalAnalysis(args: {
  answers: Answers;
  today?: Date;
}): OperationalReport {
  const today = args.today ?? new Date();
  const a = args.answers;
  const gaps: OperationalGap[] = [];

  // Commercial register.
  gaps.push(
    ...buildRenewalGap({
      id: 'op_cr_renewal',
      category: 'cr',
      issuedAt: a.op3_cr_issue_date,
      today,
      titlePrefix: 'السجل التجاري',
      explanationAr:
        'السجل التجاري يُجدَّد سنوياً. لو انتهى بدون تجديد، الحسابات البنكية والمعاملات الحكومية تتجمّد.',
      actionAr: 'جدّد عبر بوابة وزارة التجارة — mc.gov.sa',
      officialUrl: 'https://mc.gov.sa',
      fineCeilingSar: 10_000,
    }),
  );

  // Municipal licence.
  gaps.push(
    ...buildRenewalGap({
      id: 'op_municipal_renewal',
      category: 'municipal',
      issuedAt: a.op4_municipal_last_renewed ?? a.op3_cr_issue_date,
      today,
      titlePrefix: 'الرخصة البلدية',
      explanationAr:
        'رخصة البلدية (رخصة النشاط من منصة بلدي) سنوية. انتهاؤها يوقف الخدمات ويعرّض المحل للإغلاق.',
      actionAr: 'جدّد عبر منصة بلدي — balady.gov.sa',
      officialUrl: 'https://balady.gov.sa',
      fineCeilingSar: 5_000,
      missingSeverity: 'medium',
    }),
  );
  if (a.op4_municipal_last_renewed === null && a.op3_cr_issue_date) {
    gaps.push(
      missingDateInfo(
        'op_municipal_missing_info',
        'municipal',
        'تاريخ آخر تجديد بلدي غير محدّد',
        'استخدمنا تاريخ السجل التجاري كتقدير.',
      ),
    );
  }

  // Civil defense safety certificate.
  gaps.push(
    ...buildRenewalGap({
      id: 'op_civil_defense',
      category: 'civil_defense',
      issuedAt: a.op5_civil_defense_last ?? a.op3_cr_issue_date,
      today,
      titlePrefix: 'شهادة السلامة (الدفاع المدني)',
      explanationAr:
        'الفحص السنوي للسلامة (الطفايات، مخارج الطوارئ، كواشف الدخان). غيابه = إغلاق فوري عند أي تفتيش.',
      actionAr: 'احجز فحصاً عبر منصة سلامة — salamah.sa',
      officialUrl: 'https://salamah.sa',
      fineCeilingSar: 30_000,
      escalateToCritical: true,
    }),
  );
  if (a.op5_civil_defense_last === null && a.op3_cr_issue_date) {
    gaps.push(
      missingDateInfo(
        'op_civil_defense_missing_info',
        'civil_defense',
        'تاريخ فحص الدفاع المدني غير محدّد',
        'استخدمنا تاريخ السجل التجاري كتقدير.',
      ),
    );
  }

  // SFDA — restaurants only.
  if (a.op1_vertical === 'restaurant') {
    gaps.push(
      ...buildRenewalGap({
        id: 'op_sfda',
        category: 'sfda',
        issuedAt: a.op6_sfda_cert_date ?? a.op3_cr_issue_date,
        today,
        titlePrefix: 'ترخيص الغذاء والدواء (SFDA)',
        explanationAr: 'ترخيص SFDA شرط للمطاعم والكوفي شوب. انتهاؤه = إيقاف خدمة فوري حتى التجديد.',
        actionAr: 'راجع هيئة الغذاء والدواء — sfda.gov.sa',
        officialUrl: 'https://sfda.gov.sa',
        fineCeilingSar: 100_000,
        escalateToCritical: true,
      }),
    );
  }

  // Nitaqat labour flag — 10+ employees should verify their zone.
  const employees = a.op7_employee_count ?? 0;
  if (employees >= 10) {
    gaps.push({
      id: 'op_nitaqat_check',
      severity: employees >= 50 ? 'critical' : 'medium',
      category: 'labor',
      titleAr: 'تحقّق من نطاقات المنشأة',
      explanationAr:
        `${employees} موظفاً — نطاقات (نسبة التوطين) يجب أن يُراجَع. النطاق الأصفر أو الأحمر يُقيّد ` +
        'كثيراً من الخدمات الحكومية (تأشيرات، نقل كفالة، بعض خدمات البلدية).',
      actionAr: 'سجّل دخول منصة قوى — qiwa.sa — وشف نطاقك الحالي',
      // NaN excludes Nitaqat from the renewal timeline (it's a posture check,
      // not a dated renewal), while still rendering it in the alerts list.
      daysUntilDeadline: Number.NaN,
      dueDate: '',
      officialUrl: 'https://qiwa.sa',
    });
  }

  // Lease expiry — notice window.
  if (a.op8_lease_expiry) {
    const expiry = parseIsoDate(a.op8_lease_expiry);
    const days = expiry ? daysBetween(today, expiry) : null;
    if (days !== null && days <= LEASE_NOTICE_WINDOW_DAYS) {
      gaps.push({
        id: 'op_lease_notice',
        severity: days < 0 ? 'critical' : days <= 30 ? 'critical' : 'medium',
        category: 'lease',
        titleAr: days < 0 ? 'عقد الإيجار منتهي' : `عقد الإيجار ينتهي خلال ${days} يوم`,
        explanationAr:
          days < 0
            ? 'العقد منتهي — استمرار التشغيل بدون عقد ساري يُبطل كثيراً من الرخص.'
            : 'اقترب موعد انتهاء العقد. ابدأ التفاوض مبكراً لتفادي إغلاق مؤقت.',
        actionAr: 'راجع المالك لتمديد العقد قبل أي جولة تجديد لرخصة البلدية',
        daysUntilDeadline: days,
        dueDate: a.op8_lease_expiry,
      });
    }
  } else {
    gaps.push({
      id: 'op_lease_missing',
      severity: 'low',
      category: 'lease',
      titleAr: 'تاريخ انتهاء عقد الإيجار غير معروف',
      explanationAr: 'لو عرفنا التاريخ، نذكّرك قبل انتهاء العقد.',
      actionAr: 'حدّث بياناتك بتاريخ انتهاء العقد',
      daysUntilDeadline: Number.NaN,
      dueDate: '',
    });
  }

  // Sort by severity, then by deadline proximity.
  gaps.sort((x, y) => {
    const sev = sevWeight(y.severity) - sevWeight(x.severity);
    if (sev !== 0) return sev;
    // Overdue > upcoming > missing-date (NaN treated as largest).
    const xd = Number.isNaN(x.daysUntilDeadline) ? Number.MAX_SAFE_INTEGER : x.daysUntilDeadline;
    const yd = Number.isNaN(y.daysUntilDeadline) ? Number.MAX_SAFE_INTEGER : y.daysUntilDeadline;
    return xd - yd;
  });

  const overdue = gaps.filter(
    (g) => Number.isFinite(g.daysUntilDeadline) && g.daysUntilDeadline < 0,
  );
  const upcomingRenewals = gaps.filter(
    (g) =>
      Number.isFinite(g.daysUntilDeadline) &&
      g.daysUntilDeadline >= 0 &&
      g.daysUntilDeadline <= UPCOMING_WINDOW_DAYS &&
      g.severity !== 'low',
  );

  // Health score: denominator is count of gaps that could be pass/fail
  // (excluding low/informational items). Numerator is count with
  // daysUntilDeadline ≥ SOON_WINDOW_DAYS (i.e. not pressing).
  const meaningful = gaps.filter(
    (g) => g.severity !== 'low' && Number.isFinite(g.daysUntilDeadline),
  );
  const healthy = meaningful.filter((g) => g.daysUntilDeadline >= SOON_WINDOW_DAYS);
  const healthScore =
    meaningful.length === 0 ? 100 : Math.round((healthy.length / meaningful.length) * 100);

  return {
    gaps,
    overdue,
    upcomingRenewals,
    healthScore,
    computedAt: new Date().toISOString(),
  };
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

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
function buildRenewalGap(input: RenewalInput): OperationalGap[] {
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

  // Classify severity.
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

function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return null;
  const [, y, m, d] = match;
  const dt = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function daysBetween(from: Date, to: Date): number | null {
  if (!(to instanceof Date) || Number.isNaN(to.getTime())) return null;
  const fromUtc = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toUtc = to.getTime();
  return Math.round((toUtc - fromUtc) / MS_PER_DAY);
}

function isoOf(d: Date): string {
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

function sevWeight(s: OperationalGap['severity']): number {
  return s === 'critical' ? 3 : s === 'medium' ? 2 : 1;
}

function missingDateInfo(
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
