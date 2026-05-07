import { callClaude, MODELS, parseJsonResponse } from '@/lib/claude';
import {
  COMPANY_NAME_PLACEHOLDER,
  DPO_EMAIL_PLACEHOLDER,
  DPO_NAME_PLACEHOLDER,
  type DocumentSection,
  type GeneratedDocument,
} from '../types';
import type { CompanyContext } from '../company-context';
import { companyContextPrompt } from '../company-context';
import { logClaudeFallback, wrapDoc } from '../helpers';

export async function generateDpoAppointment(ctx: CompanyContext): Promise<GeneratedDocument> {
  try {
    const sections = await generateWithClaude(ctx);
    return wrapDoc('dpo_appointment', COMPANY_NAME_PLACEHOLDER, sections, false, [
      { label: 'المُعيَّن', value: DPO_NAME_PLACEHOLDER },
      { label: 'الاتصال', value: DPO_EMAIL_PLACEHOLDER },
      { label: 'تاريخ السريان', value: new Date().toLocaleDateString('ar-SA') },
    ]);
  } catch (err) {
    logClaudeFallback('dpo_appointment', err);
    return buildFallback(ctx);
  }
}

async function generateWithClaude(ctx: CompanyContext): Promise<DocumentSection[]> {
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

function buildFallback(ctx: CompanyContext): GeneratedDocument {
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
