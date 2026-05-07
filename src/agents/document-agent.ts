/**
 * Document Agent — generates PDPL-related documents in formal Arabic.
 *
 * Supports four document types, all reached from the same pipeline:
 *   - privacy_policy      — website privacy policy
 *   - dpo_appointment     — Data Protection Officer appointment letter
 *   - processing_register — record of data-processing activities
 *   - incident_response   — breach response procedure
 *
 * Each type has a Claude-generated path (richer, uses Sonnet) and a local
 * fallback template (for when the API key isn't configured). Output is a
 * uniform `GeneratedDocument` shape so one renderer covers all four.
 *
 * Chat / marketing copy uses Gulf dialect; generated documents are formal
 * MSA because they'll be published or filed. Never cites specific PDPL
 * article numbers — verification of numeric references is still pending.
 */

import { callClaude, MissingApiKeyError, MODELS, parseJsonResponse } from '@/lib/claude';
import { PDPL_DATA_SUBJECT_RIGHTS } from '@/knowledge/pdpl';
import type { Answers } from './chat-flow';

/* ========================================================================= */
/* Shared types                                                               */
/* ========================================================================= */

export type DocumentKind =
  | 'privacy_policy'
  | 'dpo_appointment'
  | 'processing_register'
  | 'incident_response';

export interface DocumentSection {
  heading: string;
  body: string;
  /** Optional bulleted items rendered after the body. */
  listItems?: string[];
  /** Optional tabular block — used for processing-register activities. */
  table?: DocumentTable;
}

export interface DocumentTable {
  headers: string[];
  rows: string[][];
}

export interface GeneratedDocument {
  kind: DocumentKind;
  /** Main Arabic title — appears in the document's masthead. */
  title: string;
  /** Optional English title (e.g. "PRIVACY POLICY") shown as a small eyebrow. */
  titleEn?: string;
  companyName: string;
  lastUpdatedAt: string;
  /** Extra top-of-document metadata (DPO name / address / ref number / etc.) */
  metadata?: Array<{ label: string; value: string }>;
  sections: DocumentSection[];
  disclaimerAr: string;
  fromFallbackTemplate: boolean;
}

export const COMPANY_NAME_PLACEHOLDER = '[اسم الشركة]';
export const DPO_NAME_PLACEHOLDER = '[اسم مسؤول حماية البيانات]';
export const DPO_EMAIL_PLACEHOLDER = 'dpo@[company].sa';

export const DOCUMENT_META: Record<
  DocumentKind,
  { titleAr: string; titleEn: string; blurbAr: string }
> = {
  privacy_policy: {
    titleAr: 'سياسة الخصوصية',
    titleEn: 'PRIVACY POLICY',
    blurbAr: 'وثيقة تنشرها الشركة على موقعها تشرح كيف تتعامل مع بيانات العملاء.',
  },
  dpo_appointment: {
    titleAr: 'خطاب تعيين مسؤول حماية البيانات',
    titleEn: 'DPO APPOINTMENT',
    blurbAr: 'خطاب رسمي من الإدارة يُعيّن شخصاً مسؤولاً عن الامتثال لنظام حماية البيانات.',
  },
  processing_register: {
    titleAr: 'سجل أنشطة معالجة البيانات الشخصية',
    titleEn: 'DATA PROCESSING REGISTER',
    blurbAr: 'جدول يوثّق كل نشاط تعالج فيه الشركة بيانات شخصية — مطلوب عند التفتيش.',
  },
  incident_response: {
    titleAr: 'خطة الاستجابة لحوادث اختراق البيانات',
    titleEn: 'INCIDENT RESPONSE PLAN',
    blurbAr: 'إجراء معتمد مسبقاً للتصرف إذا تعرّضت بيانات العملاء للاختراق.',
  },
};

/* ========================================================================= */
/* Public API                                                                 */
/* ========================================================================= */

export async function generateDocument(
  kind: DocumentKind,
  answers: Answers,
  companyName?: string,
): Promise<GeneratedDocument> {
  const ctx = buildCompanyContext(answers);
  const base = await (async (): Promise<GeneratedDocument> => {
    switch (kind) {
      case 'privacy_policy':
        return generatePrivacyPolicy(ctx);
      case 'dpo_appointment':
        return generateDpoAppointment(ctx);
      case 'processing_register':
        return generateProcessingRegister(ctx);
      case 'incident_response':
        return generateIncidentResponse(ctx);
      default: {
        const _exhaustive: never = kind;
        throw new Error(`Unknown document kind: ${_exhaustive as string}`);
      }
    }
  })();
  return substituteCompanyName(base, companyName);
}

