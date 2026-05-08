import Link from 'next/link';
import { GapCard } from '@/presentation/components/gap-card';
import type { Gap } from '@/agents/analysis-agent';
import type { AnalysisReport } from '@/agents/analysis-agent';

interface GapsSectionProps {
  scanId: string;
  gaps: Gap[] | undefined;
  analysis: AnalysisReport | undefined;
}

export function GapsSection({ scanId, gaps, analysis }: GapsSectionProps) {
  if (!analysis) return null;
  const total = analysis.applicableRuleCount.toString().padStart(2, '0');

  if (gaps && gaps.length > 0) {
    return (
      <section className="mb-12">
        <SectionHeader count={gaps.length.toString().padStart(2, '0')} total={total} />
        <div className="rule mb-6" />
        <div className="space-y-4">
          {gaps.map((gap, i) => (
            <GapCard key={gap.id} gap={gap} scanId={scanId} index={i} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <SectionHeader count="00" total={total} />
      <div className="rule mb-6" />
      <div className="relative overflow-hidden border-s-2 border-accent bg-accent-soft px-8 py-12 text-center">
        <svg
          aria-hidden
          className="mx-auto mb-5 h-14 w-14 animate-fade-rise text-accent"
          viewBox="0 0 56 56"
          fill="none"
        >
          <path
            d="M28 4 L48 14 L48 30 Q48 42 28 52 Q8 42 8 30 L8 14 Z"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M18 28 L25 35 L38 22"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <h3 className="font-display text-3xl font-extrabold tracking-tight text-accent-strong md:text-4xl">
          امتثال كامل
        </h3>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-2">
          ما لقينا أي فجوات في الفحص الحالي. استمر في مراجعة التحديثات التنظيمية — سنُشعرك إذا صدرت
          متطلبات جديدة من الجهات.
        </p>
        <Link href="/chat" className="btn-outline mt-6 inline-flex text-sm">
          أعد الفحص
          <span aria-hidden className="ms-2">
            ←
          </span>
        </Link>
      </div>
    </section>
  );
}

function SectionHeader({ count, total }: { count: string; total: string }) {
  return (
    <div className="mb-6 flex items-baseline justify-between">
      <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
        الفجوات المكتشفة
      </h2>
      <span className="font-mono text-xs tabular-nums text-muted">
        {count} / {total}
      </span>
    </div>
  );
}
