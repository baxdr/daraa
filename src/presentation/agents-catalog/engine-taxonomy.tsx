/**
 * Engine taxonomy explainer for the /agents page.
 *
 * Most visitors won't understand the difference between "claude_llm",
 * "claude_llm_tools", "deterministic" and "orchestrator". This section
 * teaches the distinctions in 4 cards so the engine pills they see on
 * each agent card are interpretable.
 */

import { AGENTS_CATALOG, type AgentEngine } from './data';

interface EngineExplainer {
  id: AgentEngine;
  titleAr: string;
  descAr: string;
  exampleAr: string;
  tone: string;
}

const ENGINE_EXPLAINERS: EngineExplainer[] = [
  {
    id: 'claude_llm',
    titleAr: 'Claude — محادثة',
    descAr:
      'Claude يقرأ نصاً حرّاً ويرجع جواب structured. ما يستدعي tools خارجية، يستخدم prompt + JSON output.',
    exampleAr: 'وكيل المحادثة + analysis narrator',
    tone: 'border-accent/40 bg-accent-soft text-accent-strong',
  },
  {
    id: 'claude_llm_tools',
    titleAr: 'Claude + tool use',
    descAr:
      'Claude في loop يستدعي tools deterministic للحقائق (طفايات، نطاقات، شهادات…) ثم يصيغ المخرج. هذا الـ pattern الموصى به ٢٠٢٥.',
    exampleAr: '٧ متخصصين (mci, civil_defense, sfda, …)',
    tone: 'border-accent/40 bg-accent-soft text-accent-strong',
  },
  {
    id: 'claude_web_search',
    titleAr: 'Claude + web_search',
    descAr:
      'Claude يستخدم tool رسمي من Anthropic (web_search_20250305) لجلب آخر التحديثات التنظيمية من المواقع الحكومية.',
    exampleAr: 'وكيل البحث',
    tone: 'border-accent/40 bg-accent-soft text-accent-strong',
  },
  {
    id: 'orchestrator',
    titleAr: 'منسّق (لا LLM)',
    descAr:
      'كود thin يدير الـ pipeline: يطلق الـ AgentBus، يجدول الموجات، ويجمّع الـ outputs. هو الإطار، مو الذكاء.',
    exampleAr: 'project orchestrator + report',
    tone: 'border-ink/30 bg-ink/5 text-ink',
  },
];

export function EngineTaxonomy() {
  // Count agents per engine type so the labels show real ratios.
  const counts = AGENTS_CATALOG.reduce<Record<string, number>>((acc, a) => {
    acc[a.engine] = (acc[a.engine] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <section className="mb-16">
      <div className="mb-8">
        <span className="eyebrow">طبقات المحرّك</span>
        <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          ٤ أنواع من المحرّكات
        </h2>
        <div className="rule-accent mt-3 w-12" />
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
          مو كل ايجنت يحتاج LLM. الذكي هو ضبط المحرّك حسب طبيعة الشغل: محادثة، استدعاء tools، بحث،
          أو مجرد تنسيق. اللي تحت يفسّر كل نوع.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {ENGINE_EXPLAINERS.map((eng) => (
          <div key={eng.id} className="border border-rule bg-white p-5 md:p-6">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span
                className={`pill border text-[10px] font-bold tracking-widest ${eng.tone}`}
                title={eng.id}
              >
                {eng.titleAr}
              </span>
              <span className="font-mono text-[10px] tabular-nums text-muted" dir="ltr">
                {eng.id}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-ink-2">{eng.descAr}</p>
            <div className="mt-4 flex items-center justify-between border-t border-rule pt-3">
              <span className="text-[11px] text-muted">المُستخدمون</span>
              <span className="text-[11px] font-bold text-ink">
                {eng.exampleAr}
                {counts[eng.id] !== undefined && (
                  <span className="ms-2 font-mono text-muted" dir="ltr">
                    ({counts[eng.id]})
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