/**
 * Swap [اسم الشركة] placeholders throughout the generated document when the
 * caller passed a real name. Keeps the placeholder if `companyName` is
 * empty so the user still sees where to fill in.
 */
function substituteCompanyName(doc: GeneratedDocument, companyName?: string): GeneratedDocument {
  const name = companyName?.trim();
  if (!name) return doc;
  const swap = (s: string) => s.split(COMPANY_NAME_PLACEHOLDER).join(name);
  return {
    ...doc,
    companyName: name,
    sections: doc.sections.map((s) => {
      const mappedTable = s.table
        ? {
            headers: s.table.headers.map(swap),
            rows: s.table.rows.map((row) => row.map(swap)),
          }
        : undefined;
      const mappedListItems = s.listItems?.map(swap);
      return {
        ...s,
        body: swap(s.body),
        ...(mappedListItems ? { listItems: mappedListItems } : {}),
        ...(mappedTable ? { table: mappedTable } : {}),
      };
    }),
    ...(doc.metadata
      ? { metadata: doc.metadata.map((m) => ({ label: m.label, value: swap(m.value) })) }
      : {}),
  };
}

/* ========================================================================= */
/* Company context                                                            */
/* ========================================================================= */

interface CompanyContext {
  companyTypeAr: string;
  employeeCount: number | null;
  processesPersonalData: boolean;
  userScale: string | null;
  dataHostedOutside: boolean;
  hasGovernmentClients: boolean;
  hasDpo: boolean;
}

function buildCompanyContext(a: Answers): CompanyContext {
  return {
    companyTypeAr: companyTypeLabel(a.q1_company_type),
    employeeCount: a.q2_employee_count ?? null,
    processesPersonalData: a.q3_processes_personal_data === 'yes',
    userScale: userScaleLabel(a.q4_user_count),
    dataHostedOutside: a.q6_data_location === 'outside',
    hasGovernmentClients: a.q7_government_clients === 'yes',
    hasDpo: a.q5_dpo_appointed === 'yes',
  };
}

function companyTypeLabel(v: Answers['q1_company_type']): string {
  switch (v) {
    case 'saas':
      return 'شركة تقنية (SaaS)';
    case 'ecommerce':
      return 'متجر إلكتروني';
    case 'fintech':
      return 'شركة تقنية مالية';
    case 'services':
      return 'شركة خدمات';
    default:
      return 'شركة';
  }
}

function userScaleLabel(v: Answers['q4_user_count']): string | null {
  switch (v) {
    case 'under_10k':
      return 'أقل من ١٠ آلاف مستخدم';
    case '10k_100k':
      return 'بين ١٠ آلاف و ١٠٠ ألف مستخدم';
    case 'over_100k':
      return 'أكثر من ١٠٠ ألف مستخدم';
    default:
      return null;
  }
}

function companyContextPrompt(ctx: CompanyContext): string {
  return (
    `الشركة: ${ctx.companyTypeAr}.\n` +
    `عدد الموظفين: ${ctx.employeeCount ?? 'غير محدد'}.\n` +
    `تعالج بيانات شخصية: ${ctx.processesPersonalData ? 'نعم' : 'لا'}.\n` +
    `حجم قاعدة المستخدمين: ${ctx.userScale ?? 'غير محدد'}.\n` +
    `استضافة البيانات: ${ctx.dataHostedOutside ? 'خارج المملكة' : 'داخل المملكة (أو غير محدد)'}.\n` +
    `تتعامل مع جهات حكومية: ${ctx.hasGovernmentClients ? 'نعم' : 'لا'}.\n` +
    `لديها DPO معيّن: ${ctx.hasDpo ? 'نعم' : 'لا'}.`
  );
}

const DEFAULT_DISCLAIMER =
  'تمت صياغة هذه الوثيقة تلقائياً بواسطة أداة درع — يُنصح بمراجعتها قانونياً قبل الاعتماد أو النشر.';

/* ========================================================================= */
/* 1. Privacy Policy                                                          */
/* ========================================================================= */

async function generatePrivacyPolicy(ctx: CompanyContext): Promise<GeneratedDocument> {
  try {
    const sections = await generatePrivacyPolicySectionsWithClaude(ctx);
    return wrapDoc('privacy_policy', COMPANY_NAME_PLACEHOLDER, sections, false);
  } catch (err) {
    // Always fall through to the template — a flaky API call (429, network,
    // JSON parse failure) shouldn't brick the demo. Log for debugging.
    logClaudeFallback('privacy_policy', err);
    return buildPrivacyPolicyFallback(ctx);
  }
}

