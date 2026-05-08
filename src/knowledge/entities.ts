/**
 * Saudi government entities knowledge base — small-shop edition.
 *
 * LIABILITY NOTE — read before touching this file.
 *
 * Every cost and duration in this file is a *rough range* for guidance only.
 * They are NOT authoritative figures. The UI renders them with a "تقديري —
 * راجع الجهة الرسمية" label. Do not widen the confident-sounding claims here
 * without a verified source document.
 *
 * The "commonMistake" / "criticalWarning" copy is phrased as caution plus a
 * link to the official portal — never as a directive.
 */

import type { NameCheckResult } from '@/agents/runtime/types';

export type VerticalId = 'coffee' | 'restaurant' | 'grocery' | 'laundry' | 'salon';

export interface GovEntity {
  id: string;
  nameAr: string;
  /** Shorter user-friendly name, e.g. "السجل التجاري". */
  nameSimpleAr: string;
  /** One-sentence plain-Arabic explanation of WHY this entity matters. */
  explainAr: string;
  /** Rough SAR cost range — render with "تقديري" qualifier. */
  estimatedCostSar: { min: number; max: number };
  /** Human-readable duration estimate. */
  estimatedTimeAr: string;
  /** Used to sort roadmap — lower = earlier. Multiple entities can share an order. */
  order: number;
  /** Entity IDs that must complete first. Empty = can start at t=0. */
  dependencies: string[];
  /** Optional caution to surface on the entity card. */
  commonMistakeAr?: string;
  /** More prominent orange-banner caution. */
  criticalWarningAr?: string;
  /** Months between consecutive renewals. null = continuous (no fixed cadence). */
  renewalMonths: number | null;
  /** Pretty Arabic phrase for the renewal cadence — derived from renewalMonths. */
  renewalPeriodAr?: string;
  /** Official portal link. */
  officialUrl?: string;
  /** Checklist of what the user needs in place. Populated by each specialist. */
  requirements?: string[];
  /** Trade-name availability — reserved field, currently unused. */
  nameCheck?: NameCheckResult;
}

export interface Vertical {
  id: VerticalId;
  labelAr: string;
  /** Extra entities on top of the always-required baseline. */
  entities: GovEntity[];
}

/* ------------------------------------------------------------------------- */
/* Renewal helpers                                                            */
/* ------------------------------------------------------------------------- */

/** Format a renewal cadence (in months) as a short Arabic phrase. */
export function formatRenewalAr(months: number | null): string {
  if (months === null) return 'مستمر';
  if (months === 1) return 'شهري';
  if (months === 12) return 'سنوي';
  if (months % 12 === 0) return `كل ${months / 12} سنوات`;
  return `كل ${months} أشهر`;
}

/** Stamp `renewalPeriodAr` consistently from `renewalMonths`. */
function withRenewalLabel(e: Omit<GovEntity, 'renewalPeriodAr'>): GovEntity {
  return { ...e, renewalPeriodAr: formatRenewalAr(e.renewalMonths) };
}

/* ------------------------------------------------------------------------- */
/* Baseline — applies to every shop regardless of vertical                    */
/* ------------------------------------------------------------------------- */

export const ALWAYS_REQUIRED: readonly GovEntity[] = [
  withRenewalLabel({
    id: 'mci',
    nameAr: 'وزارة التجارة',
    nameSimpleAr: 'السجل التجاري',
    explainAr: 'الوثيقة الأم للمحل — تُسجَّل عند بدء النشاط، وتُجدَّد سنوياً.',
    estimatedCostSar: { min: 200, max: 400 },
    estimatedTimeAr: 'يوم واحد (إلكتروني)',
    order: 1,
    dependencies: [],
    renewalMonths: 12,
    officialUrl: 'https://mc.gov.sa',
  }),
  withRenewalLabel({
    id: 'zatca',
    nameAr: 'هيئة الزكاة والضريبة والجمارك',
    nameSimpleAr: 'التسجيل الضريبي',
    explainAr: 'تسجيل ضريبي للمنشأة — VAT يصير إلزامي عند تجاوز ٣٧٥ ألف ريال إيراد سنوي.',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'يوم واحد (إلكتروني)',
    order: 2,
    dependencies: ['mci'],
    renewalMonths: null,
    officialUrl: 'https://zatca.gov.sa',
  }),
  withRenewalLabel({
    id: 'mohr_gosi',
    nameAr: 'وزارة الموارد البشرية + التأمينات الاجتماعية',
    nameSimpleAr: 'ملف المنشأة + تأمينات',
    explainAr: 'فتح ملف منشأة لتوظيف موظفين + اشتراك التأمينات الشهري.',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'يوم واحد (إلكتروني)',
    order: 3,
    dependencies: ['mci'],
    renewalMonths: 1,
    officialUrl: 'https://www.hrsd.gov.sa',
  }),
];

/* ------------------------------------------------------------------------- */
/* Shared entity factories                                                    */
/* ------------------------------------------------------------------------- */

const civilDefenseEntity = withRenewalLabel({
  id: 'civil_defense',
  nameAr: 'الدفاع المدني',
  nameSimpleAr: 'شهادة السلامة',
  explainAr: 'تتأكد من وجود طفايات حريق + مخارج طوارئ + كواشف دخان. تُجدَّد سنوياً.',
  estimatedCostSar: { min: 200, max: 1_000 },
  estimatedTimeAr: '٣ إلى ١٤ يوم (يحتاج زيارة ميدانية)',
  order: 5,
  dependencies: ['mci'],
  renewalMonths: 12,
  criticalWarningAr:
    'شهادة السلامة غالباً تسبق رخصة البلدية — تأكّد من التسلسل الصحيح لحيّك على منصة بلدي قبل التقديم.',
  officialUrl: 'https://www.998.gov.sa',
});

