'use client';

/**
 * Post-chat handoff teaser.
 *
 * Replaces the previous one-line "جاري تحضير تقريرك…" with a richer
 * visualisation: a labelled roster of the agents about to run, with
 * a sequential shimmer that mirrors wave-based execution.
 *
 * Pure presentational — the actual orchestrator is fired by the hook
 * that owns the chat session. This card is just the visible promise.
 */

interface AgentBeat {
  id: string;
  nameAr: string;
  wave: number;
}

const AGENT_BEATS: AgentBeat[] = [
  { id: 'research', nameAr: 'وكيل البحث', wave: 1 },
  { id: 'mci', nameAr: 'متخصّص التجارة', wave: 2 },
  { id: 'zatca', nameAr: 'متخصّص الضريبة', wave: 2 },
  { id: 'mohr_gosi', nameAr: 'الموارد + التأمينات', wave: 2 },
  { id: 'civil_defense', nameAr: 'الدفاع المدني', wave: 2 },
  { id: 'municipality', nameAr: 'البلدية', wave: 3 },
  { id: 'sfda', nameAr: 'الغذاء والدواء', wave: 4 },
  { id: 'moh', nameAr: 'وزارة الصحة', wave: 4 },
  { id: 'analysis', nameAr: 'وكيل التحليل', wave: 5 },
];

export function AgentLaunchTeaser() {
  return (
    <div className="space-y-4 border border-accent/30 bg-accent-soft p-4 md:p-5">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <span aria-hidden className="h-2 w-2 animate-pulse rounded-full bg-accent" />
          <span className="font-display text-sm font-extrabold text-accent-strong md:text-base">
            وكيل المحادثة خلّص — الفريق ينطلق
          </span>
        </div>
        <span className="font-mono text-[10px] uppercase tracking-widest text-accent-strong/70">
          ٩ ايجنتات
        </span>
      </div>

      <p className="text-xs leading-relaxed text-ink-2">
        كل ايجنت يستلم إجاباتك، يستدعي أدوات للحقائق، ويرسل رسالة للايجنت التالي عبر الـ AgentBus.
      </p>

      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-3 md:grid-cols-3">
        {AGENT_BEATS.map((agent, idx) => (
          <AgentChip key={agent.id} agent={agent} index={idx} />
        ))}
      </div>

      <p className="text-[11px] text-accent-strong/80">
        راح ننقلك للوحة المشروع لما يخلصون — تشوف كل استدعاء أداة + المخرج بشكل حيّ.
      </p>
    </div>
  );
}

function AgentChip({ agent, index }: { agent: AgentBeat; index: number }) {
  // Stagger the shimmer so the chips light up wave-by-wave.
  const delay = `${index * 120}ms`;
  return (
    <div
      className="flex items-center gap-2 border border-accent/20 bg-white px-2.5 py-2"
      style={{ animation: 'fade-rise 600ms both', animationDelay: delay }}
    >
      <span className="font-mono text-[9px] tabular-nums text-muted">w{agent.wave}</span>
      <span className="truncate font-display text-[11px] font-bold text-ink">{agent.nameAr}</span>
    </div>
  );
}