async function generatePrivacyPolicySectionsWithClaude(
  ctx: CompanyContext,
): Promise<DocumentSection[]> {
  const system = `أنت صائغ قانوني متخصص في نظام حماية البيانات الشخصية السعودي (PDPL).
مهمتك كتابة سياسة خصوصية كاملة باللغة العربية الفصحى (MSA) لشركة سعودية.

قواعد صارمة:
- استخدم العربية الفصحى المعاصرة — لا لهجة.
- لا تذكر أرقام مواد محددة — استخدم أسماء القواعد.
- لا تستخدم مصطلحات GDPR (مثل "حق النقل"، "حق الاعتراض") — النظام السعودي يختلف.
- حقوق صاحب البيانات المعتمدة فقط: ${PDPL_DATA_SUBJECT_RIGHTS.map((r) => r.nameAr).join('، ')}.
- استخدم "${COMPANY_NAME_PLACEHOLDER}" حيث يلزم ذكر اسم الشركة.
- أخرج JSON فقط: [ { "heading": "...", "body": "...", "listItems": ["..."] }, ... ]

الأقسام بالترتيب:
1. مقدمة
2. أنواع البيانات التي نجمعها (body + listItems)
3. أغراض جمع البيانات (body + listItems)
4. الأساس النظامي للمعالجة
5. حقوق صاحب البيانات (body + listItems: الحقوق الخمسة أعلاه فقط)
6. مدة الاحتفاظ بالبيانات
7. مشاركة البيانات مع أطراف ثالثة
${ctx.dataHostedOutside ? '8. نقل البيانات خارج المملكة\n' : ''}9. ملفات تعريف الارتباط
10. الاتصال بمسؤول حماية البيانات
11. تقديم شكوى لـ SDAIA`;

  const raw = await callClaude({
    model: MODELS.sonnet,
    system,
    user: companyContextPrompt(ctx),
    maxTokens: 4000,
  });
  return parseJsonResponse<DocumentSection[]>(raw);
}

function buildPrivacyPolicyFallback(ctx: CompanyContext): GeneratedDocument {
  const crossBorderSection: DocumentSection | null = ctx.dataHostedOutside
    ? {
        heading: 'نقل البيانات خارج المملكة العربية السعودية',
        body:
          'تُخزَّن بعض بيانات عملائنا في مراكز بيانات خارج المملكة العربية السعودية لأغراض تشغيلية. ' +
          'نلتزم بتطبيق الضمانات المناسبة وفقاً لمتطلبات نظام حماية البيانات الشخصية السعودي، ' +
          'بما في ذلك إبرام اتفاقيات نقل البيانات مع مزودي الخدمة.',
      }
    : null;

  const sections: DocumentSection[] = [
    {
      heading: 'مقدمة',
      body:
        `تصف هذه السياسة كيف تقوم ${COMPANY_NAME_PLACEHOLDER} (المشار إليها فيما يلي بـ "الشركة" أو "نحن") ` +
        'بجمع بياناتكم الشخصية ومعالجتها وحمايتها. نلتزم بأحكام نظام حماية البيانات الشخصية السعودي.',
    },
    {
      heading: 'أنواع البيانات التي نجمعها',
      body: 'نجمع أنواعاً محددة من البيانات الشخصية بناءً على طبيعة التعامل معنا:',
      listItems: [
        'بيانات التعريف: الاسم، رقم الهوية، رقم الجوال، البريد الإلكتروني',
        'بيانات الحساب: اسم المستخدم، كلمة المرور المشفّرة',
        'بيانات الاستخدام: سجلات الدخول، عناوين IP، معرّف الجهاز',
        'بيانات التواصل: الرسائل المُرسَلة إلى الدعم',
      ],
    },
    {
      heading: 'أغراض جمع البيانات',
      body: 'نقوم بجمع بياناتكم للأغراض التالية فقط:',
      listItems: [
        'تقديم الخدمات وتحسينها',
        'التواصل بخصوص الحساب والإشعارات التشغيلية',
        'الامتثال للالتزامات النظامية',
        'حماية الأنظمة من الاحتيال',
      ],
    },
    {
      heading: 'الأساس النظامي للمعالجة',
      body:
        'تتم المعالجة بناءً على موافقتكم الصريحة أو على أسس نظامية أخرى يُجيزها نظام حماية البيانات ' +
        '(مثل تنفيذ عقد، أو التزام نظامي). يحق لكم سحب الموافقة في أي وقت.',
    },
    {
      heading: 'حقوق صاحب البيانات',
      body: 'يمنحكم نظام حماية البيانات الشخصية السعودي الحقوق التالية:',
      listItems: PDPL_DATA_SUBJECT_RIGHTS.map((r) => `${r.nameAr}: ${r.descriptionAr}`),
    },
    {
      heading: 'مدة الاحتفاظ بالبيانات',
      body:
        'نحتفظ بالبيانات الشخصية للمدة اللازمة لتحقيق الأغراض أعلاه أو التي تفرضها الأنظمة. ' +
        'عند انتفاء الغرض، نُتلف البيانات بطريقة آمنة.',
    },
    {
      heading: 'مشاركة البيانات مع أطراف ثالثة',
      body:
        'قد نشارك بياناتكم مع مزودي خدمة موثوقين (الاستضافة السحابية، أدوات التحليلات، البريد الإلكتروني) ' +
        'بموجب اتفاقيات تُلزمهم بحماية البيانات. لن نبيع بياناتكم لأي طرف ثالث.',
    },
    ...(crossBorderSection ? [crossBorderSection] : []),
    {
      heading: 'ملفات تعريف الارتباط (الكوكيز)',
      body:
        'يستخدم موقعنا ملفات تعريف الارتباط لتحسين التجربة وتحليل الاستخدام. ' +
        'يمكنكم إدارة الإعدادات من خلال متصفحكم أو لوحة الموافقة.',
    },
    {
      heading: 'التواصل مع مسؤول حماية البيانات',
      body:
        `يمكنكم التواصل مع مسؤول حماية البيانات في ${COMPANY_NAME_PLACEHOLDER} ` +
        `عبر البريد الإلكتروني: ${DPO_EMAIL_PLACEHOLDER}`,
    },
    {
      heading: 'تقديم شكوى',
      body:
        'يحق لكم تقديم شكوى للهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA) ' +
        'في حال لم تحصلوا على رد مُرضٍ.',
    },
  ];

  return wrapDoc('privacy_policy', COMPANY_NAME_PLACEHOLDER, sections, true);
}

