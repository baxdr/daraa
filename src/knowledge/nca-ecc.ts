/**
 * NCA Essential Cybersecurity Controls (ECC-1:2018, refreshed 2024) knowledge base.
 *
 * Source: National Cybersecurity Authority (الهيئة الوطنية للأمن السيبراني).
 * 114 controls organized across 5 main domains:
 *
 *   1. Cybersecurity Governance      (ECC-1)  — 25 controls
 *   2. Cybersecurity Defence         (ECC-2)  — 50 controls
 *   3. Cybersecurity Resilience      (ECC-3)  — 10 controls
 *   4. Third-Party + Cloud Security  (ECC-4)  — 10 controls
 *   5. Industrial Control Systems    (ECC-5)  — 19 controls
 *
 * IMPORTANT — applicability:
 * NCA-ECC is mandatory for *government entities and their suppliers / partners
 * who handle CII (critical infrastructure information)*. It is NOT a general
 * private-sector regulation. The `nca_ecc` specialist agent surfaces controls
 * only when the project profile indicates B2G exposure (services to a
 * government entity, ICT supplier, or critical-sector entity).
 *
 * This file is the canonical control catalog. Per-control evidence checks
 * live in the scanner module (pdpl.ts ScanSignalMap currently covers 4 of
 * these — security headers — but is intentionally not the full mapping;
 * NCA-ECC compliance is largely process + documentation, not URL-scannable).
 */

import type { Severity } from '@/agents/types';

export type EccDomainId = 'governance' | 'defence' | 'resilience' | 'third_party' | 'ics';

export interface EccDomain {
  id: EccDomainId;
  /** ECC-N prefix used in control ids (1=governance, 2=defence, etc). */
  prefix: 1 | 2 | 3 | 4 | 5;
  titleAr: string;
  descriptionAr: string;
}

export interface EccControl {
  /** Format: ECC-{domain}-{subdomain}-{control}, e.g. "ECC-1-3-2". */
  id: string;
  domain: EccDomainId;
  /** Subdomain Arabic title — e.g. "استراتيجية الأمن السيبراني". */
  subdomainAr: string;
  /** Concise control title in Arabic. */
  titleAr: string;
  /** Required action — what the entity must do/have. */
  requirementAr: string;
  severity: Severity;
  /** When this control is in scope:
   *  - 'all'             → every CII / B2G entity
   *  - 'government_only' → public-sector bodies only
   *  - 'critical_infra'  → critical infrastructure operators
   *  - 'ics_only'        → entities running industrial control systems
   *  - 'cloud_users'     → entities using public cloud
   *  - 'large_only'      → entities ≥250 staff or ≥1bn SAR turnover */
  appliesTo:
    | 'all'
    | 'government_only'
    | 'critical_infra'
    | 'ics_only'
    | 'cloud_users'
    | 'large_only';
  /** Type of evidence the auditor expects. */
  evidenceType: 'policy' | 'technical' | 'process' | 'training' | 'contract';
}

export const ECC_DOMAINS: readonly EccDomain[] = [
  {
    id: 'governance',
    prefix: 1,
    titleAr: 'حوكمة الأمن السيبراني',
    descriptionAr: 'استراتيجيات وسياسات وأدوار وإدارة المخاطر والامتثال.',
  },
  {
    id: 'defence',
    prefix: 2,
    titleAr: 'تعزيز الأمن السيبراني',
    descriptionAr: 'الضوابط الفنية والتشغيلية لحماية الأصول من التهديدات.',
  },
  {
    id: 'resilience',
    prefix: 3,
    titleAr: 'صمود الأمن السيبراني',
    descriptionAr: 'الاستمرارية والتعافي من الكوارث وقابلية الصمود السيبراني.',
  },
  {
    id: 'third_party',
    prefix: 4,
    titleAr: 'الأمن السيبراني للأطراف الخارجية والحوسبة السحابية',
    descriptionAr: 'إدارة مخاطر الموردين ومزودي الخدمات السحابية.',
  },
  {
    id: 'ics',
    prefix: 5,
    titleAr: 'الأمن السيبراني لأنظمة التحكم الصناعي',
    descriptionAr: 'حماية أنظمة OT/SCADA في القطاعات الحيوية.',
  },
] as const;

/* ───────────────────────── Domain 1 — Governance (25) ────────────────────── */

