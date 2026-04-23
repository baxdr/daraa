/**
 * Saudi government entities knowledge base for the establishment-path.
 *
 * LIABILITY NOTE — read before touching this file.
 *
 * Every cost and duration in this file is a *rough range* copied from the v3
 * brief. These are NOT authoritative figures. The UI renders them with a
 * "تقديري — راجع الجهة الرسمية" label, and the establishment page leads with
 * a legal disclaimer. Do not widen the confident-sounding claims here without
 * a verified source document.
 *
 * The "commonMistake" / "criticalWarning" copy is phrased as caution plus a
 * link to the official portal — never as a directive. This is regulatory
 * advice territory; we can guide but cannot decide.
 */

export type VerticalId = 'restaurant' | 'tech' | 'salon' | 'construction' | 'services';

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
  /** More prominent orange-banner caution (used for the lease-signing warning). */
  criticalWarningAr?: string;
  /** Renewal cadence — drives the future renewal-tracker UI. */
  renewalPeriodAr?: string;
  /** Official portal link — users are directed here for the actual filing. */
  officialUrl?: string;
  /** Checklist of what the user needs to gather/have in place for this entity.
   *  Populated by each specialist agent (class-based runtime). */
  requirements?: string[];
}

export interface Vertical {
  id: VerticalId;
  labelAr: string;
  /** True when the vertical has a populated entity list. Reserved for any
   *  future vertical that ships without the full detail layer. */
  shipsInMvp: boolean;
  /** Extra entities on top of the always-required baseline. */
  entities: GovEntity[];
}

/* ------------------------------------------------------------------------- */
/* Baseline — applies to every establishment regardless of vertical           */
/* ------------------------------------------------------------------------- */

export const ALWAYS_REQUIRED: readonly GovEntity[] = [
  {
    id: 'mci',
    nameAr: 'وزارة التجارة',
    nameSimpleAr: 'السجل التجاري',
    explainAr:
      'أول خطوة لأي مشروع — تسجّل شركتك رسمياً. فكّر فيه مثل شهادة الميلاد للمشروع.',
    estimatedCostSar: { min: 200, max: 1600 },
    estimatedTimeAr: 'يوم واحد (إلكتروني)',
    order: 1,
    dependencies: [],
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://mc.gov.sa',
  },
  {
    id: 'zatca',
    nameAr: 'هيئة الزكاة والضريبة والجمارك',
    nameSimpleAr: 'التسجيل الضريبي',
    explainAr: 'تسجّل ضريبياً عشان تقدر تصدر فواتير رسمية. إلزامي لكل شركة.',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'يوم واحد (إلكتروني)',
    order: 2,
    dependencies: ['mci'],
    officialUrl: 'https://zatca.gov.sa',
  },
  {
    id: 'mol',
    nameAr: 'وزارة الموارد البشرية',
    nameSimpleAr: 'ملف المنشأة + نطاقات',
    explainAr: 'تفتح ملف لمنشأتك عشان تقدر توظف ناس — سعوديين أو غيرهم.',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'يوم واحد (إلكتروني)',
    order: 3,
    dependencies: ['mci'],
    officialUrl: 'https://www.hrsd.gov.sa',
  },
  {
    id: 'gosi',
    nameAr: 'المؤسسة العامة للتأمينات الاجتماعية',
    nameSimpleAr: 'تسجيل التأمينات',
    explainAr: 'تسجّل موظفينك في التأمينات — حقهم النظامي وإلزامي عليك.',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'يوم واحد (إلكتروني)',
    order: 4,
    dependencies: ['mol'],
    renewalPeriodAr: 'اشتراك شهري',
    officialUrl: 'https://www.gosi.gov.sa',
  },
];

/* ------------------------------------------------------------------------- */
/* Vertical-specific entities                                                 */
/* ------------------------------------------------------------------------- */

const RESTAURANT_ENTITIES: GovEntity[] = [
  {
    id: 'civil_defense',
    nameAr: 'الدفاع المدني',
    nameSimpleAr: 'شهادة السلامة',
    explainAr:
      'يفحصون محلك ويتأكدون إن فيه طفايات حريق ومخارج طوارئ وكل متطلبات السلامة.',
    estimatedCostSar: { min: 200, max: 1000 },
    estimatedTimeAr: '٣ إلى ١٤ يوم (يحتاج زيارة ميدانية)',
    order: 5,
    dependencies: ['mci'],
    criticalWarningAr:
      'هذي الخطوة غالباً تجي قبل رخصة البلدية — كثير ناس يتفاجؤون بهذا الترتيب. تأكّد من موقع البلدية بخصوص التسلسل الصحيح لحيّك.',
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://www.998.gov.sa',
  },
  {
    id: 'municipality',
    nameAr: 'أمانة المنطقة (بلدي)',
    nameSimpleAr: 'رخصة البلدية',
    explainAr: 'الرخصة اللي تسمح لك تفتح محلك في هالموقع. بدونها ما تقدر تشغّل.',
    estimatedCostSar: { min: 500, max: 3000 },
    estimatedTimeAr: '٣ إلى ٧ أيام',
    order: 6,
    dependencies: ['civil_defense'],
    commonMistakeAr:
      'لا تعتمد على وعد شفهي من المالك إن الموقع "يطلع له رخصة". تحقّق من منصة بلدي بنفسك قبل التوقيع.',
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://balady.gov.sa',
  },
  {
    id: 'sfda',
    nameAr: 'الهيئة العامة للغذاء والدواء',
    nameSimpleAr: 'ترخيص الغذاء (SFDA)',
    explainAr:
      'لأنك بتقدم أكل ومشروبات — هالجهة تتأكد إن المكان نظيف وآمن صحياً.',
    estimatedCostSar: { min: 1000, max: 3000 },
    estimatedTimeAr: '٧ إلى ١٤ يوم',
    order: 7,
    dependencies: ['municipality'],
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://sfda.gov.sa',
  },
];

