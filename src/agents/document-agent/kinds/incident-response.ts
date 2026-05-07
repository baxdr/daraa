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

export async function generateIncidentResponse(ctx: CompanyContext): Promise<GeneratedDocument> {
  try {
    const sections = await generateWithClaude(ctx);
    return wrapDoc('incident_response', COMPANY_NAME_PLACEHOLDER, sections, false, [
      { label: 'مسؤول البلاغ', value: DPO_NAME_PLACEHOLDER },
      { label: 'آخر تحديث', value: new Date().toLocaleDateString('ar-SA') },
    ]);
  } catch (err) {
    logClaudeFallback('incident_response', err);
    return buildFallback(ctx);
  }
}

async function generateWithClaude(ctx: CompanyContext): Promise<DocumentSection[]> {
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

function buildFallback(_ctx: CompanyContext): GeneratedDocument {
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
