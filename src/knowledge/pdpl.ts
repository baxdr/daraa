/**
 * PDPL (Personal Data Protection Law, Royal Decree M/19 as amended) knowledge base.
 *
 * IMPORTANT (see DESIGN.md §15): All article numbers and fine ranges here
 * are conservative placeholders. Verify every citation against the current
 * PDPL text + implementing regulation before shipping to users.
 *
 * The canonical data subject rights list below intentionally contains five
 * entries — NOT the eight from GDPR that the original design brief copied.
 */

import type { Severity } from '@/agents/types';

export interface PdplRight {
  id: 'informed' | 'access' | 'copy' | 'correction' | 'destruction';
  nameAr: string;
  descriptionAr: string;
}

export const PDPL_DATA_SUBJECT_RIGHTS: readonly PdplRight[] = [
  {
    id: 'informed',
    nameAr: 'حق العلم',
    descriptionAr: 'أن يُعلم بالأساس النظامي والغرض من جمع البيانات الشخصية.',
  },
  { id: 'access', nameAr: 'حق الاطلاع', descriptionAr: 'الاطلاع على بياناته الشخصية لدى المتحكم.' },
  {
    id: 'copy',
    nameAr: 'حق الحصول على نسخة',
    descriptionAr: 'الحصول على نسخة من بياناته الشخصية بصيغة واضحة وقابلة للقراءة.',
  },
  {
    id: 'correction',
    nameAr: 'حق التصحيح',
    descriptionAr: 'طلب تصحيح أو استكمال أو تحديث بياناته الشخصية.',
  },
  {
    id: 'destruction',
    nameAr: 'حق الإتلاف',
    descriptionAr: 'طلب إتلاف بياناته الشخصية عند انتفاء الغرض من جمعها.',
  },
] as const;

export interface PdplRule {
  id: string;
  titleAr: string;
  requirementAr: string;
  severity: Severity;
  appliesTo: 'all' | 'large_processors' | 'cross_border';
  /** Max fine in SAR — statutory ceiling, NOT a prediction. */
  fineCapSar: number;
  /** Which scanner signal maps to this rule. */
  signal?: keyof ScanSignalMap;
}

export interface ScanSignalMap {
  // Signals from answers alone (available even without a URL).
  dpo_appointed: boolean;

  // Privacy-policy signals (from the scan).
  privacy_policy_found: boolean;
  privacy_policy_arabic: boolean;
  mentions_pdpl: boolean;
  purpose_stated: boolean;
  legal_basis_stated: boolean;
  retention_stated: boolean;
  dpo_contact_listed: boolean;
  cross_border_disclosed: boolean;
  third_party_disclosed: boolean;

  // Trackers + consent signals (from third-party + cookie scans).
  trackers_disclosed_when_present: boolean; // true = no trackers OR trackers declared in policy
  consent_banner_present: boolean;

  // Form scanner signal — true when every form that collects personal data
  // has both a consent checkbox AND a visible privacy link nearby.
  forms_consent_present: boolean;

  // Security-headers signals (NCA ECC-adjacent).
  https_enforced: boolean;
  hsts_present: boolean;
  csp_present: boolean;
  x_frame_options_present: boolean;
  referrer_policy_present: boolean;
}

/**
 * Starter ruleset. These are the five most obviously-inferable PDPL rules
 * from a public website scan. The Regulatory Agent will extend this list
 * with company-profile-specific rules (DPO requirement for large processors,
 * cross-border contracts, etc.) at analysis time.
 */