/* ========================================================================= */
/* 2. DPO Appointment Letter                                                  */
/* ========================================================================= */

async function generateDpoAppointment(ctx: CompanyContext): Promise<GeneratedDocument> {
  try {
    const sections = await generateDpoWithClaude(ctx);
    return wrapDoc('dpo_appointment', COMPANY_NAME_PLACEHOLDER, sections, false, [
      { label: 'المُعيَّن', value: DPO_NAME_PLACEHOLDER },
      { label: 'الاتصال', value: DPO_EMAIL_PLACEHOLDER },
      { label: 'تاريخ السريان', value: new Date().toLocaleDateString('ar-SA') },
    ]);
  } catch (err) {
    logClaudeFallback('dpo_appointment', err);
    return buildDpoFallback(ctx);
  }
}

async function generateDpoWithClaude(ctx: CompanyContext): Promise<DocumentSection[]> {
  const system = `أنت صائغ خطابات رسمية سعودية. اكتب خطاب تعيين مسؤول حماية البيانات الشخصية (DPO).

قواعد:
- عربية فصحى رسمية.
- استخدم "${COMPANY_NAME_PLACEHOLDER}" و"${DPO_NAME_PLACEHOLDER}" و"${DPO_EMAIL_PLACEHOLDER}" حيث يلزم.
- أخرج JSON فقط بهذه الأقسام بالترتيب:

[
  { "heading": "الديباجة", "body": "..." },
  { "heading": "قرار التعيين", "body": "..." },
  { "heading": "المسؤوليات والصلاحيات", "body": "...", "listItems": ["..."] },
  { "heading": "الاستقلالية والحماية", "body": "..." },
  { "heading": "مدة التعيين", "body": "..." },
  { "heading": "التوقيع والاعتماد", "body": "..." }
]`;

  const raw = await callClaude({
    model: MODELS.sonnet,
    system,
    user: companyContextPrompt(ctx),
    maxTokens: 2500,
  });
  return parseJsonResponse<DocumentSection[]>(raw);
}

