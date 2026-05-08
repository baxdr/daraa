import Link from 'next/link';
import { AgentCard } from './agent-card';
import { AGENTS_CATALOG, AGENT_LAYER_LABEL } from './data';

export function AgentsCatalogPage() {
  const coordination = AGENTS_CATALOG.filter((a) => a.layer === 'coordination');
  const specialists = AGENTS_CATALOG.filter((a) => a.layer === 'specialist');

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
      <nav aria-label="مسار التنقّل" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          درع
        </Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">دليل الوكلاء</span>
      </nav>

      <header className="mb-10">
        <span className="eyebrow">دليل الوكلاء · Agentic Layer</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.1] tracking-tighter md:text-6xl">
          {AGENTS_CATALOG.length} وكيل ذكاء اصطناعي
          <br />
          <span className="text-accent">يشتغلون بالتوازي</span>
        </h1>
        <div className="rule-accent mt-6 w-16" />
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          درع مبني على نظام متعدد الوكلاء مُلهَم من Anthropic Agent SDK — كل وكيل متخصّص في جهة أو
          مهمة، يتواصلون عبر بروتوكول A2A، ويُسلّمون نتائجهم لـ{' '}
          <span className="font-bold">المنسّق</span> الذي يبني التقرير النهائي.
        </p>
      </header>

      <section className="mb-16 grid grid-cols-1 gap-0 border border-rule bg-white sm:grid-cols-3">
        <Stat label="وكيل تنسيق" value={coordination.length.toString()} />
        <Stat label="وكيل متخصّص" value={specialists.length.toString()} />
        <Stat
          label="جهة حكومية مغطّاة"
          value={specialists.filter((a) => a.group !== 'tax').length.toString()}
          last
        />
      </section>

      <section className="mb-16">
        <SectionHeader
          eyebrow="الطبقة الأولى"
          title={AGENT_LAYER_LABEL.coordination}
          desc="يديرون دورة حياة المشروع: من المحادثة الأولى للتقرير النهائي."
          count={coordination.length}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {coordination.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={i} />
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionHeader
          eyebrow="الطبقة الثانية"
          title={AGENT_LAYER_LABEL.specialist}
          desc="كل وكيل خبير في جهة حكومية أو نظام تنظيمي محدَّد."
          count={specialists.length}
        />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {specialists.map((agent, i) => (
            <AgentCard key={agent.id} agent={agent} index={coordination.length + i} />
          ))}
        </div>
      </section>

      <section className="mb-12 border-s-2 border-ink bg-paper-2 px-6 py-7">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">جرّبهم وهم يشتغلون</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
          ابدأ مشروعاً جديداً وراح تشوف كل الوكلاء يطلعون على timeline مباشر — رسائل بينهم، أنشطة،
          نتائج فحص.
        </p>
        <Link href="/chat" className="btn-ink mt-6 inline-flex text-sm">
          ابدأ ديمو حيّ
          <span aria-hidden className="ms-2">
            ←
          </span>
        </Link>
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
  count,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  count: number;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="eyebrow">{eyebrow}</span>
        <span className="font-mono text-xs tabular-nums text-muted">
          {String(count).padStart(2, '0')} وكيل
        </span>
      </div>
      <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-2">{desc}</p>
      <div className="rule mt-6" />
    </div>
  );
}

function Stat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`px-5 py-5 md:px-6 md:py-6 ${
        last ? '' : 'border-b border-rule sm:border-b-0 sm:border-s'
      }`}
    >
      <div className="font-display text-4xl font-extrabold tabular-nums leading-none tracking-tighter text-ink md:text-5xl">
        {value}
      </div>
      <div className="mt-2 text-xs text-ink-2">{label}</div>
    </div>
  );
}