const GOVERNANCE_CONTROLS: EccControl[] = [
  {
    id: 'ECC-1-1-1',
    domain: 'governance',
    subdomainAr: 'استراتيجية الأمن السيبراني',
    titleAr: 'وضع استراتيجية أمن سيبراني موثّقة',
    requirementAr: 'يجب وضع وتوثيق واعتماد استراتيجية للأمن السيبراني تتوافق مع الأهداف المؤسسية.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-1-2',
    domain: 'governance',
    subdomainAr: 'استراتيجية الأمن السيبراني',
    titleAr: 'تحديث الاستراتيجية دورياً',
    requirementAr:
      'يجب مراجعة وتحديث استراتيجية الأمن السيبراني كل ثلاث سنوات أو عند التغيرات الجوهرية.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-2-1',
    domain: 'governance',
    subdomainAr: 'إدارة الأمن السيبراني',
    titleAr: 'تأسيس إدارة الأمن السيبراني',
    requirementAr:
      'يجب تأسيس إدارة مستقلة للأمن السيبراني ترفع تقاريرها مباشرة لأعلى مسؤول تنفيذي وليست تابعة لتقنية المعلومات.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-2-2',
    domain: 'governance',
    subdomainAr: 'إدارة الأمن السيبراني',
    titleAr: 'تعيين رئيس الأمن السيبراني (CISO)',
    requirementAr:
      'يجب تعيين رئيس مختص للأمن السيبراني (CISO) من المواطنين السعوديين بكفاءة موثّقة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-3-1',
    domain: 'governance',
    subdomainAr: 'سياسات الأمن السيبراني',
    titleAr: 'وضع سياسة شاملة للأمن السيبراني',
    requirementAr:
      'يجب وضع سياسة شاملة موثّقة معتمدة من الإدارة العليا تغطي كل ضوابط ECC ذات الصلة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-3-2',
    domain: 'governance',
    subdomainAr: 'سياسات الأمن السيبراني',
    titleAr: 'تعميم السياسات على الموظفين',
    requirementAr:
      'يجب تعميم السياسات على جميع الموظفين والأطراف ذوي العلاقة مع توثيق إقرار الاطلاع.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-3-3',
    domain: 'governance',
    subdomainAr: 'سياسات الأمن السيبراني',
    titleAr: 'مراجعة السياسات سنوياً',
    requirementAr: 'يجب مراجعة كل سياسة على الأقل مرة سنوياً وتوثيق نتيجة المراجعة.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-4-1',
    domain: 'governance',
    subdomainAr: 'الأدوار والمسؤوليات',
    titleAr: 'توثيق أدوار ومسؤوليات الأمن السيبراني',
    requirementAr:
      'يجب توثيق جميع الأدوار والمسؤوليات والصلاحيات المتعلقة بالأمن السيبراني واعتمادها.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-4-2',
    domain: 'governance',
    subdomainAr: 'الأدوار والمسؤوليات',
    titleAr: 'الفصل بين الواجبات',
    requirementAr:
      'يجب تطبيق مبدأ الفصل بين الواجبات لمنع تضارب المصالح في عمليات الأمن السيبراني.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-5-1',
    domain: 'governance',
    subdomainAr: 'إدارة المخاطر',
    titleAr: 'تطبيق منهجية إدارة مخاطر الأمن السيبراني',
    requirementAr:
      'يجب تبنّي منهجية موثّقة لتقييم وعلاج مخاطر الأمن السيبراني تتماشى مع NIST أو ISO 27005.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-5-2',
    domain: 'governance',
    subdomainAr: 'إدارة المخاطر',
    titleAr: 'تقييم المخاطر دورياً',
    requirementAr:
      'يجب إجراء تقييم رسمي للمخاطر السيبرانية على الأقل مرة سنوياً وتوثيق الخطة العلاجية.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-5-3',
    domain: 'governance',
    subdomainAr: 'إدارة المخاطر',
    titleAr: 'سجل مخاطر سيبرانية مُحدَّث',
    requirementAr: 'يجب الاحتفاظ بسجل مركزي للمخاطر السيبرانية يتم تحديثه مع كل تغيير جوهري.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-6-1',
    domain: 'governance',
    subdomainAr: 'مشاريع تقنية المعلومات',
    titleAr: 'دمج الأمن السيبراني في دورة حياة المشاريع',
    requirementAr:
      'يجب إدماج اعتبارات الأمن السيبراني في كل مراحل دورة حياة مشاريع تقنية المعلومات.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-7-1',
    domain: 'governance',
    subdomainAr: 'الامتثال',
    titleAr: 'الامتثال للأنظمة والتشريعات',
    requirementAr:
      'يجب التأكد من الامتثال لكل الأنظمة والتشريعات الوطنية ذات الصلة بالأمن السيبراني.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-1-8-1',
    domain: 'governance',
    subdomainAr: 'المراجعة والتدقيق',
    titleAr: 'مراجعة دورية مستقلة',
    requirementAr: 'يجب إجراء مراجعة دورية مستقلة للأمن السيبراني (سنوياً على الأقل).',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-8-2',
    domain: 'governance',
    subdomainAr: 'المراجعة والتدقيق',
    titleAr: 'متابعة نتائج المراجعة',
    requirementAr: 'يجب توثيق كل ملاحظات المراجعة ومتابعة معالجتها بخطة زمنية معتمدة.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-9-1',
    domain: 'governance',
    subdomainAr: 'الموارد البشرية',
    titleAr: 'فحص الموظفين قبل التوظيف',
    requirementAr: 'يجب إجراء فحص أمني للموظفين الذين سيتعاملون مع الأنظمة الحساسة قبل تعيينهم.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-9-2',
    domain: 'governance',
    subdomainAr: 'الموارد البشرية',
    titleAr: 'إجراءات إنهاء الخدمة',
    requirementAr:
      'يجب وضع إجراءات لسحب الصلاحيات والأصول وإلغاء حسابات الوصول فور إنهاء أي موظف لخدمته.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-10-1',
    domain: 'governance',
    subdomainAr: 'التوعية والتدريب',
    titleAr: 'برنامج توعية مستمر',
    requirementAr: 'يجب تنفيذ برنامج توعية بالأمن السيبراني يستهدف كافة الموظفين بشكل مستمر.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'training',
  },
  {
    id: 'ECC-1-10-2',
    domain: 'governance',
    subdomainAr: 'التوعية والتدريب',
    titleAr: 'تدريب متخصّص لذوي الصلاحيات الحساسة',
    requirementAr:
      'يجب تدريب ذوي الصلاحيات الحساسة (مدراء الأنظمة، CISO، مطورون) على متطلبات أعمالهم.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'training',
  },
  {
    id: 'ECC-1-10-3',
    domain: 'governance',
    subdomainAr: 'التوعية والتدريب',
    titleAr: 'محاكاة هجمات التصيّد',
    requirementAr:
      'يجب إجراء محاكاة دورية لهجمات التصيّد الإلكتروني لقياس مستوى الوعي وعلاج الثغرات.',
    severity: 'medium',
    appliesTo: 'large_only',
    evidenceType: 'training',
  },
  {
    id: 'ECC-1-11-1',
    domain: 'governance',
    subdomainAr: 'تصنيف المعلومات',
    titleAr: 'تصنيف الأصول المعلوماتية',
    requirementAr:
      'يجب تصنيف كل الأصول المعلوماتية حسب مستوى الحساسية (سري — مقيّد — داخلي — عام) مع علامات واضحة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-11-2',
    domain: 'governance',
    subdomainAr: 'تصنيف المعلومات',
    titleAr: 'حماية الأصول حسب التصنيف',
    requirementAr: 'يجب أن تتطابق ضوابط الحماية مع مستوى التصنيف للأصل.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-1-12-1',
    domain: 'governance',
    subdomainAr: 'إدارة الوثائق',
    titleAr: 'الاحتفاظ بسجلات أمن سيبراني',
    requirementAr: 'يجب الاحتفاظ بسجلات أنشطة الأمن السيبراني لمدة لا تقل عن سنتين.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-1-13-1',
    domain: 'governance',
    subdomainAr: 'مؤشرات الأداء',
    titleAr: 'قياس مؤشرات أداء الأمن السيبراني',
    requirementAr:
      'يجب تحديد ومتابعة مؤشرات أداء (KPIs) للأمن السيبراني وتقديم تقارير دورية للإدارة.',
    severity: 'medium',
    appliesTo: 'large_only',
    evidenceType: 'process',
  },
];