function buildDpoFallback(ctx: CompanyContext): GeneratedDocument {
  const sections: DocumentSection[] = [
    {
      heading: 'الديباجة',
      body:
        `بناءً على أحكام نظام حماية البيانات الشخصية الصادر في المملكة العربية السعودية ولائحته التنفيذية، ` +
        `ونظراً لطبيعة نشاط ${COMPANY_NAME_PLACEHOLDER} بوصفها ${ctx.companyTypeAr} تعالج بيانات شخصية` +
        `${ctx.userScale ? ` بحجم ${ctx.userScale}` : ''}، ` +
        'تُصدر الإدارة قرار تعيين مسؤول حماية البيانات الشخصية (DPO) لضمان الامتثال لأحكام النظام.',
    },
    {
      heading: 'قرار التعيين',
      body:
        `تُعيّن ${COMPANY_NAME_PLACEHOLDER} السيد/ة ${DPO_NAME_PLACEHOLDER} مسؤولاً/ة لحماية البيانات ` +
        `الشخصية، ويُخوَّل/تُخوَّل بممارسة جميع الصلاحيات المنصوص عليها في النظام ولائحته التنفيذية. ` +
        `يعمل المُعيَّن تحت إشراف الإدارة العليا مباشرة.`,
    },
    {
      heading: 'المسؤوليات والصلاحيات',
      body: 'يتولّى مسؤول حماية البيانات المهام التالية:',
      listItems: [
        'الإشراف على الامتثال لأحكام نظام حماية البيانات الشخصية ولائحته التنفيذية',
        'إعداد ومراجعة سياسات وإجراءات معالجة البيانات الشخصية داخل الشركة',
        'التعامل مع طلبات أصحاب البيانات في ممارسة حقوقهم النظامية',
        'تقييم المخاطر المتعلقة بأنشطة المعالجة والرد على حوادث اختراق البيانات',
        'التواصل مع الهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA) بصفته نقطة الاتصال المعتمدة',
        'تدريب الموظفين على متطلبات حماية البيانات ورفع الوعي الداخلي',
      ],
    },
    {
      heading: 'الاستقلالية والحماية',
      body:
        'تلتزم الإدارة بتوفير الموارد اللازمة لأداء مهام مسؤول حماية البيانات بشكل مستقل، وعدم ' +
        'إعطائه/إعطائها تعليمات تتعارض مع متطلبات النظام. لا يجوز إنهاء خدمته/خدمتها أو إيقاعه/ها ' +
        'تحت أي عقوبة بسبب أدائه/أدائها لمهامه/ها النظامية.',
    },
    {
      heading: 'مدة التعيين',
      body:
        'يسري هذا التعيين اعتباراً من تاريخ اعتماده، ويستمر حتى إشعار آخر من الإدارة. ' +
        'تتم مراجعة التعيين دورياً للتأكد من استمرار مناسبته لحجم نشاط الشركة وطبيعة معالجة البيانات.',
    },
    {
      heading: 'التوقيع والاعتماد',
      body:
        `عن ${COMPANY_NAME_PLACEHOLDER}:\n\n` +
        'الاسم: _______________________\n' +
        'المنصب: الرئيس التنفيذي / المدير العام\n' +
        'التوقيع: _____________________\n' +
        'التاريخ: _____________________\n\n' +
        `للتواصل مع مسؤول حماية البيانات: ${DPO_EMAIL_PLACEHOLDER}`,
    },
  ];

  return wrapDoc('dpo_appointment', COMPANY_NAME_PLACEHOLDER, sections, true, [
    { label: 'المُعيَّن', value: DPO_NAME_PLACEHOLDER },
    { label: 'الاتصال', value: DPO_EMAIL_PLACEHOLDER },
    { label: 'تاريخ السريان', value: new Date().toLocaleDateString('ar-SA') },
  ]);
}

/* ========================================================================= */
/* 3. Data Processing Register                                                */
/* ========================================================================= */

async function generateProcessingRegister(ctx: CompanyContext): Promise<GeneratedDocument> {
  // The register is mechanical enough that the fallback template is the
  // primary path; Claude is used only to personalise the activity descriptions.
  try {
    const sections = await generateRegisterWithClaude(ctx);
    return wrapDoc('processing_register', COMPANY_NAME_PLACEHOLDER, sections, false, [
      { label: 'المتحكم', value: COMPANY_NAME_PLACEHOLDER },
      { label: 'آخر مراجعة', value: new Date().toLocaleDateString('ar-SA') },
    ]);
  } catch (err) {
    logClaudeFallback('processing_register', err);
    return buildRegisterFallback(ctx);
  }
}

