import { callClaude, MODELS, parseJsonResponse } from '@/lib/claude';
import {
  COMPANY_NAME_PLACEHOLDER,
  DPO_EMAIL_PLACEHOLDER,
  type DocumentSection,
  type GeneratedDocument,
} from '../types';
import type { CompanyContext } from '../company-context';
import { companyContextPrompt } from '../company-context';
import { logClaudeFallback, wrapDoc } from '../helpers';

export async function generateProcessingRegister(ctx: CompanyContext): Promise<GeneratedDocument> {
  // The register is mechanical enough that the fallback template is the
  // primary path; Claude is used only to personalise the activity descriptions.
  try {
    const sections = await generateWithClaude(ctx);
    return wrapDoc('processing_register', COMPANY_NAME_PLACEHOLDER, sections, false, [
      { label: 'المتحكم', value: COMPANY_NAME_PLACEHOLDER },
      { label: 'آخر مراجعة', value: new Date().toLocaleDateString('ar-SA') },
    ]);
  } catch (err) {
    logClaudeFallback('processing_register', err);
    return buildFallback(ctx);
  }
}

async function generateWithClaude(ctx: CompanyContext): Promise<DocumentSection[]> {
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

function buildFallback(ctx: CompanyContext): GeneratedDocument {
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