/* ───────────────────────── Domain 2 — Defence (50) ────────────────────────── */

const DEFENCE_CONTROLS: EccControl[] = [
  // إدارة الأصول (5)
  {
    id: 'ECC-2-1-1',
    domain: 'defence',
    subdomainAr: 'إدارة الأصول',
    titleAr: 'جرد الأصول المعلوماتية',
    requirementAr: 'يجب الاحتفاظ بسجل محدّث لكل الأصول المعلوماتية مع مالك ومستوى تصنيف لكل أصل.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-1-2',
    domain: 'defence',
    subdomainAr: 'إدارة الأصول',
    titleAr: 'إدارة دورة حياة الأصول',
    requirementAr: 'يجب توثيق دورة حياة كل أصل من الاقتناء حتى الإتلاف الآمن.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-1-3',
    domain: 'defence',
    subdomainAr: 'إدارة الأصول',
    titleAr: 'تصنيف الأصول حسب الحساسية',
    requirementAr:
      'يجب تصنيف كل أصل معلوماتي حسب الحساسية (سري — مقيّد — داخلي — عام) ووضع علامة واضحة عليه.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  // إدارة الهويات والصلاحيات (8)
  {
    id: 'ECC-2-2-1',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'هويات فريدة لكل مستخدم',
    requirementAr: 'يجب أن يكون لكل مستخدم هوية فريدة لا تُشارك مع غيره.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-2-2',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'مبدأ أقل الصلاحيات',
    requirementAr: 'يجب منح المستخدمين أقل قدر من الصلاحيات اللازمة لأداء مهامهم.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-2-3',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'مراجعة الصلاحيات دورياً',
    requirementAr: 'يجب مراجعة صلاحيات المستخدمين كل ٦ أشهر على الأقل وتوثيق نتيجة المراجعة.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-2-4',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'سياسة كلمات المرور',
    requirementAr:
      'يجب فرض سياسة كلمات مرور قوية: ١٢ خانة على الأقل، خليط أنواع، تغيير دوري، حظر إعادة الاستخدام.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-2-5',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'التحقق متعدد العوامل (MFA)',
    requirementAr: 'يجب تفعيل التحقق متعدد العوامل لكل الوصول عن بُعد ولكل الحسابات الإدارية.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-2-6',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'إدارة الحسابات الإدارية',
    requirementAr: 'يجب فصل الحسابات الإدارية عن الحسابات العادية وتفعيل تسجيل كامل لأنشطتها.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-2-7',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'إقفال الجلسات الخاملة',
    requirementAr: 'يجب إقفال الجلسات بعد فترة خمول لا تتجاوز ١٥ دقيقة.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-2-8',
    domain: 'defence',
    subdomainAr: 'إدارة الهويات والوصول',
    titleAr: 'حسابات الطوارئ والافتراضية',
    requirementAr: 'يجب تعطيل الحسابات الافتراضية وعمل حسابات طوارئ موثّقة بضوابط استثنائية.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  // حماية الأنظمة وأجهزة الحاسب (6)
  {
    id: 'ECC-2-3-1',
    domain: 'defence',
    subdomainAr: 'حماية الأنظمة والأجهزة',
    titleAr: 'تطبيق التحديثات الأمنية',
    requirementAr: 'يجب تطبيق التحديثات الأمنية الحرجة خلال ٧ أيام من إطلاقها.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-3-2',
    domain: 'defence',
    subdomainAr: 'حماية الأنظمة والأجهزة',
    titleAr: 'مكافحة البرامج الضارة',
    requirementAr: 'يجب تثبيت حلول مكافحة البرامج الضارة محدّثة بشكل تلقائي على كل الأجهزة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-3-3',
    domain: 'defence',
    subdomainAr: 'حماية الأنظمة والأجهزة',
    titleAr: 'تقوية إعدادات الأنظمة (Hardening)',
    requirementAr: 'يجب تطبيق معايير تقوية معتمدة (CIS Benchmarks أو ما يعادلها) لكل الأنظمة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-3-4',
    domain: 'defence',
    subdomainAr: 'حماية الأنظمة والأجهزة',
    titleAr: 'حظر الأجهزة الخارجية',
    requirementAr: 'يجب التحكم في استخدام أجهزة التخزين الخارجية (USB) وحظرها افتراضياً.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-3-5',
    domain: 'defence',
    subdomainAr: 'حماية الأنظمة والأجهزة',
    titleAr: 'إدارة التغييرات',
    requirementAr: 'يجب توثيق واعتماد كل التغييرات على الأنظمة الإنتاجية مع خطة تراجع.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-3-6',
    domain: 'defence',
    subdomainAr: 'حماية الأنظمة والأجهزة',
    titleAr: 'إدارة الثغرات الأمنية',
    requirementAr: 'يجب إجراء فحص دوري للثغرات (شهري على الأقل) ومعالجة الحرجة خلال ١٤ يوم.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-3-7',
    domain: 'defence',
    subdomainAr: 'حماية الأنظمة والأجهزة',
    titleAr: 'إدارة الأجهزة المحمولة (MDM)',
    requirementAr:
      'يجب إدارة الأجهزة المحمولة المؤسسية (MDM) وفرض ضوابط أمنية: تشفير، قفل عن بُعد، فصل بيانات العمل عن الشخصية.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  // حماية البريد الإلكتروني (3)
  {
    id: 'ECC-2-4-1',
    domain: 'defence',
    subdomainAr: 'حماية البريد الإلكتروني',
    titleAr: 'حماية البريد من التصيّد والبرامج الضارة',
    requirementAr:
      'يجب تطبيق حلول لحماية البريد الإلكتروني من التصيّد والبرامج الضارة والرسائل المزعجة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-4-2',
    domain: 'defence',
    subdomainAr: 'حماية البريد الإلكتروني',
    titleAr: 'تطبيق SPF / DKIM / DMARC',
    requirementAr: 'يجب تكوين سجلات SPF و DKIM و DMARC لكل نطاقات البريد الإلكتروني.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-4-3',
    domain: 'defence',
    subdomainAr: 'حماية البريد الإلكتروني',
    titleAr: 'تشفير البريد الحساس',
    requirementAr: 'يجب تشفير البريد الإلكتروني الحاوي على معلومات سرية أو مقيّدة أثناء الإرسال.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  // إدارة الشبكات (8)
  {
    id: 'ECC-2-5-1',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'تقسيم الشبكة منطقياً',
    requirementAr: 'يجب تقسيم الشبكة إلى مناطق منطقية حسب مستوى الحساسية مع تحكم بالمرور بينها.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-5-2',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'جدران حماية محيطية',
    requirementAr: 'يجب نشر جدران حماية على محيط الشبكة مع سياسة مرور صريحة (deny-by-default).',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-5-3',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'كشف ومنع التسلل (IDS/IPS)',
    requirementAr: 'يجب نشر أنظمة كشف ومنع التسلل في النقاط الحرجة من الشبكة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-5-4',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'تأمين الوصول عن بُعد',
    requirementAr: 'يجب أن يمر أي وصول عن بُعد عبر VPN موثّق مع MFA وتسجيل كامل.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-5-5',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'تأمين شبكات لاسلكية',
    requirementAr: 'يجب تشفير الشبكات اللاسلكية بـ WPA3 على الأقل وفصل شبكة الزوار.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-5-6',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'حماية أنظمة DNS',
    requirementAr: 'يجب حماية أنظمة DNS من التلاعب وتفعيل DNSSEC للنطاقات الحساسة.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-5-7',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'منع هجمات DDoS',
    requirementAr:
      'يجب وجود حلول لكشف ومواجهة هجمات الحرمان من الخدمة الموزّعة (DDoS) للخدمات العامة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-5-8',
    domain: 'defence',
    subdomainAr: 'إدارة الشبكات',
    titleAr: 'تسجيل أحداث الشبكة',
    requirementAr: 'يجب تسجيل كل الأحداث الشبكية الحرجة وتخزينها في سجل مركزي محمي.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  // التشفير (4)
  {
    id: 'ECC-2-6-1',
    domain: 'defence',
    subdomainAr: 'التشفير',
    titleAr: 'تشفير البيانات الحساسة في حالة السكون',
    requirementAr:
      'يجب تشفير البيانات الحساسة المخزّنة باستخدام خوارزميات معتمدة (AES-256 أو أقوى).',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-6-2',
    domain: 'defence',
    subdomainAr: 'التشفير',
    titleAr: 'تشفير البيانات أثناء النقل',
    requirementAr: 'يجب تشفير البيانات الحساسة أثناء النقل باستخدام TLS 1.2 أو أحدث.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-6-3',
    domain: 'defence',
    subdomainAr: 'التشفير',
    titleAr: 'إدارة المفاتيح التشفيرية',
    requirementAr: 'يجب وضع آلية لإدارة دورة حياة المفاتيح (إنشاء، تخزين، تدوير، إتلاف) بشكل آمن.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-6-4',
    domain: 'defence',
    subdomainAr: 'التشفير',
    titleAr: 'استخدام HSM للمفاتيح الحرجة',
    requirementAr: 'يجب تخزين المفاتيح الحرجة في وحدة HSM معتمدة (FIPS 140-2 Level 3 أو أعلى).',
    severity: 'critical',
    appliesTo: 'critical_infra',
    evidenceType: 'technical',
  },
  // النسخ الاحتياطي (3)
  {
    id: 'ECC-2-7-1',
    domain: 'defence',
    subdomainAr: 'النسخ الاحتياطي',
    titleAr: 'سياسة نسخ احتياطي موثّقة',
    requirementAr: 'يجب وضع سياسة موثّقة للنسخ الاحتياطي تحدد التواتر والمدة والمسؤوليات.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-2-7-2',
    domain: 'defence',
    subdomainAr: 'النسخ الاحتياطي',
    titleAr: 'نسخ مشفّرة وخارج الموقع',
    requirementAr: 'يجب أن تكون النسخ الاحتياطية مشفّرة ومحفوظة في موقع منفصل عن الإنتاج.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-7-3',
    domain: 'defence',
    subdomainAr: 'النسخ الاحتياطي',
    titleAr: 'اختبار الاسترجاع',
    requirementAr: 'يجب اختبار استرجاع النسخ الاحتياطية كل ٦ أشهر على الأقل وتوثيق النتائج.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  // إدارة سجلات الأحداث (3)
  {
    id: 'ECC-2-8-1',
    domain: 'defence',
    subdomainAr: 'إدارة الأحداث والسجلات',
    titleAr: 'تسجيل الأحداث الأمنية',
    requirementAr: 'يجب تسجيل كل الأحداث الأمنية المهمة على الأنظمة الحرجة وحفظها مركزياً.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-8-2',
    domain: 'defence',
    subdomainAr: 'إدارة الأحداث والسجلات',
    titleAr: 'مراجعة السجلات',
    requirementAr: 'يجب مراجعة السجلات الأمنية بشكل دوري ومتابعة الأحداث الشاذة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-8-3',
    domain: 'defence',
    subdomainAr: 'إدارة الأحداث والسجلات',
    titleAr: 'حماية السجلات من العبث',
    requirementAr: 'يجب حماية السجلات من التعديل أو الحذف غير المصرّح به.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  // الاستجابة للحوادث (4)
  {
    id: 'ECC-2-9-1',
    domain: 'defence',
    subdomainAr: 'إدارة الحوادث السيبرانية',
    titleAr: 'خطة استجابة للحوادث',
    requirementAr: 'يجب وضع خطة موثّقة للاستجابة للحوادث السيبرانية مع تحديد الأدوار والمسارات.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-2-9-2',
    domain: 'defence',
    subdomainAr: 'إدارة الحوادث السيبرانية',
    titleAr: 'فريق استجابة معتمد',
    requirementAr: 'يجب تشكيل فريق استجابة للحوادث (CSIRT) معتمد ومدرّب.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-9-3',
    domain: 'defence',
    subdomainAr: 'إدارة الحوادث السيبرانية',
    titleAr: 'الإبلاغ عن الحوادث للهيئة',
    requirementAr:
      'يجب إبلاغ الهيئة الوطنية للأمن السيبراني عن الحوادث الجوهرية وفق الأطر الزمنية.',
    severity: 'critical',
    appliesTo: 'critical_infra',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-9-4',
    domain: 'defence',
    subdomainAr: 'إدارة الحوادث السيبرانية',
    titleAr: 'محاكاة الحوادث',
    requirementAr: 'يجب محاكاة سيناريوهات حوادث على الأقل سنوياً وتحديث الخطة بناءً على النتائج.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'training',
  },
  // أمن التطوير وأمن التطبيقات (4)
  {
    id: 'ECC-2-10-1',
    domain: 'defence',
    subdomainAr: 'أمن التطبيقات',
    titleAr: 'دمج الأمن في دورة التطوير',
    requirementAr: 'يجب اعتماد منهجية SDLC آمنة تدمج الأمن في كل مراحل تطوير البرمجيات.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-2-10-2',
    domain: 'defence',
    subdomainAr: 'أمن التطبيقات',
    titleAr: 'فحص الكود',
    requirementAr: 'يجب فحص كود التطبيقات (SAST/DAST) قبل الإطلاق ومعالجة الثغرات الحرجة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-10-3',
    domain: 'defence',
    subdomainAr: 'أمن التطبيقات',
    titleAr: 'فصل بيئات التطوير والإنتاج',
    requirementAr: 'يجب الفصل التام بين بيئات التطوير والاختبار والإنتاج.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-10-4',
    domain: 'defence',
    subdomainAr: 'أمن التطبيقات',
    titleAr: 'حماية بيانات الاختبار',
    requirementAr: 'يجب عدم استخدام بيانات إنتاج حقيقية في بيئات الاختبار بدون إخفاء الهوية.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-10-5',
    domain: 'defence',
    subdomainAr: 'أمن التطبيقات',
    titleAr: 'حماية الواجهات البرمجية (APIs)',
    requirementAr:
      'يجب تأمين كل APIs المنشورة: مصادقة قوية، تحديد معدّل الطلبات، فحص المدخلات، توثيق رسمي محدّث.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  // الحماية المادية (2)
  {
    id: 'ECC-2-11-1',
    domain: 'defence',
    subdomainAr: 'الحماية المادية',
    titleAr: 'تأمين مراكز البيانات والأماكن الحساسة',
    requirementAr:
      'يجب تأمين الوصول المادي لمراكز البيانات وغرف الخوادم بأنظمة تحكم متعددة الطبقات.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-2-11-2',
    domain: 'defence',
    subdomainAr: 'الحماية المادية',
    titleAr: 'مراقبة الأماكن الحساسة بكاميرات',
    requirementAr:
      'يجب مراقبة المداخل والأماكن الحساسة بكاميرات وحفظ التسجيلات لمدة لا تقل عن ٩٠ يوماً.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
];

/* ───────────────────────── Domain 3 — Resilience (10) ─────────────────────── */

const RESILIENCE_CONTROLS: EccControl[] = [
  {
    id: 'ECC-3-1-1',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'وضع خطة استمرارية الأعمال',
    requirementAr: 'يجب وضع خطة استمرارية أعمال موثّقة تشمل سيناريوهات الهجمات السيبرانية.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-3-1-2',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'تحليل تأثير الأعمال (BIA)',
    requirementAr: 'يجب إجراء تحليل تأثير الأعمال لتحديد العمليات الحرجة وزمن الاسترجاع المسموح.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-3-1-3',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'موقع تعافي بديل',
    requirementAr:
      'يجب توفير موقع تعافي بديل (DR) قادر على استئناف العمليات الحرجة خلال RTO معتمد.',
    severity: 'critical',
    appliesTo: 'critical_infra',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-3-1-4',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'اختبار خطة الاستمرارية',
    requirementAr: 'يجب اختبار خطة الاستمرارية والتعافي مرة سنوياً على الأقل وتحديثها.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'training',
  },
  {
    id: 'ECC-3-1-5',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'تحديد RTO و RPO',
    requirementAr: 'يجب تحديد وتوثيق أهداف RTO و RPO لكل خدمة حرجة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-3-1-6',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'تكرار البنية التحتية الحرجة',
    requirementAr: 'يجب تكرار البنية التحتية الحرجة (Servers, Networks) لضمان توفر الخدمة.',
    severity: 'critical',
    appliesTo: 'critical_infra',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-3-1-7',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'تكامل الاستمرارية مع إدارة الحوادث',
    requirementAr: 'يجب أن تتكامل خطة الاستمرارية مع خطة إدارة الحوادث السيبرانية بشكل واضح.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-3-1-8',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'الاتصالات أثناء الأزمات',
    requirementAr: 'يجب وضع خطة اتصالات داخلية وخارجية موثّقة للتعامل مع أزمات الأمن السيبراني.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-3-1-9',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'حفظ النسخ الاحتياطية في موقع منفصل',
    requirementAr:
      'يجب حفظ نسخ احتياطية مشفّرة في موقع جغرافي منفصل عن الإنتاج للحماية من كوارث الموقع.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-3-1-10',
    domain: 'resilience',
    subdomainAr: 'استمرارية الأعمال السيبرانية',
    titleAr: 'مراجعة جاهزية الاستمرارية',
    requirementAr:
      'يجب مراجعة جاهزية الاستمرارية بعد كل تغيير جوهري على البنية التحتية أو الأعمال.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
];

/* ───────────────────── Domain 4 — Third-Party + Cloud (10) ────────────────── */

const THIRD_PARTY_CONTROLS: EccControl[] = [
  {
    id: 'ECC-4-1-1',
    domain: 'third_party',
    subdomainAr: 'إدارة مخاطر الأطراف الخارجية',
    titleAr: 'تقييم أمني قبل التعاقد',
    requirementAr: 'يجب إجراء تقييم أمني للموردين قبل التعاقد بناءً على حساسية الخدمة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-4-1-2',
    domain: 'third_party',
    subdomainAr: 'إدارة مخاطر الأطراف الخارجية',
    titleAr: 'بنود أمن سيبراني في العقود',
    requirementAr:
      'يجب تضمين بنود أمن سيبراني واضحة في كل عقود الموردين الذين يعالجون بيانات حساسة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'contract',
  },
  {
    id: 'ECC-4-1-3',
    domain: 'third_party',
    subdomainAr: 'إدارة مخاطر الأطراف الخارجية',
    titleAr: 'حق التدقيق',
    requirementAr:
      'يجب أن تتضمن العقود حق إجراء تدقيق أمني على الموردين أو الاستناد إلى تقارير معتمدة.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'contract',
  },
  {
    id: 'ECC-4-1-4',
    domain: 'third_party',
    subdomainAr: 'إدارة مخاطر الأطراف الخارجية',
    titleAr: 'مراقبة أداء الأمن السيبراني للموردين',
    requirementAr: 'يجب مراقبة التزام الموردين الحساسين بالضوابط الأمنية بشكل دوري.',
    severity: 'medium',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-4-1-5',
    domain: 'third_party',
    subdomainAr: 'إدارة مخاطر الأطراف الخارجية',
    titleAr: 'إنهاء التعاقد بشكل آمن',
    requirementAr:
      'يجب وضع إجراءات لإنهاء التعاقد بأمان: استرداد البيانات، إلغاء الصلاحيات، إتلاف النسخ.',
    severity: 'critical',
    appliesTo: 'all',
    evidenceType: 'process',
  },
  {
    id: 'ECC-4-2-1',
    domain: 'third_party',
    subdomainAr: 'الحوسبة السحابية',
    titleAr: 'استضافة البيانات الحساسة داخل المملكة',
    requirementAr:
      'يجب استضافة البيانات الحساسة على مزودين سحابيين معتمدين من الهيئة وداخل المملكة قدر الإمكان.',
    severity: 'critical',
    appliesTo: 'cloud_users',
    evidenceType: 'contract',
  },
  {
    id: 'ECC-4-2-2',
    domain: 'third_party',
    subdomainAr: 'الحوسبة السحابية',
    titleAr: 'تصنيف البيانات قبل الترحيل',
    requirementAr: 'يجب تصنيف البيانات قبل الترحيل إلى السحابة وتطبيق ضوابط مناسبة لكل مستوى.',
    severity: 'critical',
    appliesTo: 'cloud_users',
    evidenceType: 'process',
  },
  {
    id: 'ECC-4-2-3',
    domain: 'third_party',
    subdomainAr: 'الحوسبة السحابية',
    titleAr: 'تشفير من جهة العميل',
    requirementAr: 'يجب تشفير البيانات الحساسة من طرف العميل قبل تخزينها في السحابة (BYOK / HYOK).',
    severity: 'critical',
    appliesTo: 'cloud_users',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-4-2-4',
    domain: 'third_party',
    subdomainAr: 'الحوسبة السحابية',
    titleAr: 'الإفصاح عن مواقع البيانات',
    requirementAr: 'يجب الإفصاح والتوثيق عن المواقع الجغرافية لتخزين البيانات السحابية.',
    severity: 'medium',
    appliesTo: 'cloud_users',
    evidenceType: 'contract',
  },
  {
    id: 'ECC-4-2-5',
    domain: 'third_party',
    subdomainAr: 'الحوسبة السحابية',
    titleAr: 'ضمانات استمرارية مزود السحابة',
    requirementAr: 'يجب الحصول على ضمانات SLA واستمرارية ومسار خروج (Exit Plan) من مزود السحابة.',
    severity: 'critical',
    appliesTo: 'cloud_users',
    evidenceType: 'contract',
  },
];

/* ──────────────────────── Domain 5 — ICS / OT (19) ────────────────────────── */

const ICS_CONTROLS: EccControl[] = [
  {
    id: 'ECC-5-1-1',
    domain: 'ics',
    subdomainAr: 'حوكمة OT',
    titleAr: 'سياسة منفصلة لأمن أنظمة التحكم',
    requirementAr:
      'يجب وضع سياسة منفصلة لأمن أنظمة التحكم الصناعي تأخذ بعين الاعتبار الفروقات عن IT.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-5-1-2',
    domain: 'ics',
    subdomainAr: 'حوكمة OT',
    titleAr: 'فريق متخصّص لأمن OT',
    requirementAr: 'يجب وجود فريق أو دور متخصّص في أمن أنظمة التحكم الصناعي بكفاءات موثّقة.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'process',
  },
  {
    id: 'ECC-5-2-1',
    domain: 'ics',
    subdomainAr: 'الفصل بين IT و OT',
    titleAr: 'فصل شبكي تام بين IT و OT',
    requirementAr: 'يجب الفصل الشبكي التام بين بيئات IT و OT مع جدران حماية عالية الموثوقية.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-2-2',
    domain: 'ics',
    subdomainAr: 'الفصل بين IT و OT',
    titleAr: 'استخدام DMZ صناعية',
    requirementAr: 'يجب استخدام منطقة DMZ صناعية بين IT و OT لكل تبادل بيانات ضروري.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-2-3',
    domain: 'ics',
    subdomainAr: 'الفصل بين IT و OT',
    titleAr: 'حظر اتصال OT المباشر بالإنترنت',
    requirementAr:
      'يجب حظر اتصال أنظمة التحكم الصناعي مباشرة بالإنترنت إلا عبر مسارات معتمدة محكومة.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-3-1',
    domain: 'ics',
    subdomainAr: 'حماية أصول OT',
    titleAr: 'جرد كامل لأصول OT',
    requirementAr: 'يجب جرد كل أصول OT (PLC, RTU, SCADA, HMI) مع تحديد الحرجية والمالك.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'process',
  },
  {
    id: 'ECC-5-3-2',
    domain: 'ics',
    subdomainAr: 'حماية أصول OT',
    titleAr: 'تقوية أنظمة التحكم',
    requirementAr: 'يجب تقوية إعدادات أنظمة التحكم وفق توصيات المُصنّع وأطر مرجعية مثل IEC 62443.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-3-3',
    domain: 'ics',
    subdomainAr: 'حماية أصول OT',
    titleAr: 'إدارة تحديثات OT',
    requirementAr:
      'يجب وضع خطة موثّقة لإدارة تحديثات OT تأخذ بعين الاعتبار توفر العمليات والاختبار في بيئة منعزلة.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'process',
  },
  {
    id: 'ECC-5-4-1',
    domain: 'ics',
    subdomainAr: 'إدارة الوصول لأنظمة OT',
    titleAr: 'حسابات منفصلة لـ OT',
    requirementAr: 'يجب أن تكون حسابات الوصول لـ OT منفصلة تماماً عن حسابات IT.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-4-2',
    domain: 'ics',
    subdomainAr: 'إدارة الوصول لأنظمة OT',
    titleAr: 'الوصول عن بُعد لأنظمة OT',
    requirementAr: 'يجب أن يمر الوصول عن بُعد لـ OT عبر وسيط آمن (Jump Host) مع MFA وتسجيل كامل.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-4-3',
    domain: 'ics',
    subdomainAr: 'إدارة الوصول لأنظمة OT',
    titleAr: 'مراقبة وصول الموردين',
    requirementAr: 'يجب مراقبة كل أنشطة الموردين على أنظمة OT بشكل لحظي وتسجيلها.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-5-1',
    domain: 'ics',
    subdomainAr: 'كشف التهديدات OT',
    titleAr: 'حلول كشف خاصة بـ OT',
    requirementAr: 'يجب نشر حلول كشف تهديدات سلبية مصممة لـ OT لا تؤثر على أداء الأنظمة الصناعية.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-5-2',
    domain: 'ics',
    subdomainAr: 'كشف التهديدات OT',
    titleAr: 'مراقبة استمرارية البروتوكولات الصناعية',
    requirementAr: 'يجب مراقبة استمرارية وسلامة البروتوكولات الصناعية (Modbus, DNP3, OPC-UA).',
    severity: 'medium',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-6-1',
    domain: 'ics',
    subdomainAr: 'الاستجابة للحوادث في OT',
    titleAr: 'خطة استجابة خاصة بـ OT',
    requirementAr:
      'يجب وضع خطة استجابة للحوادث خاصة بـ OT تأخذ بعين الاعتبار السلامة البشرية والبيئية.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-5-6-2',
    domain: 'ics',
    subdomainAr: 'الاستجابة للحوادث في OT',
    titleAr: 'محاكاة حوادث OT',
    requirementAr: 'يجب إجراء محاكاة لحوادث OT (مثل هجوم على PLC) سنوياً وتدريب الفِرق.',
    severity: 'medium',
    appliesTo: 'ics_only',
    evidenceType: 'training',
  },
  {
    id: 'ECC-5-7-1',
    domain: 'ics',
    subdomainAr: 'استمرارية أعمال OT',
    titleAr: 'خطة استمرارية للعمليات الصناعية',
    requirementAr: 'يجب وضع خطة استمرارية مخصّصة للعمليات الصناعية تشمل أوضاع التشغيل اليدوي.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'policy',
  },
  {
    id: 'ECC-5-7-2',
    domain: 'ics',
    subdomainAr: 'استمرارية أعمال OT',
    titleAr: 'نسخ احتياطية لـ OT',
    requirementAr: 'يجب نسخ احتياطي لإعدادات أنظمة التحكم (PLC programs, HMI configs) بشكل آمن.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-8-1',
    domain: 'ics',
    subdomainAr: 'الحماية المادية لـ OT',
    titleAr: 'تأمين مادي لمحطات التحكم',
    requirementAr: 'يجب تأمين الوصول المادي لمحطات التحكم وغرف PLC بأنظمة تحكم متعددة الطبقات.',
    severity: 'critical',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
  {
    id: 'ECC-5-8-2',
    domain: 'ics',
    subdomainAr: 'الحماية المادية لـ OT',
    titleAr: 'مراقبة المداخل بكاميرات صناعية',
    requirementAr: 'يجب مراقبة كل مداخل غرف التحكم بكاميرات تستوفي المتطلبات الصناعية البيئية.',
    severity: 'medium',
    appliesTo: 'ics_only',
    evidenceType: 'technical',
  },
];

/* ─────────────────────────── Combined catalog ─────────────────────────────── */

export const ECC_CONTROLS: readonly EccControl[] = [
  ...GOVERNANCE_CONTROLS,
  ...DEFENCE_CONTROLS,
  ...RESILIENCE_CONTROLS,
  ...THIRD_PARTY_CONTROLS,
  ...ICS_CONTROLS,
] as const;

/* ──────────────────────────── Lookups ─────────────────────────────────────── */

export function getControlsForDomain(id: EccDomainId): readonly EccControl[] {
  return ECC_CONTROLS.filter((c) => c.domain === id);
}

export function getControlsByApplicability(
  applicability: EccControl['appliesTo'],
): readonly EccControl[] {
  return ECC_CONTROLS.filter((c) => c.appliesTo === applicability);
}

export function getCriticalControlCount(): number {
  return ECC_CONTROLS.filter((c) => c.severity === 'critical').length;
}

export const ECC_TOTAL_CONTROLS = ECC_CONTROLS.length;
