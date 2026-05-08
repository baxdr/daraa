/**
 * Operational-compliance analyzer — main entry point.
 *
 * Small-shop edition (post-pivot). Pure function, no LLM.
 * Concerns:
 *   - Commercial Register expires 12 months after issue
 *   - Municipal licence renews annually
 *   - Civil Defense safety cert renews annually
 *   - SFDA — coffee, restaurants, groceries (food verticals)
 *   - Nitaqat labour-quota — flagged at ≥10 employees
 *   - Lease renewal — notice if expiry < 60 days
 *   - Fire-safety infrastructure — extinguishers, emergency exit, ventilation
 *   - Hygiene-cert coverage — at least one cert per food/salon employee
 *   - Refrigeration servicing — flagged when >12 months since last check
 *   - Signage approval — flagged when not approved
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

type FoodVertical = 'coffee' | 'restaurant' | 'grocery';

function isFood(v: Answers['op1_vertical']): v is FoodVertical {
  return v === 'coffee' || v === 'restaurant' || v === 'grocery';
}

function hasHotKitchen(v: Answers['op1_vertical']): boolean {
  return v === 'coffee' || v === 'restaurant';
}

function needsHygieneCerts(v: Answers['op1_vertical']): boolean {
  return v === 'coffee' || v === 'restaurant' || v === 'grocery' || v === 'salon';
}

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

  // Fire-safety infrastructure.
  const extinguishers = a.op5b_extinguishers_count ?? -1;
  if (extinguishers >= 0 && extinguishers < 2) {
    gaps.push({
      id: 'op_extinguishers_count',
      severity: 'critical',
      category: 'extinguishers',
      titleAr: 'نقص في عدد طفايات الحريق',
      explanationAr: `عدد الطفايات الحالي ${extinguishers} — الحد الأدنى الموصى به ٢ طفاية لكل محل صغير + إضافية قرب المطبخ أو لوحات الكهرباء.`,
      actionAr: 'أضف طفايات معتمدة (CO2 أو رذاذ كيميائي) قبل الفحص الميداني التالي',
      daysUntilDeadline: 0,
      dueDate: '',
      officialUrl: 'https://www.998.gov.sa',
      fineCeilingSar: 5_000,
    });
  }

  if (a.op5c_extinguishers_last_check) {
    const lastCheck = parseIsoDate(a.op5c_extinguishers_last_check);
    const days = lastCheck ? daysBetween(lastCheck, today) : null;
    if (days !== null) {
      const monthsAgo = Math.floor(days / 30);
      if (monthsAgo > 6) {
        gaps.push({
          id: 'op_extinguishers_check',
          severity: 'medium',
          category: 'extinguishers',
          titleAr: 'فحص الطفايات الدوري متأخر',
          explanationAr: `آخر فحص للطفايات قبل ${monthsAgo} شهراً — الفحص الدوري مطلوب كل 6 أشهر بالحد الأقصى.`,
          actionAr: 'تواصل مع شركة معتمدة لإجراء فحص دوري للطفايات',
          daysUntilDeadline: 0,
          dueDate: '',
          fineCeilingSar: 2_000,
        });
      }
    }
  }

  if (a.op5d_emergency_exit === 'no') {
    gaps.push({
      id: 'op_emergency_exit',
      severity: 'critical',
      category: 'extinguishers',
      titleAr: 'مخرج الطوارئ غير مستقل',
      explanationAr:
        'الدفاع المدني يطلب مخرج طوارئ مستقل عن المدخل الرئيسي مع لوحة إرشادية مضاءة فوقه. غيابه أكثر سبب لإيقاف نشاط المحل.',
      actionAr: 'استشر مهندس سلامة لتحديد مسار طوارئ مناسب لمساحة محلك',
      daysUntilDeadline: 0,
      dueDate: '',
      officialUrl: 'https://www.998.gov.sa',
      fineCeilingSar: 30_000,
    });
  }

  // Ventilation — applies to coffee + restaurant only.
  if (hasHotKitchen(a.op1_vertical) && a.op6b_ventilation === 'no') {
    gaps.push({
      id: 'op_ventilation',
      severity: 'critical',
      category: 'ventilation',
      titleAr: 'نظام التهوية/الشفط غير مطابق',
      explanationAr:
        'المطبخ بدون شفط دهون مطابق ينتج تراكم دهون قابلة للاشتعال + رائحة. هذا أكثر سبب لرفض فحص SFDA + الدفاع المدني.',
      actionAr: 'اطلب من فني معتمد تركيب نظام شفط مع مرشّح دهون قابل للتنظيف',
      daysUntilDeadline: 0,
      dueDate: '',
      officialUrl: 'https://www.998.gov.sa',
      fineCeilingSar: 10_000,
    });
  }

  // Refrigeration — applies to restaurant + grocery.
  if (
    (a.op1_vertical === 'restaurant' || a.op1_vertical === 'grocery') &&
    a.op6c_refrigeration_check
  ) {
    const lastService = parseIsoDate(a.op6c_refrigeration_check);
    const days = lastService ? daysBetween(lastService, today) : null;
    if (days !== null) {
      const monthsAgo = Math.floor(days / 30);
      if (monthsAgo > 12) {
        gaps.push({
          id: 'op_refrigeration_service',
          severity: 'medium',
          category: 'refrigeration',
          titleAr: 'صيانة المبردات متأخرة',
          explanationAr: `آخر صيانة دورية للمبردات قبل ${monthsAgo} شهراً — اضطراب التبريد يفسد المنتجات وقد يسبب تلوّثاً غذائياً.`,
          actionAr: 'احجز صيانة دورية للمبردات + مراقبة درجة الحرارة (≤4°م)',
          daysUntilDeadline: 0,
          dueDate: '',
          fineCeilingSar: 5_000,
        });
      }
    }
  }

  // Hygiene certificates coverage.
  const totalEmployees = a.op8_employee_count ?? 0;
  const hygieneCertsValid = a.op7_hygiene_certs ?? 0;
  if (
    needsHygieneCerts(a.op1_vertical) &&
    totalEmployees > 0 &&
    hygieneCertsValid < totalEmployees
  ) {
    const missing = totalEmployees - hygieneCertsValid;
    gaps.push({
      id: 'op_hygiene_certs',
      severity: 'critical',
      category: 'hygiene',
      titleAr: 'شهادات صحية ناقصة للعاملين',
      explanationAr: `${hygieneCertsValid} من أصل ${totalEmployees} موظف عنده شهادة صحية سارية — ${missing} موظف يحتاج تجديد. الشهادات الصحية إلزامية لمن يتعامل مع الغذاء أو البشرة.`,
      actionAr: 'سجّل الموظفين الناقصين في برنامج الشهادات الصحية عبر بلديتك',
      daysUntilDeadline: 0,
      dueDate: '',
      fineCeilingSar: 5_000,
    });
  }

  // SFDA — food verticals only.
  if (isFood(a.op1_vertical)) {
    gaps.push(
      ...buildRenewalGap({
        id: 'op_sfda',
        category: 'sfda',
        issuedAt: a.op6_sfda_cert_date ?? a.op3_cr_issue_date,
        today,
        titlePrefix: 'ترخيص الغذاء والدواء (SFDA)',
        explanationAr: 'ترخيص SFDA شرط للمنشآت الغذائية. انتهاؤه = إيقاف خدمة فوري حتى التجديد.',
        actionAr: 'راجع هيئة الغذاء والدواء — sfda.gov.sa',
        officialUrl: 'https://sfda.gov.sa',
        fineCeilingSar: 100_000,
        escalateToCritical: true,
      }),
    );
  }

  // Signage.
  if (a.op10_signage_approved === 'no') {
    gaps.push({
      id: 'op_signage',
      severity: 'medium',
      category: 'signage',
      titleAr: 'لوحة المحل غير معتمدة',
      explanationAr:
        'لوحة المحل تحتاج موافقة بلدية بمواصفات محددة (ألوان، أبعاد، إضاءة). لوحات غير معتمدة تترصد أثناء جولات البلدية اليومية.',
      actionAr: 'قدّم طلب اعتماد لوحة عبر منصة بلدي',
      daysUntilDeadline: 0,
      dueDate: '',
      officialUrl: 'https://balady.gov.sa',
      fineCeilingSar: 3_000,
    });
  }

  // Nitaqat labour flag.
  if (totalEmployees >= 10) {
    gaps.push({
      id: 'op_nitaqat_check',
      severity: totalEmployees >= 50 ? 'critical' : 'medium',
      category: 'labor',
      titleAr: 'تحقّق من نطاقات المنشأة',
      explanationAr:
        `${totalEmployees} موظفاً — نطاقات (نسبة التوطين) يجب أن يُراجَع. النطاق الأصفر أو الأحمر يُقيّد ` +
        'كثيراً من الخدمات الحكومية (تأشيرات، نقل كفالة، بعض خدمات البلدية).',
      actionAr: 'سجّل دخول منصة قوى — qiwa.sa — وشف نطاقك الحالي',
      daysUntilDeadline: Number.NaN,
      dueDate: '',
      officialUrl: 'https://qiwa.sa',
    });
  }

  // Lease expiry — notice window.
  if (a.op9_lease_expiry) {
    const expiry = parseIsoDate(a.op9_lease_expiry);
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
        dueDate: a.op9_lease_expiry,
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