export const PDPL_RULES: readonly PdplRule[] = [
  {
    id: 'pdpl_privacy_policy_published',
    titleAr: 'نشر سياسة خصوصية واضحة',
    requirementAr: 'يجب على المتحكم نشر سياسة خصوصية واضحة تُبيّن جمع ومعالجة البيانات الشخصية.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
    signal: 'privacy_policy_found',
  },
  {
    id: 'pdpl_arabic_available',
    titleAr: 'إتاحة السياسة باللغة العربية',
    requirementAr: 'يجب إتاحة سياسة الخصوصية باللغة العربية لأصحاب البيانات في المملكة.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 500_000,
    signal: 'privacy_policy_arabic',
  },
  {
    id: 'pdpl_purpose_stated',
    titleAr: 'تحديد الغرض من المعالجة',
    requirementAr: 'يجب تحديد الغرض من جمع البيانات الشخصية ومعالجتها بشكل واضح.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
    signal: 'purpose_stated',
  },
  {
    id: 'pdpl_retention_stated',
    titleAr: 'الإفصاح عن مدة الاحتفاظ بالبيانات',
    requirementAr: 'يجب الإفصاح عن مدة الاحتفاظ بالبيانات الشخصية أو المعايير المستخدمة لتحديدها.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
    signal: 'retention_stated',
  },
  {
    id: 'pdpl_cross_border_disclosed',
    titleAr: 'الإفصاح عن نقل البيانات خارج المملكة',
    requirementAr: 'يجب الإفصاح عن أي نقل للبيانات الشخصية خارج المملكة العربية السعودية.',
    severity: 'critical',
    appliesTo: 'cross_border',
    fineCapSar: 5_000_000,
    signal: 'cross_border_disclosed',
  },
  {
    id: 'pdpl_third_party_disclosed',
    titleAr: 'الإفصاح عن الأطراف الثالثة',
    requirementAr: 'يجب الإفصاح عن الأطراف الثالثة التي تُشارك معها البيانات الشخصية.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
    signal: 'third_party_disclosed',
  },
  {
    id: 'pdpl_consent_before_processing',
    titleAr: 'الموافقة قبل المعالجة',
    requirementAr:
      'يجب الحصول على موافقة صاحب البيانات قبل معالجة بياناته الشخصية، باستثناء الحالات النظامية.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
    signal: 'consent_banner_present',
  },
  {
    id: 'pdpl_dpo_required',
    titleAr: 'تعيين مسؤول حماية البيانات',
    requirementAr:
      'يجب على الشركات التي تعالج بيانات شخصية بكميات كبيرة تعيين مسؤول حماية بيانات (DPO).',
    severity: 'critical',
    appliesTo: 'large_processors',
    fineCapSar: 500_000,
    signal: 'dpo_appointed',
  },
  {
    id: 'pdpl_trackers_disclosed',
    titleAr: 'الإفصاح عن أدوات التتبع على الموقع',
    requirementAr:
      'إذا كان الموقع يحمّل أدوات تتبع (Google Analytics، Facebook Pixel، إلخ) فيجب الإفصاح عنها في سياسة الخصوصية وأخذ موافقة صريحة.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
    signal: 'trackers_disclosed_when_present',
  },
  {
    id: 'pdpl_form_consent_present',
    titleAr: 'الموافقة الصريحة في نماذج جمع البيانات',
    requirementAr:
      'كل نموذج يجمع بيانات شخصية (بريد، جوال، اسم، هوية) يجب أن يتضمّن مربع موافقة صريح ورابطاً واضحاً لسياسة الخصوصية قريباً منه.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
    signal: 'forms_consent_present',
  },
  // NCA ECC-adjacent security-headers rules. Fine caps are 0 because NCA
  // enforcement is typically contractual (loss of government-client access)
  // rather than direct statutory fines — the UI hides the "fine" line for
  // these rules.
  {
    id: 'nca_https_enforced',
    titleAr: 'استخدام HTTPS على الموقع',
    requirementAr: 'يجب أن يكون الموقع يستخدم HTTPS لجميع الصفحات لحماية البيانات أثناء النقل.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 0,
    signal: 'https_enforced',
  },
  {
    id: 'nca_hsts_header',
    titleAr: 'تفعيل رأس HSTS',
    requirementAr:
      'رأس HTTP Strict Transport Security يُجبر المتصفح على استخدام HTTPS دائماً ويمنع هجمات تخفيض البروتوكول.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 0,
    signal: 'hsts_present',
  },
  {
    id: 'nca_csp_header',
    titleAr: 'تفعيل رأس Content-Security-Policy',
    requirementAr:
      'رأس CSP يحمي الموقع من هجمات XSS عبر تحديد مصادر السكربتات والموارد المسموح بها.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 0,
    signal: 'csp_present',
  },
  {
    id: 'nca_xframe_header',
    titleAr: 'تفعيل حماية التضمين (X-Frame-Options)',
    requirementAr:
      'رأس X-Frame-Options يمنع تضمين موقعك في إطار من موقع آخر — حماية من هجمات Clickjacking.',
    severity: 'low',
    appliesTo: 'all',
    fineCapSar: 0,
    signal: 'x_frame_options_present',
  },
  // ───────────────── Operational PDPL rules (no scanner signal) ─────────────────
  // These cover the policy/process layer — the agent surfaces them based on
  // user answers, not from URL scanning.
  {
    id: 'pdpl_legal_basis_documented',
    titleAr: 'توثيق الأساس النظامي لكل غرض معالجة',
    requirementAr:
      'يجب توثيق الأساس النظامي لمعالجة البيانات الشخصية (موافقة، تنفيذ عقد، التزام نظامي، مصلحة مشروعة) لكل غرض.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
    signal: 'legal_basis_stated',
  },
  {
    id: 'pdpl_dpia_required',
    titleAr: 'تقييم أثر حماية البيانات (DPIA)',
    requirementAr:
      'يجب إجراء تقييم أثر حماية البيانات (DPIA) عند معالجة بيانات حساسة بكميات كبيرة أو استخدام تقنيات جديدة.',
    severity: 'critical',
    appliesTo: 'large_processors',
    fineCapSar: 3_000_000,
  },
  {
    id: 'pdpl_breach_notification_72h',
    titleAr: 'إخطار خرق البيانات خلال 72 ساعة',
    requirementAr:
      'يجب إخطار الهيئة (SDAIA) بأي خرق للبيانات الشخصية يؤثر على حقوق الأفراد خلال 72 ساعة من اكتشافه.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 5_000_000,
  },
  {
    id: 'pdpl_breach_subject_notice',
    titleAr: 'إخطار صاحب البيانات بالخرق',
    requirementAr:
      'إذا كان الخرق قد يسبّب ضرراً جسيماً لصاحب البيانات، يجب إخطاره مباشرة بطريقة واضحة وفي وقت مناسب.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
  },
  {
    id: 'pdpl_minor_consent',
    titleAr: 'موافقة ولي الأمر للقاصرين',
    requirementAr: 'يجب الحصول على موافقة ولي الأمر صراحةً عند معالجة بيانات قاصرين دون 18 سنة.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 5_000_000,
  },
  {
    id: 'pdpl_processor_contract',
    titleAr: 'عقد معالج البيانات (Data Processor Agreement)',
    requirementAr:
      'كل معالج بيانات (مزود خدمة، مقاول، طرف ثالث) يجب أن يكون مرتبطاً بعقد مكتوب يحدد المسؤوليات والضوابط.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
  },
  {
    id: 'pdpl_data_minimization',
    titleAr: 'مبدأ التقليل من البيانات',
    requirementAr:
      'يجب جمع الحد الأدنى الضروري من البيانات الشخصية لتحقيق الغرض المحدد فقط — لا أكثر.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
  },
  {
    id: 'pdpl_accuracy',
    titleAr: 'دقة البيانات وتحديثها',
    requirementAr:
      'يجب الحفاظ على دقة البيانات الشخصية وتحديثها عند الحاجة، وحذف أو تصحيح البيانات غير الدقيقة.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
  },
  {
    id: 'pdpl_retention_destruction',
    titleAr: 'إتلاف البيانات بعد انتهاء الغرض',
    requirementAr:
      'يجب إتلاف البيانات الشخصية بشكل آمن بعد انتهاء الغرض من جمعها أو انقضاء المدة المحددة في السياسة.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
  },
  {
    id: 'pdpl_data_subject_response_time',
    titleAr: 'الرد على طلبات أصحاب البيانات',
    requirementAr:
      'يجب الرد على طلبات أصحاب البيانات (اطلاع، تصحيح، إتلاف) خلال 30 يوماً من استلام الطلب.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
  },
  {
    id: 'pdpl_records_of_processing',
    titleAr: 'سجل عمليات المعالجة',
    requirementAr:
      'يجب الاحتفاظ بسجل موثّق بكل أنشطة معالجة البيانات الشخصية — الأغراض، الفئات، المتلقّون، فترات الاحتفاظ.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 1_000_000,
  },
  {
    id: 'pdpl_security_measures',
    titleAr: 'تدابير أمنية ملائمة',
    requirementAr:
      'يجب اتخاذ تدابير تنظيمية وفنية ملائمة لحماية البيانات الشخصية من التلف أو الفقدان أو الوصول غير المصرّح.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 5_000_000,
  },
  {
    id: 'pdpl_encryption_sensitive',
    titleAr: 'تشفير البيانات الحساسة',
    requirementAr:
      'يجب تشفير البيانات الحساسة (صحية، مالية، بيومترية) في حالة السكون والنقل بخوارزميات معتمدة.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
  },
  {
    id: 'pdpl_cross_border_safeguards',
    titleAr: 'ضمانات نقل البيانات خارج المملكة',
    requirementAr:
      'يجب وجود ضمانات كافية (موافقة الهيئة، أحكام تعاقدية معتمدة، أو قرار كفاية) قبل نقل البيانات خارج المملكة.',
    severity: 'critical',
    appliesTo: 'cross_border',
    fineCapSar: 5_000_000,
  },
  {
    id: 'pdpl_marketing_consent',
    titleAr: 'موافقة منفصلة للتسويق',
    requirementAr:
      'يجب الحصول على موافقة منفصلة وصريحة قبل استخدام البيانات الشخصية لأغراض تسويقية مع توفير آلية إلغاء سهلة.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
  },
  {
    id: 'pdpl_sensitive_data_explicit',
    titleAr: 'موافقة صريحة للبيانات الحساسة',
    requirementAr:
      'يجب الحصول على موافقة صريحة قبل معالجة البيانات الحساسة (الصحية، الدينية، الجنائية، البيومترية).',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 5_000_000,
  },
  {
    id: 'pdpl_employee_training',
    titleAr: 'تدريب الموظفين على PDPL',
    requirementAr:
      'يجب تدريب الموظفين الذين يتعاملون مع البيانات الشخصية على متطلبات PDPL وإجراءات الحماية.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 500_000,
  },
  {
    id: 'pdpl_complaint_channel',
    titleAr: 'قناة استقبال شكاوى أصحاب البيانات',
    requirementAr:
      'يجب توفير قناة واضحة (بريد، نموذج، رقم) لاستقبال شكاوى أصحاب البيانات بشأن معالجة بياناتهم.',
    severity: 'medium',
    appliesTo: 'all',
    fineCapSar: 500_000,
  },
  {
    id: 'pdpl_pseudonymization_default',
    titleAr: 'إخفاء الهوية أو الترميز عند الإمكان',
    requirementAr:
      'يجب استخدام إخفاء الهوية أو الترميز (Pseudonymization) عند الإمكان لتقليل المخاطر على أصحاب البيانات.',
    severity: 'low',
    appliesTo: 'large_processors',
    fineCapSar: 500_000,
  },
  {
    id: 'pdpl_automated_decisions',
    titleAr: 'القرارات الآلية والتشكيل (Profiling)',
    requirementAr:
      'إذا كانت هناك قرارات آلية تؤثر جوهرياً على الأفراد، يجب الإفصاح عنها وتوفير حق المراجعة البشرية.',
    severity: 'critical',
    appliesTo: 'all',
    fineCapSar: 3_000_000,
  },
  {
    id: 'pdpl_dpo_independence',
    titleAr: 'استقلالية مسؤول حماية البيانات',
    requirementAr:
      'يجب أن يتمتع DPO باستقلالية مهنية وألا يخضع لتعليمات تتعارض مع واجباته في حماية البيانات.',
    severity: 'medium',
    appliesTo: 'large_processors',
    fineCapSar: 500_000,
  },
];
