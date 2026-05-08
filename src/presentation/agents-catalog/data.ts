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
  group: 'flow' | 'analysis' | 'shop' | 'tax';
  roleAr: string;
  outputsAr: string[];
}

export const AGENTS_CATALOG: AgentCardData[] = [
  // ── Coordination layer (5) ──────────────────────────────────────
  {
    id: 'orchestrator',
    nameAr: 'المنسّق',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يدير دورة حياة المشروع — يطلق الوكلاء بالتوازي حسب الاعتمادية، يرتّب الجهات، ويحرّر الأحداث على timeline واحد.',
    outputsAr: ['خريطة طريق منظّمة بالأسابيع', 'تسلسل الجهات الصحيح', 'ملخّص التكاليف الإجمالي'],
  },
  {
    id: 'chat',
    nameAr: 'وكيل المحادثة',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يحاور المالك بالعربية الخليجية، يستخرج البيانات من النص الحرّ، ويطرح الأسئلة الخاصة بمحلك فقط.',
    outputsAr: ['أسئلة موجَّهة بالنشاط', 'استخراج: المدينة، الموظفين، الرخص', 'تأكيد التكامل'],
  },
  {
    id: 'research',
    nameAr: 'وكيل البحث',
    layer: 'coordination',
    group: 'analysis',
    roleAr:
      'يبحث على الويب عن آخر التحديثات التنظيمية للجهات السعودية ويبثّها للمتخصّصين المعنيين.',
    outputsAr: ['قائمة تحديثات نظامية', 'مدى تأثيرها على المحل', 'وقت الإنفاذ'],
  },
  {
    id: 'analysis',
    nameAr: 'وكيل التحليل',
    layer: 'coordination',
    group: 'analysis',
    roleAr:
      'يطبّق قواعد تشغيل المحل على إجاباتك ليكشف الفجوات (تجديدات متأخرة، طفايات ناقصة، شهادات صحية، تهوية، تبريد، لوحة).',
    outputsAr: ['نسبة صحة الرخص %', 'فجوات مرتّبة بالأولوية', 'سقف الغرامات المحتمل'],
  },
  {
    id: 'report',
    nameAr: 'وكيل التقرير',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يجمع كل ما أنتجه الوكلاء الآخرون ويبني تقرير المحل النهائي مع جدول التذكيرات بالتجديدات.',
    outputsAr: ['تقرير موحَّد للمحل', 'جدول التذكيرات بالتجديدات', 'تنبيهات حرجة'],
  },

  // ── Shop specialists (7) ────────────────────────────────────────
  {
    id: 'mci',
    nameAr: 'متخصّص التجارة',
    layer: 'specialist',
    group: 'shop',
    roleAr: 'يتابع السجل التجاري — تجديد سنوي، تحديث النشاط، إشعار قبل الانتهاء.',
    outputsAr: ['موعد تجديد السجل', 'متطلبات التحديث', 'روابط منصة الأعمال'],
  },
  {
    id: 'municipality',
    nameAr: 'متخصّص البلدية',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'يتابع رخصة البلدية حسب نوع نشاط المحل — اشتراطات الموقع، اللوحة الإعلانية، نوع التراخيص الفرعية.',
    outputsAr: ['موعد تجديد رخصة البلدية', 'اشتراطات اللوحة', 'تنبيهات النطاقات'],
  },
  {
    id: 'civil_defense',
    nameAr: 'متخصّص الدفاع المدني',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'يتأكّد من جاهزية وسائل السلامة (طفايات، مخارج طوارئ، إنذار، تهوية للمطابخ) ومن سريان شهادة السلامة السنوية.',
    outputsAr: ['شهادة السلامة وموعد تجديدها', 'قائمة طفايات الحريق', 'متطلبات أنظمة الإنذار'],
  },
  {
    id: 'sfda',
    nameAr: 'متخصّص الغذاء والدواء',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'يتابع ترخيص SFDA للمنشآت الغذائية (مطعم، كوفي، بقالة) — اشتراطات النظافة، التبريد، التخزين، تواريخ الصلاحية.',
    outputsAr: ['ترخيص SFDA حسب النشاط', 'متطلبات الشهادات الصحية', 'جدول الفحص الدوري'],
  },
  {
    id: 'moh',
    nameAr: 'متخصّص وزارة الصحة',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'يدير اشتراطات الترخيص الصحي للصالونات والمطاعم — تعقيم الأدوات، شهادات صحية، تأهيل الكادر.',
    outputsAr: ['الترخيص الصحي وموعد تجديده', 'متطلبات الكوادر المعتمدة', 'اشتراطات التعقيم'],
  },
  {
    id: 'mohr_gosi',
    nameAr: 'متخصّص الموارد والتأمينات',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'يتابع ملف المنشأة في وزارة الموارد البشرية + اشتراك التأمينات الشهري للموظفين، ويُنبّه عن نطاقات.',
    outputsAr: ['تسجيل GOSI', 'نسبة السعودة المستهدفة', 'حساب اشتراك التأمينات'],
  },
  {
    id: 'zatca',
    nameAr: 'متخصّص الزكاة والضريبة',
    layer: 'specialist',
    group: 'tax',
    roleAr:
      'يحدّد التزامات ضريبة القيمة المضافة (VAT) والزكاة — يخبرك متى تتجاوز ٣٧٥ ألف ريال ويوجّه للإقرارات الدورية.',
    outputsAr: ['تسجيل VAT', 'جدول الإقرارات', 'حساب الزكاة المتوقّع'],
  },
];

export const AGENT_LAYER_LABEL: Record<AgentCardData['layer'], string> = {
  coordination: 'وكلاء التنسيق',
  specialist: 'وكلاء متخصّصون بالجهات',
};

export const AGENT_GROUP_LABEL: Record<AgentCardData['group'], string> = {
  flow: 'إدارة التدفّق',
  analysis: 'التحليل والفحص',
  shop: 'إجراءات المحل',
  tax: 'الضريبة والفواتير',
};
