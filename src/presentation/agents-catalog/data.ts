/**
 * Static catalog of every agent in the platform — used by the public
 * /agents directory page. Counts must stay in sync with
 * src/agents/types.ts AGENT_LABELS_AR.
 *
 * Workflow fields below are derived from the real source — they describe
 * what each agent's `run()` does, not aspirational behavior.
 */

import type { AgentId } from '@/agents/types';

/** What powers the agent's decision-making. */
export type AgentEngine =
  | 'orchestrator' // Coordinates other agents — no LLM, runs the bus
  | 'claude_llm' // Pure Claude conversation
  | 'claude_web_search' // Claude + web_search_20250305 tool
  | 'deterministic' // Pure function — rules + dates, no LLM
  | 'inbox_driven'; // Reads inbox messages, applies vertical-aware logic

export interface AgentWorkflow {
  /** What the agent reads on each run. */
  inputs: string[];
  /** What the agent produces (entity card fields, outbox messages). */
  outputs: string[];
  /** Other agents this one waits for (real `dependencies` from code). */
  dependsOn?: AgentId[];
  /** Agents this one notifies via outbox. */
  notifies?: AgentId[];
  /** Wave number — used by the system diagram. 0 = pre-pipeline (chat). */
  wave: number;
}

export interface AgentCardData {
  id: AgentId;
  nameAr: string;
  layer: 'coordination' | 'specialist';
  group: 'flow' | 'analysis' | 'shop' | 'tax';
  roleAr: string;
  outputsAr: string[];
  engine: AgentEngine;
  /** Path of the source file (relative to src/). For the "open the source"
   *  link on each card. */
  sourcePath: string;
  workflow: AgentWorkflow;
}

