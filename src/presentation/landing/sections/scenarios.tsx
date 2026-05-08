import Link from 'next/link';
import novaStats from '@/data/nova-tech-stats.json';
import { ArrowLeft } from '../primitives/arrow-left';
import { toArabicDigits } from '../primitives/arabic-digits';

function novaScoreLabel(): string {
  const score = (novaStats as Record<string, unknown>)?.complianceScore ?? 32;
  return toArabicDigits(String(score));
}

export function Scenarios() {
  return (
    <section id="scenarios" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
      <div className="mb-12">
        <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          جرّب السيناريوهات الجاهزة
        </h2>
      </div>
      <div className="rule mb-12" />

      <div className="grid gap-8 md:grid-cols-2">
        <Link
          href="/project/demo-kafe-rafeh-op"
          className="group rounded-lg border border-rule bg-white p-8 transition-all hover:border-accent hover:shadow-lg md:p-10"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1">
            <span className="text-xs font-bold text-accent">تطبيقي</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-extrabold text-ink">مقهى رافعة</h3>
              <p className="mt-2 text-sm text-ink-2">وضع تشغيلي فعلي — رخص قريبة من الانتهاء</p>
            </div>
            <div className="text-3xl">☕</div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-accent transition-all group-hover:gap-3">
            <span className="text-sm font-bold">شاهد الديمو</span>
            <ArrowLeft />
          </div>
        </Link>

        <Link
          href="/project/demo-nova-tech-dig"
          className="group rounded-lg border border-rule bg-white p-8 transition-all hover:border-accent hover:shadow-lg md:p-10"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-warn/10 px-3 py-1">
            <span className="text-xs font-bold text-warn">امتثال رقمي</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-display text-2xl font-extrabold text-ink">Nova Tech</h3>
              <p className="mt-2 text-sm text-ink-2">
                تحليل امتثال شامل — نسبة {novaScoreLabel()}٪
              </p>
            </div>
            <div className="text-3xl">💻</div>
          </div>
          <div className="mt-6 inline-flex items-center gap-2 text-accent transition-all group-hover:gap-3">
            <span className="text-sm font-bold">شاهد الديمو</span>
            <ArrowLeft />
          </div>
        </Link>
      </div>
    </section>
  );
}
