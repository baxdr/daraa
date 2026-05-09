import Link from 'next/link';
import { ArrowLeft } from '../primitives/arrow-left';

/**
 * Landing — "meet the 10 AI agents" section.
 *
 * Visual roster grouped by execution wave so visitors immediately
 * understand the parallelism + specialization story. Numbers + ids must
 * stay in sync with src/agents/types.ts AGENT_LABELS_AR (12 total; 10
 * use Claude — chat + research + analysis-narrator + 7 specialists).
 */

interface AgentRow {
  id: string;
  nameAr: string;
  engine: 'pure_claude' | 'claude_tools' | 'coordination';
  role: string;
}

const AGENTS: AgentRow[] = [
  // Coordination + LLM-driven (5)
  { id: 'chat', nameAr: 'وكيل المحادثة', engine: 'pure_claude', role: 'يجمع 16 معلومة عن محلك' },
  {
    id: 'research',
    nameAr: 'وكيل البحث',
    engine: 'pure_claude',
    role: 'web_search لآخر التحديثات التنظيمية',
  },
  {
    id: 'orchestrator',
    nameAr: 'المنسّق',
    engine: 'coordination',
    role: 'يشغّل المتخصصين بـ wave parallelism',
  },
  {
    id: 'analysis',
    nameAr: 'وكيل التحليل',
    engine: 'claude_tools',
    role: 'rule engine + narrator يكتب أولوياتك',
  },
  { id: 'report', nameAr: 'وكيل التقرير', engine: 'coordination', role: 'يجمّع outputs' },
  // 7 specialist tool-using agents
  {
    id: 'mci',
    nameAr: 'متخصّص التجارة',
    engine: 'claude_tools',
    role: 'check_renewal_urgency للسجل التجاري',
  },
  {
    id: 'zatca',
    nameAr: 'متخصّص الضريبة',
    engine: 'claude_tools',
    role: 'check_vat_threshold (375K SAR)',
  },
  {
    id: 'mohr_gosi',
    nameAr: 'الموارد + التأمينات',
    engine: 'claude_tools',
    role: 'estimate_nitaqat_zone',
  },
  {
    id: 'civil_defense',
    nameAr: 'الدفاع المدني',
    engine: 'claude_tools',
    role: 'calculate_extinguisher_count',
  },
  {
    id: 'municipality',
    nameAr: 'البلدية',
    engine: 'claude_tools',
    role: 'estimate_balady_cost',
  },
  {
    id: 'sfda',
    nameAr: 'الغذاء والدواء',
    engine: 'claude_tools',
    role: 'list_food_safety_requirements',
  },
  {
    id: 'moh',
    nameAr: 'وزارة الصحة',
    engine: 'claude_tools',
    role: 'list_health_requirements',
  },
];

const ENGINE_TONE: Record<AgentRow['engine'], { label: string; pill: string }> = {
  pure_claude: {
    label: 'ذكاء اصطناعي · محادثة',
    pill: 'border-accent/40 bg-accent-soft text-accent-strong',
  },
  claude_tools: {
    label: 'ذكاء اصطناعي + أدوات',
    pill: 'border-accent/40 bg-accent-soft text-accent-strong',
  },
  coordination: {
    label: 'منسّق',
    pill: 'border-ink/30 bg-ink/5 text-ink',
  },
};

export function AgentsPreview() {
  return (
    <section
      id="agents-preview"
      className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24"
    >
      <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <span className="eyebrow">طبقة الذكاء الاصطناعي</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            ١٢ ايجنت
          </h2>
          <div className="rule-accent mt-3 w-12" />
          <p className="mt-4 text-base leading-relaxed text-ink-2">
            مو ايجنت واحد كبير. كل ايجنت متخصّص في جهة، يستدعي أدوات لجلب الحقائق، وينشر رسالة
            للايجنت الجاي. تصميم متعدد الايجنتات حديث.
          </p>
        </div>
        <Link href="/agents" className="btn-outline text-sm">
          الكتالوج الكامل
          <ArrowLeft />
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {AGENTS.map((agent, i) => (
          <AgentChip key={agent.id} agent={agent} index={i} />
        ))}
      </div>
    </section>
  );
}

function AgentChip({ agent, index }: { agent: AgentRow; index: number }) {
  const tone = ENGINE_TONE[agent.engine];
  return (
    <div className="group border border-rule bg-white p-4 transition-all hover:border-ink hover:shadow-card md:p-5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] tabular-nums text-muted">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span
          className={`pill border text-[9px] font-bold tracking-widest ${tone.pill}`}
          title={tone.label}
        >
          {tone.label}
        </span>
      </div>
      <div className="font-display text-sm font-extrabold text-ink md:text-base">
        {agent.nameAr}
      </div>
      <div className="mt-1 font-mono text-[10px] text-muted" dir="ltr">
        {agent.id}
      </div>
      <p className="mt-2.5 text-[12px] leading-relaxed text-ink-2">{agent.role}</p>
    </div>
  );
}