async function generateRegisterWithClaude(ctx: CompanyContext): Promise<DocumentSection[]> {
  const system = `أنت محلل امتثال. أنشئ سجل أنشطة معالجة بيانات شخصية (Data Processing Register) بالعربية الفصحى.

يجب أن يحتوي السجل على 4-6 أنشطة معالجة نموذجية تناسب الشركة، كل نشاط عبارة عن صف في جدول.

أخرج JSON فقط بهذا الشكل (كل قسم يحتوي على جدول):

[
  {
    "heading": "أنشطة المعالجة",
    "body": "السجل أدناه يوثّق كل نشاط تعالج فيه الشركة بيانات شخصية...",
    "table": {
      "headers": ["النشاط", "الغرض", "فئات البيانات", "مدة الاحتفاظ", "المستلمون"],
      "rows": [
        ["إدارة حسابات المستخدمين", "...", "...", "...", "..."],
        ...
      ]
    }
  },
  {
    "heading": "الإجراءات والضمانات",
    "body": "..."
  }
]`;

  const raw = await callClaude({
    model: MODELS.sonnet,
    system,
    user: companyContextPrompt(ctx),
    maxTokens: 2500,
  });
  return parseJsonResponse<DocumentSection[]>(raw);
}

function buildRegisterFallback(ctx: CompanyContext): GeneratedDocument {
  const rows: string[][] = [
    [
      'إدارة حسابات العملاء',
      'تمكين الوصول للخدمة والتواصل',
      'اسم، إيميل، رقم جوال، بيانات تسجيل',
      'طوال فترة نشاط الحساب + ٢٤ شهراً',
      'الموظفون المختصون · مزود الاستضافة',
    ],
    [
      'المعاملات المالية والفوترة',
      'تنفيذ المدفوعات والفواتير الضريبية',
      'اسم، رقم هوية/سجل تجاري، تفاصيل الدفع',
      '١٠ سنوات (التزام زكوي/ضريبي)',
      'مزود الدفع · ZATCA عند الاستعلام',
    ],
    [
      'الدعم الفني والاستفسارات',
      'الرد على استفسارات العملاء',
      'اسم، إيميل، محتوى المحادثة',
      '٣٦ شهراً من آخر تواصل',
      'فريق الدعم · أدوات إدارة التذاكر',
    ],
    ...(ctx.processesPersonalData
      ? [
          [
            'التحليلات والقياس',
            'فهم استخدام الخدمة وتحسينها',
            'معرّف الجهاز، عنوان IP، أحداث الاستخدام',
            '١٨ شهراً',
            'أدوات التحليلات المعتمدة',
          ],
        ]
      : []),
    ...(ctx.dataHostedOutside
      ? [
          [
            'النسخ الاحتياطي خارج المملكة',
            'استمرارية الأعمال واستعادة الكوارث',
            'نسخة من قاعدة البيانات',
            'حسب سياسة النسخ الاحتياطي (عادةً ٩٠ يوماً)',
            'مزود السحابة الأجنبي · بموجب اتفاقية نقل بيانات',
          ],
        ]
      : []),
  ];

  const sections: DocumentSection[] = [
    {
      heading: 'أنشطة المعالجة',
      body:
        `يُوثّق هذا السجل أنشطة معالجة البيانات الشخصية التي تقوم بها ${COMPANY_NAME_PLACEHOLDER} ` +
        'بوصفها متحكماً بالبيانات. يُحدَّث السجل بشكل دوري ويُقدَّم إلى الهيئة السعودية للبيانات ' +
        'والذكاء الاصطناعي (SDAIA) عند الطلب.',
      table: {
        headers: ['النشاط', 'الغرض', 'فئات البيانات', 'مدة الاحتفاظ', 'المستلمون'],
        rows,
      },
    },
    {
      heading: 'الإجراءات والضمانات الأمنية',
      body: 'تُطبّق الشركة الإجراءات التنظيمية والتقنية المناسبة لحماية البيانات الشخصية:',
      listItems: [
        'تشفير البيانات الحساسة أثناء التخزين والنقل (TLS للنقل، AES-256 للتخزين)',
        'التحكم في الصلاحيات وفق مبدأ الحد الأدنى من الوصول',
        'سجلات المراجعة والدخول لجميع الأنشطة الحرجة',
        'عقود مع مزودي الخدمة تتضمّن بنود حماية البيانات',
        'مراجعة دورية لتقييم مخاطر المعالجة',
      ],
    },
    {
      heading: 'المسؤول عن السجل',
      body:
        `يُشرف على تحديث هذا السجل مسؤول حماية البيانات (DPO). يمكن الوصول إليه/إليها عبر: ` +
        `${DPO_EMAIL_PLACEHOLDER}. يُراجَع السجل ربع سنوياً على الأقل، وعند أي تغيير جوهري في ` +
        'أنشطة المعالجة.',
    },
  ];

  return wrapDoc('processing_register', COMPANY_NAME_PLACEHOLDER, sections, true, [
    { label: 'المتحكم', value: COMPANY_NAME_PLACEHOLDER },
    { label: 'آخر مراجعة', value: new Date().toLocaleDateString('ar-SA') },
  ]);
}

