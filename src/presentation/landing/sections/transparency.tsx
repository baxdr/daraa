import Link from 'next/link';
import { ArrowLeft } from '../primitives/arrow-left';

/**
 * Landing transparency section — "no AI black box".
 *
 * Renders a labelled, mock trace card to communicate that every project
 * page exposes the actual Claude tool-use loop (rounds, tokens, latency,
 * fallback reasons). The card here is illustrative — the live one in
 * `src/presentation/project/sections/agent-traces.tsx` reads from
 * ProjectRecord.agentTraces.
 */
export function Transparency() {
  return (
    <section id="transparency" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
      <div className="rule mb-12" />
      <div className="grid items-start gap-12 md:grid-cols-12">
        <div className="md:col-span-5">
          <span className="eyebrow">شفافية كاملة</span>
          <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            ما عندنا <span className="text-accent">صندوق أسود</span>
          </h2>
          <div className="rule-accent mt-3 w-12" />
          <p className="mt-5 text-base leading-relaxed text-ink-2">
            كل تقرير مشروع يحتوي قسم «شفافية الذكاء الاصطناعي» — تشوف بالضبط:
          </p>
          <ul className="mt-5 space-y-3">
            <BulletPoint>
              كل أداة استدعاها الايجنت مع الـ{' '}
              <code className="font-mono text-[11px]" dir="ltr">
                input → output
              </code>
            </BulletPoint>
            <BulletPoint>عدد الجولات + tokens المستهلكة</BulletPoint>
            <BulletPoint>الـ latency بالملي‌ثانية لكل استدعاء</BulletPoint>
            <BulletPoint>متى استخدم المسار الـ deterministic ولماذا</BulletPoint>
            <BulletPoint>المخرج النهائي للايجنت — حرفياً</BulletPoint>
          </ul>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/project/demo-kafe-rafeh-op" className="btn-ink text-sm">
              شف Trace حقيقي
              <ArrowLeft />
            </Link>
          </div>
        </div>

        <div className="md:col-span-7">
          <FullTraceCardMock />
        </div>
      </div>
    </section>
  );
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3 text-sm text-ink-2">
      <span aria-hidden className="mt-1 inline-flex h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <span>{children}</span>
    </li>
  );
}

function FullTraceCardMock() {
  return (
    <div className="border border-rule bg-white shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-rule p-4 md:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-display text-base font-extrabold text-ink md:text-lg">
            متخصّص البلدية
          </span>
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted" dir="ltr">
            municipality
          </span>
          <span className="pill border border-accent/40 bg-accent-soft text-[10px] font-bold tracking-widest text-accent-strong">
            حيّ
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-muted" dir="ltr">
          <span className="font-mono tabular-nums">2 rounds</span>
          <span className="font-mono tabular-nums">3 tools</span>
          <span className="font-mono tabular-nums">2,134 tok</span>
          <span className="font-mono tabular-nums">2,847ms</span>
        </div>
      </div>

      {/* Round 1 */}
      <RoundBlock
        index={1}
        inTokens={892}
        outTokens={156}
        latency={1320}
        stop="tool_use"
        reasoning="أحتاج أعرف بيانات المحل أولاً، ثم تسمية الرخصة، ثم تقدير التكلفة."
        tools={[
          {
            name: 'get_shop_summary',
            input: '{}',
            output: '{ vertical: { id: "coffee", hasKitchen: true }, city: "الرياض" }',
          },
        ]}
      />

      {/* Round 2 */}
      <RoundBlock
        index={2}
        inTokens={812}
        outTokens={274}
        latency={1527}
        stop="end_turn"
        tools={[
          {
            name: 'get_balady_licence_label',
            input: '{ "vertical": "coffee" }',
            output: '{ "label": "رخصة بلدية (نشاط غذائي)" }',
          },
          {
            name: 'estimate_balady_cost',
            input: '{ "vertical": "coffee", "has_kitchen": true }',
            output: '{ "min": 1000, "max": 4500 }',
          },
        ]}
      />

      {/* Final text preview */}
      <div className="border-t border-rule bg-paper-2/40 p-4 md:p-5">
        <div className="eyebrow !text-[10px]">المخرج النهائي للايجنت</div>
        <pre
          className="mt-2 max-h-24 overflow-hidden whitespace-pre-wrap break-words font-mono text-[10px] leading-relaxed text-ink-2"
          dir="ltr"
        >
          {`{ "data": { "explainAr": "الرخصة اللي تسمح لك تفتح محلك...", "estimatedCostSar": { "min": 1000, "max": 4500 }, ... },
  "outbox": [{ "to": "sfda", ... }, { "to": "moh", ... }] }`}
        </pre>
      </div>
    </div>
  );
}

function RoundBlock({
  index,
  inTokens,
  outTokens,
  latency,
  stop,
  reasoning,
  tools,
}: {
  index: number;
  inTokens: number;
  outTokens: number;
  latency: number;
  stop: string;
  reasoning?: string;
  tools: Array<{ name: string; input: string; output: string }>;
}) {
  return (
    <div className="border-b border-rule p-4 last:border-b-0 md:p-5">
      <div className="mb-3 flex items-baseline justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted">
          Round {String(index).padStart(2, '0')}
        </span>
        <div className="flex gap-3 text-[10px] text-muted" dir="ltr">
          <span className="font-mono tabular-nums">in {inTokens}</span>
          <span className="font-mono tabular-nums">out {outTokens}</span>
          <span className="font-mono tabular-nums">{latency}ms</span>
          <span className="font-mono tabular-nums">stop: {stop}</span>
        </div>
      </div>

      {reasoning && (
        <div className="mb-3 border-s-2 border-ink/20 ps-3">
          <p className="text-[11px] leading-relaxed text-ink-2">{reasoning}</p>
        </div>
      )}

      <div className="space-y-2">
        {tools.map((t) => (
          <div key={t.name} className="border border-rule bg-paper-2/40 p-2.5">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="font-mono text-[11px] font-bold text-ink" dir="ltr">
                {t.name}()
              </span>
              <span className="font-mono text-[9px] text-muted" dir="ltr">
                ~1ms
              </span>
            </div>
            <pre
              className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-relaxed text-muted"
              dir="ltr"
            >
              → {t.input}
            </pre>
            <pre
              className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-[9px] leading-relaxed text-ink-2"
              dir="ltr"
            >
              ← {t.output}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