const TECH_ENTITIES: GovEntity[] = [
  {
    id: 'pdpl_readiness',
    nameAr: 'نظام حماية البيانات الشخصية (PDPL)',
    nameSimpleAr: 'جاهزية PDPL',
    explainAr:
      'لأن تطبيقك سيجمع بيانات مستخدمين سعوديين، لازم من اليوم الأول تكون عندك سياسة خصوصية ومسار موافقة وخطة استجابة. المخالفة غرامتها تصل ٥ ملايين ريال.',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'مستمر — يبدأ قبل أول إطلاق',
    order: 5,
    dependencies: ['mci'],
    renewalPeriodAr: 'مستمر',
    officialUrl: 'https://sdaia.gov.sa',
  },
  {
    id: 'zatca_einvoice_onboarding',
    nameAr: 'ZATCA — الفوترة الإلكترونية (المرحلة الثانية)',
    nameSimpleAr: 'ربط الفوترة الإلكترونية',
    explainAr:
      'بعد التسجيل الضريبي الأساسي، منصّتك لازم ترتبط فنياً مع نظام ZATCA (Fatoora) — إصدار XML، ختم رقمي معتمد، وربط مباشر في المرحلة الثانية. هذا غير التسجيل الضريبي العادي.',
    estimatedCostSar: { min: 500, max: 3_000 },
    estimatedTimeAr: '٧ إلى ١٤ يوم (تطوير الربط + اعتماد)',
    order: 6,
    dependencies: ['zatca'],
    commonMistakeAr:
      'الربط ليس مجرد تسجيل — هو تطوير تقني فعلي في الـ POS أو نظام الفوترة، واختبار مع بيئة ZATCA التجريبية قبل الإنتاج.',
    renewalPeriodAr: 'مستمر',
    officialUrl: 'https://zatca.gov.sa',
  },
];

const SALON_ENTITIES: GovEntity[] = [
  {
    id: 'civil_defense_salon',
    nameAr: 'الدفاع المدني',
    nameSimpleAr: 'شهادة السلامة',
    explainAr:
      'الصالونات تحتاج متطلبات سلامة أساسية: طفايات حريق، مخرج طوارئ واضح، تهوية جيدة خاصة مع استخدام مواد كيميائية (صبغات، مذيبات).',
    estimatedCostSar: { min: 200, max: 800 },
    estimatedTimeAr: '٣ إلى ١٤ يوم (يحتاج زيارة ميدانية)',
    order: 5,
    dependencies: ['mci'],
    criticalWarningAr:
      'شهادة السلامة غالباً تسبق رخصة البلدية — تحقق من التسلسل الصحيح لحيّك على منصة بلدي قبل البدء.',
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://www.998.gov.sa',
  },
  {
    id: 'municipality_salon',
    nameAr: 'أمانة المنطقة (بلدي) — نشاط صالون/تجميل',
    nameSimpleAr: 'رخصة البلدية',
    explainAr:
      'رخصة تشغيل الصالون من الأمانة. البلدية تشترط مساحة دنيا لكل كرسي، فصل بين قسم النساء والرجال في بعض الأنشطة، ومعايير صحية أساسية.',
    estimatedCostSar: { min: 500, max: 2_000 },
    estimatedTimeAr: '٣ إلى ٧ أيام',
    order: 6,
    dependencies: ['civil_defense_salon'],
    commonMistakeAr:
      'تأكد من مطابقة نشاط المحل على منصة بلدي قبل التوقيع على الإيجار — مش كل المواقع مرخّصة لنشاط تجميلي.',
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://balady.gov.sa',
  },
  {
    id: 'moh_salon_license',
    nameAr: 'وزارة الصحة — الترخيص الصحي',
    nameSimpleAr: 'الترخيص الصحي',
    explainAr:
      'لأن الصالون يتعامل مع البشرة والشعر — الوزارة تتطلب ترخيص صحي يتأكد من النظافة وتعقيم الأدوات وتأهيل الكادر.',
    estimatedCostSar: { min: 500, max: 2_000 },
    estimatedTimeAr: '٧ إلى ١٤ يوم',
    order: 7,
    dependencies: ['municipality_salon'],
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://www.moh.gov.sa',
  },
];