/* ========================================================================= */
/* 4. Incident Response Plan                                                  */
/* ========================================================================= */

async function generateIncidentResponse(ctx: CompanyContext): Promise<GeneratedDocument> {
  try {
    const sections = await generateIncidentWithClaude(ctx);
    return wrapDoc('incident_response', COMPANY_NAME_PLACEHOLDER, sections, false, [
      { label: 'مسؤول البلاغ', value: DPO_NAME_PLACEHOLDER },
      { label: 'آخر تحديث', value: new Date().toLocaleDateString('ar-SA') },
    ]);
  } catch (err) {
    logClaudeFallback('incident_response', err);
    return buildIncidentFallback(ctx);
  }
}

async function generateIncidentWithClaude(ctx: CompanyContext): Promise<DocumentSection[]> {
  const system = `أنت مستشار أمن معلومات. اكتب خطة استجابة لحوادث اختراق بيانات شخصية وفقاً لمتطلبات PDPL السعودي.

قواعد:
- عربية فصحى.
- في قسم الإبلاغ لـ SDAIA: استخدم صياغة "دون تأخير غير مبرَّر"، وأشر إلى مدة مرجعية لا تتجاوز ٧٢ ساعة "وفقاً لتوجيهات الهيئة" — لا تُقدّم الـ ٧٢ ساعة كالتزام قاطع في النص الأولي للنظام.
- كل قسم عبارة عن مرحلة إجرائية واضحة، مع خطوات قابلة للتنفيذ.
- استخدم "${COMPANY_NAME_PLACEHOLDER}" و"${DPO_NAME_PLACEHOLDER}" و"${DPO_EMAIL_PLACEHOLDER}".
- صف دور الـ DPO بأنه "نقطة اتصال" مع الجهات التنظيمية، لا "ممثل قانوني للشركة".
- أخرج JSON فقط:

[
  { "heading": "١. الكشف والتصنيف", "body": "...", "listItems": ["..."] },
  { "heading": "٢. الاحتواء", "body": "...", "listItems": ["..."] },
  { "heading": "٣. الإبلاغ لـ SDAIA دون تأخير", "body": "...", "listItems": ["..."] },
  { "heading": "٤. إشعار أصحاب البيانات", "body": "...", "listItems": ["..."] },
  { "heading": "٥. التحقيق وحفظ الأدلة", "body": "..." },
  { "heading": "٦. الدروس المستفادة", "body": "..." }
]`;

  const raw = await callClaude({
    model: MODELS.sonnet,
    system,
    user: companyContextPrompt(ctx),
    maxTokens: 3000,
  });
  return parseJsonResponse<DocumentSection[]>(raw);
}

