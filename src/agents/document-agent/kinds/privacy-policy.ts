import { callClaude, MODELS, parseJsonResponse } from '@/lib/claude';
import { PDPL_DATA_SUBJECT_RIGHTS } from '@/knowledge/pdpl';
import {
  COMPANY_NAME_PLACEHOLDER,
  DPO_EMAIL_PLACEHOLDER,
  type DocumentSection,
  type GeneratedDocument,
} from '../types';
import type { CompanyContext } from '../company-context';
import { companyContextPrompt } from '../company-context';
import { logClaudeFallback, wrapDoc } from '../helpers';

export async function generatePrivacyPolicy(ctx: CompanyContext): Promise<GeneratedDocument> {
  try {
    const sections = await generateWithClaude(ctx);
    return wrapDoc('privacy_policy', COMPANY_NAME_PLACEHOLDER, sections, false);
  } catch (err) {
    // Always fall through to the template — a flaky API call (429, network,
    // JSON parse failure) shouldn't brick the demo. Log for debugging.
    logClaudeFallback('privacy_policy', err);
    return buildFallback(ctx);
  }
}

async function generateWithClaude(ctx: CompanyContext): Promise<DocumentSection[]> {
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

function buildFallback(ctx: CompanyContext): GeneratedDocument {
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
