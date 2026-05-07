/**
 * Operational-compliance analyzer — main entry point.
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
 * an OperationalReport with three partitions (overdue / upcoming /
 * informational) and a derived healthScore (0–100).
 */

import type { Answers } from '../chat-flow';
import type { OperationalGap, OperationalReport } from './types';
import { daysBetween, parseIsoDate } from './date-utils';
import {
  buildRenewalGap,
  missingDateInfo,
  sevWeight,
  LEASE_NOTICE_WINDOW_DAYS,
  SOON_WINDOW_DAYS,
  UPCOMING_WINDOW_DAYS,
} from './gap-builders';

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
