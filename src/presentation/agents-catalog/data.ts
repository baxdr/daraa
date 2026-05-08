/**
 * Static catalog of every agent in the platform — used by the public
 * /agents directory page. Counts must stay in sync with
 * src/agents/types.ts AGENT_LABELS_AR.
 */

import type { AgentId } from '@/agents/types';

export interface AgentCardData {
  id: AgentId;
  nameAr: string;
  layer: 'coordination' | 'specialist';
  group:
    | 'flow'
    | 'analysis'
    | 'establishment'
    | 'compliance'
    | 'tax'
    | 'cybersecurity'
    | 'industry';
  roleAr: string;
  outputsAr: string[];
}

export const AGENTS_CATALOG: AgentCardData[] = [
  // ── Coordination layer (8) ──────────────────────────────────────
  {
    id: 'orchestrator',
    nameAr: 'المنسّق',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يدير دورة حياة المشروع بالكامل — يطلق الوكلاء بالتوازي حسب الاعتمادية، يرتّب الجهات في خريطة الطريق، ويحرّر الأحداث على timeline واحد.',
    outputsAr: ['خريطة طريق منظّمة بالأسابيع', 'تسلسل الجهات الصحيح', 'ملخّص التكاليف الإجمالي'],
  },
  {
    id: 'chat',
    nameAr: 'وكيل المحادثة',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يحاور المستخدم بالعربية الخليجية، يستخرج البيانات من النص الحرّ، يطرح الأسئلة المناسبة فقط، ويختار الوضع (تأسيس/امتثال/تشغيلي).',
    outputsAr: [
      'أسئلة موجَّهة بالنشاط',
      'استخراج: المدينة، الموظفين، البيانات',
      'انتقال للوضع المطلوب',
    ],
  },
  {
    id: 'research',
    nameAr: 'وكيل البحث',
    layer: 'coordination',
    group: 'analysis',
    roleAr: 'يفحص الاسم التجاري المقترح ضد قواعد وزارة التجارة ويولّد بدائل مقبولة عند التضارب.',
    outputsAr: ['نتيجة فحص الاسم', 'بدائل اقتراحية', 'إشعار بقواعد الأسماء التجارية'],
  },
  {
    id: 'scan',
    nameAr: 'وكيل الفحص',
    layer: 'coordination',
    group: 'analysis',
    roleAr:
      'يجلب موقع المنشأة، ينفّذ 4 ماسحات (الخصوصية، رؤوس الأمان، التتبع، النماذج) ويُصنّف ما يجده.',
    outputsAr: ['ScanResult متكامل', 'كشف ملفات تعريف الارتباط', 'تقرير رؤوس الأمان'],
  },
  {
    id: 'regulatory',
    nameAr: 'وكيل الأنظمة',
    layer: 'coordination',
    group: 'analysis',
    roleAr:
      'يراقب التحديثات التنظيمية الجديدة (PDPL، NCA-ECC، ZATCA) ويُشعر المستخدم بما يخص نشاطه.',
    outputsAr: ['قائمة تحديثات نظامية', 'مدى تأثيرها على المشروع', 'وقت الإنفاذ'],
  },
  {
    id: 'analysis',
    nameAr: 'وكيل التحليل',
    layer: 'coordination',
    group: 'analysis',
    roleAr:
      'يقارن إجابات المستخدم وفحص الموقع مع 35 قاعدة PDPL و 114 ضابط NCA-ECC، يحسب نسبة الامتثال وسقف الغرامة الممكن.',
    outputsAr: ['نسبة الامتثال %', 'سقف الغرامة بالريال', 'قائمة الفجوات مع الأدلة'],
  },
  {
    id: 'report',
    nameAr: 'وكيل التقرير',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يجمع كل ما أنتجه الوكلاء الآخرون ويبني التقرير النهائي — masthead، فجوات، خريطة، تنبيهات، رسوم.',
    outputsAr: ['تقرير موحَّد للمشروع', 'لوحة معلومات تشغيلية', 'تنبيهات حرجة'],
  },
  {
    id: 'document',
    nameAr: 'وكيل المستندات',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يولّد مستندات قانونية مخصّصة بناءً على إجابات المستخدم — سياسة خصوصية، تعيين DPO، سجل معالجة، خطة استجابة لاختراق.',
    outputsAr: ['سياسة خصوصية بالعربية', 'سجل معالجة بيانات', 'خطة استجابة للحوادث'],
  },

  // ── Establishment specialists (6) ───────────────────────────────
  {
    id: 'mci',
    nameAr: 'متخصّص التجارة',
    layer: 'specialist',
    group: 'establishment',
    roleAr:
      'يفتح السجل التجاري في وزارة التجارة عبر منصة الأعمال — يفحص اسم المنشأة، يحدد الكيان القانوني، ويُصدر CR.',
    outputsAr: ['رقم سجل تجاري (CR)', 'بيانات المنشأة الرسمية', 'تنبيهات أنشطة محظورة'],
  },
  {
    id: 'municipality',
    nameAr: 'متخصّص البلدية',
    layer: 'specialist',
    group: 'establishment',
    roleAr: 'يستخرج رخصة بلدية حسب النشاط والمدينة — اشتراطات الموقع، النوع، التراخيص الفرعية.',
    outputsAr: ['رخصة محل بلدي', 'اشتراطات الموقع', 'متطلبات اللوحة التجارية'],
  },
  {
    id: 'civil_defense',
    nameAr: 'متخصّص الدفاع المدني',
    layer: 'specialist',
    group: 'establishment',
    roleAr:
      'يحدّد اشتراطات سلامة المنشأة (طفايات، مخارج طوارئ، إنذار) ويُصدر شهادة سلامة قبل البلدية.',
    outputsAr: ['شهادة سلامة', 'قائمة مستلزمات الإطفاء', 'متطلبات أنظمة الإنذار'],
  },
  {
    id: 'sfda',
    nameAr: 'متخصّص الغذاء والدواء',
    layer: 'specialist',
    group: 'establishment',
    roleAr:
      'يستخرج تراخيص SFDA للمطاعم/الصيدليات/مستحضرات التجميل — اشتراطات صحية، فحص دوري، شهادة صحية للعاملين.',
    outputsAr: ['ترخيص SFDA حسب النشاط', 'متطلبات الشهادات الصحية', 'جدول الفحص الدوري'],
  },
  {
    id: 'moh',
    nameAr: 'متخصّص وزارة الصحة',
    layer: 'specialist',
    group: 'establishment',
    roleAr:
      'يدير اشتراطات وزارة الصحة للأنشطة الصحية (مراكز تجميل، عيادات، فيزيوثيرابي) — تصنيف، اعتماد، رقابة.',
    outputsAr: ['ترخيص نشاط صحي', 'متطلبات الكوادر المعتمدة', 'اشتراطات التعقيم والتجهيز'],
  },
  {
    id: 'mohr_gosi',
    nameAr: 'متخصّص الموارد والتأمينات',
    layer: 'specialist',
    group: 'establishment',
    roleAr:
      'يربط المنشأة بنظام حماية الأجور، يسجّل الموظفين في GOSI، ويحسب نسب السعودة المطلوبة لنطاقات.',
    outputsAr: ['تسجيل GOSI', 'نسبة السعودة المستهدفة', 'حساب اشتراك التأمينات'],
  },

  // ── Tax + e-invoice (3) ─────────────────────────────────────────
  {
    id: 'zatca',
    nameAr: 'متخصّص الزكاة والضريبة',
    layer: 'specialist',
    group: 'tax',
    roleAr:
      'يحدّد التزامات ضريبة القيمة المضافة (VAT) والزكاة، يربط المنشأة بحساب ZATCA، ويوجّه للإقرارات الدورية.',
    outputsAr: ['تسجيل VAT', 'جدول الإقرارات', 'حساب الزكاة المتوقّع'],
  },
  {
    id: 'zatca_einvoice',
    nameAr: 'متخصّص الفوترة الإلكترونية',
    layer: 'specialist',
    group: 'tax',
    roleAr:
      'يدير الانتقال للمرحلة الثانية من الفوترة الإلكترونية — ربط ERP، توليد QR، التكامل مع ZATCA Fatoora.',
    outputsAr: ['خطة ربط Fatoora', 'متطلبات حقول الفاتورة', 'اختبار التكامل'],
  },
  {
    id: 'tax_strategy',
    nameAr: 'متخصّص التخطيط الضريبي',
    layer: 'specialist',
    group: 'tax',
    roleAr:
      'يقترح هيكلة ضريبية مُثلى (RHQ، خصومات، إعفاءات استثمارية) بناءً على نوع النشاط والحجم المتوقَّع.',
    outputsAr: ['تقدير الوفر الضريبي', 'هياكل ملاءمة', 'متطلبات الـ RHQ'],
  },

  // ── Compliance / cybersecurity (3) ──────────────────────────────
  {
    id: 'pdpl_nca',
    nameAr: 'متخصّص حماية البيانات',
    layer: 'specialist',
    group: 'compliance',
    roleAr:
      'يقيس الالتزام بنظام حماية البيانات الشخصية (PDPL): سياسة الخصوصية، DPO، سجل المعالجة، إخطار الاختراق، التدفقات عبر الحدود.',
    outputsAr: ['تقييم PDPL مفصَّل', 'فجوات سياسة الخصوصية', 'متى يُشترط DPO'],
  },
  {
    id: 'nca_ecc',
    nameAr: 'متخصّص ECC',
    layer: 'specialist',
    group: 'cybersecurity',
    roleAr:
      'يفحص الالتزام بضوابط الأمن السيبراني الأساسية للهيئة الوطنية (NCA-ECC): 114 ضابط على 5 محاور.',
    outputsAr: ['نضج ECC %', 'فجوات الـ 5 محاور', 'أولويات الإصلاح'],
  },
  {
    id: 'maroof',
    nameAr: 'متخصّص معروف',
    layer: 'specialist',
    group: 'compliance',
    roleAr:
      'يربط المتاجر الإلكترونية بمنصة معروف، يضمن الإفصاح عن البيانات، ويتحقق من شارة الموثوقية.',
    outputsAr: ['تسجيل في معروف', 'متطلبات الإفصاح', 'شارة الموثوقية'],
  },

  // ── Industry-specific (3) ───────────────────────────────────────
  {
    id: 'contractor_classification',
    nameAr: 'متخصّص تصنيف المقاولين',
    layer: 'specialist',
    group: 'industry',
    roleAr:
      'يحدّد درجة تصنيف المقاول (1–5) المطلوبة لحجم المشروع، ويوجّه لمتطلبات الكوادر وحجم رأس المال.',
    outputsAr: ['درجة التصنيف المستهدفة', 'متطلبات الكوادر الفنية', 'الوثائق المطلوبة'],
  },
  {
    id: 'saip_ip',
    nameAr: 'متخصّص الملكية الفكرية',
    layer: 'specialist',
    group: 'industry',
    roleAr:
      'يحمي العلامة التجارية، يسجّل براءات الاختراع وحقوق المؤلف عبر الهيئة السعودية للملكية الفكرية.',
    outputsAr: ['تسجيل العلامة التجارية', 'دراسة قابلية البراءة', 'حماية حقوق المؤلف'],
  },
  {
    id: 'customs',
    nameAr: 'متخصّص الجمارك',
    layer: 'specialist',
    group: 'industry',
    roleAr:
      'يدير اشتراطات الاستيراد والتصدير عبر منصتي Saber و FASAH — شهادات المطابقة، تخليص جمركي، تعرفة.',
    outputsAr: ['شهادة Saber', 'متطلبات FASAH', 'تقدير الرسوم الجمركية'],
  },
];

export const AGENT_LAYER_LABEL: Record<AgentCardData['layer'], string> = {
  coordination: 'وكلاء التنسيق',
  specialist: 'وكلاء متخصّصون بالجهات',
};

export const AGENT_GROUP_LABEL: Record<AgentCardData['group'], string> = {
  flow: 'إدارة التدفّق',
  analysis: 'التحليل والفحص',
  establishment: 'التأسيس',
  tax: 'الضريبة والفواتير',
  compliance: 'الامتثال',
  cybersecurity: 'الأمن السيبراني',
  industry: 'متخصّصو الصناعة',
};
