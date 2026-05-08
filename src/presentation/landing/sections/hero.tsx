import Link from 'next/link';
import { ArrowLeft } from '../primitives/arrow-left';

/**
 * Landing hero — leads with the AI agent story.
 *
 * The right-side aside renders a miniature live-trace card mimicking the
 * `/project/[id]` agent-traces panel. Static (no real Claude call), but
 * shaped exactly like the real component so visitors see what they'll
 * get inside the product.
 */
export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
      <div className="grid items-center gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <div className="mb-5 inline-flex animate-fade-rise items-center gap-2 border border-accent/30 bg-accent-soft px-3 py-1.5 text-[10px] font-bold tracking-widest text-accent-strong">
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            ١٠ ايجنتات ذكاء اصطناعي · يشتغلون الآن لمحلك
          </div>

          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tighter text-ink md:text-6xl lg:text-7xl">
            <span className="block animate-fade-rise">رخص محلك،</span>
            <span
              className="block animate-fade-rise text-accent"
              style={{ animationDelay: '160ms' }}
            >
              تحت السيطرة
            </span>
          </h1>

          <div className="mt-8 max-w-xl animate-fade-rise" style={{ animationDelay: '320ms' }}>
            <div className="rule-accent mb-5 w-16" />
            <p className="text-lg leading-relaxed text-ink-2 md:text-xl">
              <span className="font-bold">١٠ ايجنتات ذكاء اصطناعي</span> يتقاسمون فحص محلك — كل واحد
              متخصّص في جهة (التجارة، البلدية، الدفاع المدني، SFDA…) ويستدعي أدوات للحقائق ثم يكتب
              تفسيراً عربياً واضحاً.
            </p>
          </div>

          <div
            className="mt-10 flex animate-fade-rise flex-col gap-3 sm:flex-row sm:gap-4"
            style={{ animationDelay: '480ms' }}
          >
            <Link href="/chat" className="btn-ink text-base">
              ابدأ متابعة محلك
              <ArrowLeft />
            </Link>
            <Link href="/agents" className="btn-outline text-base">
              شف الـ ١٠ ايجنتات
              <ArrowLeft />
            </Link>
          </div>

          <p
            className="mt-6 animate-fade-rise text-xs text-muted"
            style={{ animationDelay: '600ms' }}
          >
            <span className="font-mono font-bold text-ink">٥</span> فئات محلات · مطعم، كوفي، بقالة،
            مغسلة، صالون · مجاني للتجربة
          </p>
        </div>

        <aside
          className="relative animate-fade-rise md:col-span-5"
          style={{ animationDelay: '700ms' }}
        >
          <TraceMiniPreview />
        </aside>
      </div>
    </section>
  );
}

function TraceMiniPreview() {
  return (
    <div className="relative border border-rule bg-white shadow-card">
      {/* Card chrome */}
      <div className="flex items-center justify-between border-b border-rule bg-paper-2/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
            agent trace · live
          </span>
        </div>
        <span className="font-mono text-[10px] tabular-nums text-muted" dir="ltr">
          agent + tools
        </span>
      </div>

      {/* Agent identity */}
      <div className="border-b border-rule px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="font-display text-sm font-extrabold text-ink">متخصّص الدفاع المدني</span>
          <span className="pill border border-accent/40 bg-accent-soft text-[9px] font-bold tracking-widest text-accent-strong">
            حيّ
          </span>
        </div>
        <div className="mt-1 font-mono text-[10px] text-muted" dir="ltr">
          civil_defense
        </div>
      </div>

      {/* Tool calls */}
      <div className="space-y-1.5 px-4 py-3">
        <ToolCallRow name="get_shop_summary" duration="2ms" />
        <ToolCallRow name="list_safety_requirements" duration="1ms" />
        <ToolCallRow name="calculate_extinguisher_count" duration="1ms" />
      </div>

      {/* Footer stats */}
      <div className="grid grid-cols-3 gap-0 border-t border-rule">
        <Stat label="rounds" value="2" />
        <Stat label="tokens" value="1.8K" />
        <Stat label="latency" value="3.2s" last />
      </div>
    </div>
  );
}

function ToolCallRow({ name, duration }: { name: string; duration: string }) {
  return (
    <div
      className="flex items-center justify-between border border-rule bg-paper-2/30 px-2.5 py-1.5"
      dir="ltr"
    >
      <span className="font-mono text-[10px] font-bold text-ink">{name}()</span>
      <span className="font-mono text-[9px] text-muted">{duration}</span>
    </div>
  );
}

function Stat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`px-3 py-2.5 text-center ${last ? '' : 'border-e border-rule'}`}>
      <div className="font-display text-base font-extrabold tabular-nums leading-none text-ink">
        {value}
      </div>
      <div className="mt-1 font-mono text-[9px] uppercase tracking-widest text-muted">{label}</div>
    </div>
  );
}
