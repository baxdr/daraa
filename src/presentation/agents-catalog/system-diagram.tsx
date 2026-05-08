import { AGENTS_CATALOG } from './data';

/**
 * System diagram — visualizes the wave-based execution of the 12 agents.
 *
 * Wave 0: chat (pre-pipeline, runs while user types)
 * Wave 1: orchestrator (kicks everything off)
 * Wave 2: research (broadcasts updates)
 * Wave 3: mci → unblocks zatca + mohr_gosi + civil_defense
 * Wave 4: civil_defense unblocks municipality + analysis runs in parallel
 * Wave 5: municipality unblocks sfda + moh, then report wraps up
 *
 * The diagram is purely declarative — pulls wave numbers straight from
 * AGENTS_CATALOG so it stays in sync with reality.
 */

const WAVE_LABELS: Record<number, string> = {
  0: 'قبل الـ pipeline',
  1: 'الموجة ١',
  2: 'الموجة ٢',
  3: 'الموجة ٣',
  4: 'الموجة ٤',
  5: 'الموجة ٥',
};

const WAVE_DESCRIPTION: Record<number, string> = {
  0: 'وكيل المحادثة — يجمع البيانات قبل إطلاق الباقي',
  1: 'المنسّق يبدأ الـ pipeline',
  2: 'البحث يبثّ التحديثات التنظيمية للمتخصصين',
  3: 'متخصصو الجذر يشتغلون بالتوازي (يعتمدون على mci فقط)',
  4: 'متخصصو الموجة الثانية + التحليل التشغيلي',
  5: 'المتخصصون النهائيون + التقرير الموحّد',
};

export function SystemDiagram() {
  // Group agents by wave.
  const byWave = new Map<number, typeof AGENTS_CATALOG>();
  for (const agent of AGENTS_CATALOG) {
    const wave = agent.workflow.wave;
    const existing = byWave.get(wave) ?? [];
    existing.push(agent);
    byWave.set(wave, existing);
  }
  const waves = [...byWave.entries()].sort(([a], [b]) => a - b);

  return (
    <section className="mb-16">
      <div className="mb-8">
        <span className="eyebrow">معمارية النظام</span>
        <h2 className="mt-2 font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          كيف تشتغل الموجات
        </h2>
        <div className="rule-accent mt-3 w-12" />
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-2">
          الـ AgentBus يطلق الوكلاء حسب الـ dependencies — كل موجة تنتظر اللي قبلها تنتهي. مو
          if-branches محشورة، الوكيل يختار يشتغل لما تصله الإشارة الصحيحة.
        </p>
      </div>

      <div className="border border-rule bg-paper-2/40">
        {waves.map(([wave, agents], i) => (
          <div
            key={wave}
            className={`grid grid-cols-[120px_1fr] ${
              i < waves.length - 1 ? 'border-b border-rule' : ''
            }`}
          >
            <div className="border-e border-rule bg-white p-4 md:p-5">
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                {WAVE_LABELS[wave] ?? `Wave ${wave}`}
              </div>
              <div className="mt-1 font-display text-3xl font-extrabold tabular-nums text-ink">
                {String(wave).padStart(2, '0')}
              </div>
            </div>
            <div className="p-4 md:p-5">
              <p className="mb-3 text-xs leading-relaxed text-ink-2">
                {WAVE_DESCRIPTION[wave] ?? ''}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {agents.map((a) => (
                  <span
                    key={a.id}
                    className="border border-ink bg-white px-2.5 py-1 font-display text-xs font-bold text-ink"
                    title={a.workflow.outputs[0]}
                  >
                    {a.nameAr}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