const CONSTRUCTION_ENTITIES: GovEntity[] = [
  {
    id: 'civil_defense_office',
    nameAr: 'الدفاع المدني',
    nameSimpleAr: 'شهادة سلامة المكتب',
    explainAr:
      'حتى لو مكتب إداري بسيط للمقاولات — الدفاع المدني يتطلب معايير سلامة أساسية: طفايات، مخرج طوارئ، ولوحات إرشادية.',
    estimatedCostSar: { min: 150, max: 500 },
    estimatedTimeAr: '٣ إلى ١٠ أيام',
    order: 5,
    dependencies: ['mci'],
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://www.998.gov.sa',
  },
  {
    id: 'municipality_office',
    nameAr: 'أمانة المنطقة (بلدي)',
    nameSimpleAr: 'رخصة مكتب مقاولات',
    explainAr:
      'رخصة تشغيل المكتب. بعض الأمانات تطلب موقفاً مخصّصاً أو مساحة دنيا حسب نوع التصنيف المطلوب.',
    estimatedCostSar: { min: 500, max: 2_000 },
    estimatedTimeAr: '٣ إلى ٧ أيام',
    order: 6,
    dependencies: ['civil_defense_office'],
    renewalPeriodAr: 'سنوي',
    officialUrl: 'https://balady.gov.sa',
  },
  {
    id: 'contractor_classification',
    nameAr: 'تصنيف المقاولين',
    nameSimpleAr: 'شهادة التصنيف',
    explainAr:
      'من وكالة التصنيف في وزارة البلديات والإسكان. التصنيف يحدد الفئات والحدود المالية للمشاريع اللي تقدر تاخذها — خصوصاً للمشاريع الحكومية. بدون تصنيف، خيارات المنافسة على مشاريع كبيرة محدودة جداً.',
    estimatedCostSar: { min: 1_000, max: 5_000 },
    estimatedTimeAr: '١٤ إلى ٣٠ يوم',
    order: 7,
    dependencies: ['municipality_office'],
    commonMistakeAr:
      'التصنيف يتطلب إثبات كفاءات فنية وإدارية ورأس مال — جهّز المستندات مسبقاً لتقليل دورات الاستكمال.',
    renewalPeriodAr: 'كل 3 سنوات',
    officialUrl: 'https://momrah.gov.sa',
  },
];

const ECOMMERCE_ENTITIES: GovEntity[] = [
  {
    id: 'maroof',
    nameAr: 'منصة معروف',
    nameSimpleAr: 'توثيق المتجر',
    explainAr:
      'منصة من وزارة التجارة توثّق متجرك الإلكتروني — تزيد ثقة العملاء وتساعدك في حل النزاعات.',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'يوم واحد',
    order: 3,
    dependencies: ['mci'],
    officialUrl: 'https://maroof.sa',
  },
  ...TECH_ENTITIES,
];

export const VERTICALS: Record<VerticalId, Vertical> = {
  restaurant: {
    id: 'restaurant',
    labelAr: 'مطعم / كوفي شوب',
    shipsInMvp: true,
    entities: RESTAURANT_ENTITIES,
  },
  tech: {
    id: 'tech',
    labelAr: 'شركة تقنية / تطبيق',
    shipsInMvp: true,
    entities: TECH_ENTITIES,
  },
  services: {
    id: 'services',
    labelAr: 'متجر إلكتروني',
    shipsInMvp: true,
    entities: ECOMMERCE_ENTITIES,
  },
  salon: {
    id: 'salon',
    labelAr: 'صالون / مركز تجميل',
    shipsInMvp: true,
    entities: SALON_ENTITIES,
  },
  construction: {
    id: 'construction',
    labelAr: 'مقاولات / بناء',
    shipsInMvp: true,
    entities: CONSTRUCTION_ENTITIES,
  },
};

/* ------------------------------------------------------------------------- */
/* Resolver — compose the full entity list for a vertical + sort by order     */
/* ------------------------------------------------------------------------- */

export function resolveEntities(verticalId: VerticalId): GovEntity[] {
  const vertical = VERTICALS[verticalId];
  if (!vertical || !vertical.shipsInMvp) return [];
  return [...ALWAYS_REQUIRED, ...vertical.entities].sort((a, b) => a.order - b.order);
}

/**
 * Group the entity list into weekly buckets the UI can render as a roadmap.
 * We use dependencies + order to compute a simple critical-path schedule:
 * each week contains entities whose deps are satisfied by the previous week.
 */
export interface RoadmapWeek {
  label: string;      // "الأسبوع الأول" …
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
      // Graph issue — shove remaining into a final bucket rather than loop.
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