function buildIncidentFallback(_ctx: CompanyContext): GeneratedDocument {
  const sections: DocumentSection[] = [
    {
      heading: '١. الكشف والتصنيف',
      body:
        'عند اكتشاف حادث محتمل يتعلق بالبيانات الشخصية (من خلال مراقبة الأنظمة، بلاغ من موظف، ' +
        'أو إشعار من طرف ثالث)، يبدأ التقييم الفوري لتحديد طبيعة الحادث وحجمه:',
      listItems: [
        'توثيق وقت الاكتشاف والمصدر',
        'تحديد الأنظمة والبيانات المتأثرة',
        'تقدير حجم البيانات المعرّضة للاختراق وعدد الأشخاص المتأثرين',
        `إبلاغ مسؤول حماية البيانات فوراً عبر ${DPO_EMAIL_PLACEHOLDER}`,
        'تصنيف الحادث: اختراق فعلي / محاولة اختراق / خطأ تشغيلي',
      ],
    },
    {
      heading: '٢. الاحتواء الفوري',
      body: 'خلال الساعات الأولى — هدف الفريق إيقاف اتساع الحادث قبل الإصلاح:',
      listItems: [
        'عزل الأنظمة المخترَقة عن الشبكة',
        'إبطال الصلاحيات المشبوهة وإعادة تعيين كلمات المرور المرتبطة',
        'حفظ السجلات الفورية للأنظمة قبل أي تعديل',
        'تشكيل فريق الاستجابة (DPO + أمن معلومات + شؤون قانونية)',
      ],
    },
    {
      heading: '٣. الإبلاغ لـ SDAIA دون تأخير (وفق توجيهات الهيئة — عادةً خلال ٧٢ ساعة)',
      body:
        'يتطلب نظام حماية البيانات الشخصية إبلاغ الهيئة السعودية للبيانات والذكاء الاصطناعي ' +
        '(SDAIA) دون تأخير غير مبرَّر عند اكتشاف اختراق يُرجَّح أن يُلحق ضرراً بأصحاب البيانات. ' +
        'تحدّد توجيهات الهيئة مدة مرجعية لا تتجاوز ٧٢ ساعة لتقديم البلاغ. راجع النص الرسمي على ' +
        'sdaia.gov.sa للصيغة الأحدث. البلاغ يتضمّن:',
      listItems: [
        'طبيعة الاختراق (فئات البيانات، عدد الأشخاص المتأثرين تقديرياً)',
        'الإجراءات المتخذة للاحتواء والإصلاح',
        'الإجراءات المقترحة للتخفيف من الأضرار',
        'معلومات التواصل مع مسؤول حماية البيانات (DPO)',
        `يُرسَل البلاغ عبر القناة الرسمية لـ SDAIA (راجع sdaia.gov.sa للبلاغ الرسمي)`,
      ],
    },
    {
      heading: '٤. إشعار أصحاب البيانات',
      body:
        'إذا كان الاختراق يُشكّل خطراً عالياً على حقوق أصحاب البيانات، يلزم إشعارهم مباشرة دون ' +
        'تأخير غير مبرَّر. الإشعار يتضمّن:',
      listItems: [
        'وصف واضح للاختراق بلغة مفهومة (بدون مصطلحات تقنية)',
        'فئات البيانات الشخصية المتأثرة',
        'الإجراءات التي اتخذتها الشركة ونتائجها',
        'خطوات يوصى بها للمستخدم (تغيير كلمة المرور، مراقبة الحسابات، إلخ)',
        'طريقة التواصل مع الشركة للاستفسار',
      ],
    },
    {
      heading: '٥. التحقيق وحفظ الأدلة',
      body:
        'بعد مرحلة الاحتواء، يُجرى تحقيق مفصّل لفهم كيف حدث الاختراق. تُحفظ جميع السجلات ' +
        'والأدلة التقنية (logs، صور الأقراص، ذاكرة الأنظمة) لمدة لا تقل عن سنتين، مع ضمان ' +
        'سلامة سلسلة الحفظ القانوني (chain of custody) في حال إحالة القضية لجهة نظامية.',
    },
    {
      heading: '٦. الدروس المستفادة',
      body:
        'خلال شهر من إغلاق الحادث، يُعقد اجتماع مراجعة مع فريق الاستجابة وتُوثَّق نتائجه كتابياً. ' +
        'يُحدَّث هذا المستند بناءً على الدروس المستفادة. يُراجَع المستند ككل على الأقل مرة كل ' +
        'ستة أشهر، ويُختبر إجرائياً عبر تمرين محاكاة حادث مرة في السنة.',
    },
  ];

  return wrapDoc('incident_response', COMPANY_NAME_PLACEHOLDER, sections, true, [
    { label: 'مسؤول البلاغ', value: DPO_NAME_PLACEHOLDER },
    { label: 'آخر تحديث', value: new Date().toLocaleDateString('ar-SA') },
  ]);
}

/* ========================================================================= */
/* Helpers                                                                    */
/* ========================================================================= */

function logClaudeFallback(kind: DocumentKind, err: unknown): void {
  const reason =
    err instanceof MissingApiKeyError
      ? 'api_key_missing'
      : err instanceof Error
        ? err.message
        : 'unknown';
  console.warn(`[documents] falling back to template for ${kind}: ${reason}`);
}

function wrapDoc(
  kind: DocumentKind,
  companyName: string,
  sections: DocumentSection[],
  fromFallback: boolean,
  metadata?: Array<{ label: string; value: string }>,
): GeneratedDocument {
  const meta = DOCUMENT_META[kind];
  return {
    kind,
    title: meta.titleAr,
    titleEn: meta.titleEn,
    companyName,
    lastUpdatedAt: new Date().toISOString(),
    sections,
    ...(metadata ? { metadata } : {}),
    disclaimerAr: DEFAULT_DISCLAIMER,
    fromFallbackTemplate: fromFallback,
  };
}

/* Back-compat named export — some callers still import generatePrivacyPolicy. */
export { generatePrivacyPolicy };