const municipalityEntity = withRenewalLabel({
  id: 'municipality',
  nameAr: 'أمانة المنطقة (بلدي)',
  nameSimpleAr: 'رخصة البلدية',
  explainAr: 'الرخصة اللي تسمح لك تشغّل المحل في الموقع. بدونها لا يحق التشغيل.',
  estimatedCostSar: { min: 500, max: 3_000 },
  estimatedTimeAr: '٣ إلى ٧ أيام',
  order: 6,
  dependencies: ['civil_defense'],
  renewalMonths: 12,
  commonMistakeAr:
    'تحقّق من تطابق نشاطك مع نوع رخصة البلدية على منصة بلدي قبل أي تجديد — تغيير النشاط بدون تحديث الرخصة يعرّضك لمخالفات.',
  officialUrl: 'https://balady.gov.sa',
});

const sfdaEntity = withRenewalLabel({
  id: 'sfda',
  nameAr: 'الهيئة العامة للغذاء والدواء',
  nameSimpleAr: 'ترخيص الغذاء (SFDA)',
  explainAr: 'إلزامي للمنشآت الغذائية — يُجدَّد سنوياً، انتهاؤه يوقف النشاط فوراً.',
  estimatedCostSar: { min: 1_000, max: 3_000 },
  estimatedTimeAr: '٧ إلى ١٤ يوم',
  order: 7,
  dependencies: ['municipality'],
  renewalMonths: 12,
  officialUrl: 'https://sfda.gov.sa',
});

const mohEntity = withRenewalLabel({
  id: 'moh',
  nameAr: 'وزارة الصحة',
  nameSimpleAr: 'الترخيص الصحي',
  explainAr: 'يطلب فحصاً ميدانياً + شهادات صحية للعاملين — يُجدَّد سنوياً.',
  estimatedCostSar: { min: 500, max: 2_000 },
  estimatedTimeAr: '٧ إلى ١٤ يوم',
  order: 8,
  dependencies: ['municipality'],
  renewalMonths: 12,
  officialUrl: 'https://www.moh.gov.sa',
});

/* ------------------------------------------------------------------------- */
/* Vertical-specific entity bundles                                           */
/* ------------------------------------------------------------------------- */

const COFFEE_ENTITIES: GovEntity[] = [civilDefenseEntity, municipalityEntity, sfdaEntity];
const RESTAURANT_ENTITIES: GovEntity[] = [
  civilDefenseEntity,
  municipalityEntity,
  sfdaEntity,
  mohEntity,
];
const GROCERY_ENTITIES: GovEntity[] = [civilDefenseEntity, municipalityEntity, sfdaEntity];
const LAUNDRY_ENTITIES: GovEntity[] = [civilDefenseEntity, municipalityEntity];
const SALON_ENTITIES: GovEntity[] = [civilDefenseEntity, municipalityEntity, mohEntity];

export const VERTICALS: Record<VerticalId, Vertical> = {
  coffee: { id: 'coffee', labelAr: 'كوفي شوب / مقهى', entities: COFFEE_ENTITIES },
  restaurant: { id: 'restaurant', labelAr: 'مطعم', entities: RESTAURANT_ENTITIES },
  grocery: { id: 'grocery', labelAr: 'بقالة / سوبر ماركت', entities: GROCERY_ENTITIES },
  laundry: { id: 'laundry', labelAr: 'مغسلة ملابس', entities: LAUNDRY_ENTITIES },
  salon: { id: 'salon', labelAr: 'صالون / مركز تجميل', entities: SALON_ENTITIES },
};

/* ------------------------------------------------------------------------- */
/* Resolver — compose the full entity list for a vertical + sort by order     */
/* ------------------------------------------------------------------------- */

export function resolveEntities(verticalId: VerticalId): GovEntity[] {
  const vertical = VERTICALS[verticalId];
  if (!vertical) return [];
  return [...ALWAYS_REQUIRED, ...vertical.entities].sort((a, b) => a.order - b.order);
}

/**
 * Group the entity list into weekly buckets the UI can render as a roadmap.
 * Uses dependencies + order to compute a simple critical-path schedule.
 */
export interface RoadmapWeek {
  label: string;
  entities: GovEntity[];
}

export function buildRoadmap(entities: GovEntity[]): RoadmapWeek[] {
  const completed = new Set<string>();
  const remaining = [...entities];
  const weeks: RoadmapWeek[] = [];
  const WEEK_LABELS = [
    'الأسبوع الأول',
    'الأسبوع الثاني',
    'الأسبوع الثالث',
    'الأسبوع الرابع',
    'الأسبوع الخامس',
    'الأسبوع السادس',
    'الأسبوع السابع',
    'الأسبوع الثامن',
  ];

  while (remaining.length) {
    const batch = remaining.filter((e) => e.dependencies.every((d) => completed.has(d)));
    if (batch.length === 0) {
      weeks.push({ label: 'خطوات لاحقة', entities: [...remaining] });
      break;
    }
    const label = WEEK_LABELS[weeks.length] ?? `الأسبوع ${weeks.length + 1}`;
    weeks.push({ label, entities: batch });
    for (const e of batch) completed.add(e.id);
    for (const e of batch) remaining.splice(remaining.indexOf(e), 1);
  }

  return weeks;
}

export interface CostSummary {
  minSar: number;
  maxSar: number;
  itemCount: number;
}

export function summariseCosts(entities: GovEntity[]): CostSummary {
  let min = 0;
  let max = 0;
  for (const e of entities) {
    min += e.estimatedCostSar.min;
    max += e.estimatedCostSar.max;
  }
  return { minSar: min, maxSar: max, itemCount: entities.length };
}