export const AGENTS_CATALOG: AgentCardData[] = [
  // ── Coordination layer (5) ──────────────────────────────────────
  {
    id: 'orchestrator',
    nameAr: 'المنسّق',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يدير دورة حياة المشروع — يطلق الوكلاء حسب الـ dependencies، يدير الـ AgentBus، ويبني تقرير المحل النهائي.',
    outputsAr: ['خريطة طريق منظّمة', 'تسلسل الجهات الصحيح', 'ملخّص التكاليف الإجمالي'],
    engine: 'orchestrator',
    sourcePath: 'src/agents/project-orchestrator/runner.ts',
    workflow: {
      wave: 1,
      inputs: ['ProjectRecord من الـ store', 'إجابات /chat'],
      outputs: [
        'يطلق research → specialists (موجات) → analysis',
        'يحدّث ProjectRecord بـ entities + roadmap + renewals',
        'يحوّل للـ active_monitoring phase',
      ],
      notifies: ['research', 'analysis', 'report'],
    },
  },
  {
    id: 'chat',
    nameAr: 'وكيل المحادثة',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يحاور المالك بالعربية الخليجية، يستخرج البيانات من النص الحرّ، ويطرح الأسئلة الخاصة بمحلك فقط.',
    outputsAr: ['أسئلة موجَّهة بالنشاط', 'استخراج: المدينة، الموظفين، الرخص', 'تأكيد التكامل'],
    engine: 'claude_llm',
    sourcePath: 'src/agents/chat-agent/',
    workflow: {
      wave: 0,
      inputs: ['نص المستخدم الحرّ', 'currentQuestion من ChatSession'],
      outputs: [
        'يطلب من Claude تحويل النص → جواب structured',
        'يحقق صلاحيته عبر validators.ts (date/number/url)',
        'يختار السؤال التالي عبر flow.ts (مع conditional skips)',
      ],
    },
  },
  {
    id: 'research',
    nameAr: 'وكيل البحث',
    layer: 'coordination',
    group: 'analysis',
    roleAr:
      'يبحث على الويب عن آخر التحديثات التنظيمية للجهات السعودية ويبثّها للمتخصّصين المعنيين.',
    outputsAr: ['قائمة تحديثات نظامية', 'مدى تأثيرها على المحل', 'وقت الإنفاذ'],
    engine: 'claude_web_search',
    sourcePath: 'src/agents/research-agent.ts',
    workflow: {
      wave: 2,
      inputs: ['قائمة active specialists من orchestrator'],
      outputs: [
        'يستعلم web_search لكل specialist (مثلاً "آخر تحديثات SFDA 2026")',
        'يبثّ كل update كرسالة `update` على AgentBus',
        'fallback لقائمة محققة لو web_search فشل',
      ],
      notifies: ['sfda', 'civil_defense', 'municipality', 'mohr_gosi', 'zatca'],
    },
  },
  {
    id: 'analysis',
    nameAr: 'وكيل التحليل',
    layer: 'coordination',
    group: 'analysis',
    roleAr:
      'يطبّق قواعد تشغيل المحل على إجاباتك ليكشف الفجوات (تجديدات متأخرة، طفايات ناقصة، شهادات صحية، تهوية، تبريد، لوحة).',
    outputsAr: ['نسبة صحة الرخص %', 'فجوات مرتّبة بالأولوية', 'سقف الغرامات المحتمل'],
    engine: 'deterministic',
    sourcePath: 'src/agents/operational-analysis/runner.ts',
    workflow: {
      wave: 4,
      inputs: ['إجابات chat (op3-op10)', 'تاريخ اليوم', 'vertical'],
      outputs: [
        'يطبّق ~10 قواعد: CR/balady/civil_defense/SFDA expiry + extinguishers + emergency exit + ventilation + refrigeration + hygiene + signage + nitaqat + lease',
        'يولّد OperationalReport: gaps + overdue + upcoming + healthScore',
      ],
    },
  },
  {
    id: 'report',
    nameAr: 'وكيل التقرير',
    layer: 'coordination',
    group: 'flow',
    roleAr:
      'يجمع كل ما أنتجه الوكلاء الآخرون ويبني تقرير المحل النهائي مع جدول التذكيرات بالتجديدات.',
    outputsAr: ['تقرير موحَّد للمحل', 'جدول التذكيرات بالتجديدات', 'تنبيهات حرجة'],
    engine: 'deterministic',
    sourcePath: 'src/agents/project-orchestrator/runner.ts',
    workflow: {
      wave: 5,
      inputs: ['نتائج كل specialists', 'OperationalReport', 'topWarnings'],
      outputs: [
        'يبني entities[] + roadmap[] + renewals[] calendar',
        'يولّد topWarnings من الفحوصات الحرجة',
        'يحوّل status لـ complete + phase لـ active_monitoring',
      ],
    },
  },

  // ── Shop specialists (7) ────────────────────────────────────────
  {
    id: 'mci',
    nameAr: 'متخصّص التجارة',
    layer: 'specialist',
    group: 'shop',
    roleAr: 'يتابع السجل التجاري — تجديد سنوي، تحديث النشاط، إشعار قبل الانتهاء.',
    outputsAr: ['موعد تجديد السجل', 'متطلبات التحديث', 'روابط منصة الأعمال'],
    engine: 'inbox_driven',
    sourcePath: 'src/agents/specialists/mci-agent.ts',
    workflow: {
      wave: 3,
      inputs: ['vertical من الـ context (no inbox)'],
      dependsOn: [],
      notifies: ['zatca', 'mohr_gosi', 'civil_defense'],
      outputs: [
        'EntityInfo: السجل التجاري (renewal=12mo، رسوم 200-400 ريال)',
        'يبثّ `crReady: true` لكل الـ ALL → يفتح الباب لباقي الوكلاء',
      ],
    },
  },
  {
    id: 'civil_defense',
    nameAr: 'متخصّص الدفاع المدني',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'يحدّد متطلبات السلامة (طفايات، مخارج طوارئ، إنذار، تهوية للمطابخ) ومن سريان شهادة السلامة السنوية.',
    outputsAr: ['شهادة السلامة وموعد تجديدها', 'قائمة طفايات الحريق', 'متطلبات أنظمة الإنذار'],
    engine: 'inbox_driven',
    sourcePath: 'src/agents/specialists/civil-defense-agent.ts',
    workflow: {
      wave: 3,
      inputs: ['inbox: mci.crReady', 'context.vertical'],
      dependsOn: ['mci'],
      notifies: ['municipality'],
      outputs: [
        'requirements تتكيّف للـ vertical (مطعم → نظام إطفاء تلقائي للمطبخ)',
        'يمرّر `hasKitchen` لـ municipality في outbox',
      ],
    },
  },
  {
    id: 'municipality',
    nameAr: 'متخصّص البلدية',
    layer: 'specialist',
    group: 'shop',
    roleAr: 'يتابع رخصة البلدية حسب نوع نشاط المحل — اشتراطات الموقع، اللوحة الإعلانية، التصنيف.',
    outputsAr: ['موعد تجديد رخصة البلدية', 'اشتراطات اللوحة', 'تنبيهات النطاقات'],
    engine: 'inbox_driven',
    sourcePath: 'src/agents/specialists/municipality-agent.ts',
    workflow: {
      wave: 4,
      inputs: ['inbox: civil_defense.safetyCertReady', 'inbox: mohr_gosi nitaqat warning'],
      dependsOn: ['civil_defense'],
      notifies: ['sfda', 'moh'],
      outputs: [
        'licenceLabel حسب الـ vertical (نشاط غذائي / صالون / مغسلة)',
        'لو فيه مطبخ → يضيف ترخيص مطبخ تجاري',
        'لو nitaqat أحمر → critical warning + قيود',
      ],
    },
  },
  {
    id: 'sfda',
    nameAr: 'متخصّص الغذاء والدواء',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'للمنشآت الغذائية فقط (مطعم، كوفي، بقالة) — اشتراطات النظافة، التبريد، التخزين، شهادات صحية.',
    outputsAr: ['ترخيص SFDA حسب النشاط', 'متطلبات الشهادات الصحية', 'جدول الفحص الدوري'],
    engine: 'inbox_driven',
    sourcePath: 'src/agents/specialists/sfda-agent.ts',
    workflow: {
      wave: 5,
      inputs: ['inbox: municipality.licenseReady (with hasKitchen flag)'],
      dependsOn: ['municipality'],
      notifies: ['mohr_gosi'],
      outputs: [
        'requirements تتكيّف (مطبخ ↔ HACCP plan)',
        'يطلب شهادات صحية للعاملين الغذائيين من mohr_gosi',
      ],
    },
  },
  {
    id: 'moh',
    nameAr: 'متخصّص وزارة الصحة',
    layer: 'specialist',
    group: 'shop',
    roleAr: 'للصالونات والمطاعم — تعقيم الأدوات، شهادات صحية للعاملين، تأهيل الكادر.',
    outputsAr: ['الترخيص الصحي وموعد تجديده', 'متطلبات الكوادر المعتمدة', 'اشتراطات التعقيم'],
    engine: 'inbox_driven',
    sourcePath: 'src/agents/specialists/moh-agent.ts',
    workflow: {
      wave: 5,
      inputs: ['inbox: municipality.licenseReady'],
      dependsOn: ['municipality'],
      notifies: ['mohr_gosi'],
      outputs: [
        'requirements مختلفة بين صالون (تعقيم Autoclave) ومطعم (نظافة المشترك)',
        'يطلب شهادات صحية من mohr_gosi',
      ],
    },
  },
  {
    id: 'mohr_gosi',
    nameAr: 'متخصّص الموارد والتأمينات',
    layer: 'specialist',
    group: 'shop',
    roleAr:
      'يتابع ملف المنشأة في وزارة الموارد البشرية + اشتراك التأمينات الشهري للموظفين، ويُنبّه عن نطاقات.',
    outputsAr: ['تسجيل GOSI', 'نسبة السعودة المستهدفة', 'حساب اشتراك التأمينات'],
    engine: 'inbox_driven',
    sourcePath: 'src/agents/specialists/mohr-gosi-agent.ts',
    workflow: {
      wave: 3,
      inputs: ['inbox: mci.crReady', 'op8_employee_count من chat'],
      dependsOn: ['mci'],
      notifies: ['municipality', 'mci'],
      outputs: [
        'يقدّر نطاقات بالـ headcount (≥50 = أحمر، ≥10 = أصفر)',
        'لو أحمر → warning لـ municipality + mci بأن الخدمات تتقيّد',
      ],
    },
  },
  {
    id: 'zatca',
    nameAr: 'متخصّص الزكاة والضريبة',
    layer: 'specialist',
    group: 'tax',
    roleAr:
      'يحدّد التزامات ضريبة القيمة المضافة (VAT) — متى تتجاوز ٣٧٥ ألف ريال، الإقرارات الدورية.',
    outputsAr: ['تسجيل VAT', 'جدول الإقرارات', 'حساب الزكاة المتوقّع'],
    engine: 'inbox_driven',
    sourcePath: 'src/agents/specialists/zatca-agent.ts',
    workflow: {
      wave: 3,
      inputs: ['inbox: mci.crReady', 'inbox: research updates عن VAT'],
      dependsOn: ['mci'],
      outputs: ['requirements VAT حسب حد ٣٧٥K SAR', 'يدمج research updates في commonMistake field'],
    },
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

export const ENGINE_LABEL: Record<AgentEngine, string> = {
  orchestrator: 'منسّق الـ pipeline',
  claude_llm: 'Claude — محادثة',
  claude_web_search: 'Claude + web_search',
  deterministic: 'دالة حتمية (no LLM)',
  inbox_driven: 'inbox-driven (AgentBus)',
};

export const ENGINE_TONE: Record<AgentEngine, string> = {
  orchestrator: 'border-ink/30 bg-ink/5 text-ink',
  claude_llm: 'border-accent/40 bg-accent-soft text-accent-strong',
  claude_web_search: 'border-accent/40 bg-accent-soft text-accent-strong',
  deterministic: 'border-warn/40 bg-warn-soft text-warn-strong',
  inbox_driven: 'border-warn/40 bg-warn-soft text-warn-strong',
};
