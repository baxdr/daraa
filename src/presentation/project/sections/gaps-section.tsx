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
      <div className="rounded-md border border-accent/20 bg-accent-soft px-6 py-10 text-center">
        <div className="mb-3 text-4xl" aria-hidden>
          ✓
        </div>
        <h3 className="font-display text-2xl font-extrabold text-accent-strong">امتثال كامل</h3>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-ink-2">
          ما لقينا أي فجوات في الفحص الحالي. استمر في مراجعة التحديثات التنظيمية — سنُشعرك إذا صدرت
          متطلبات جديدة من الجهات.
        </p>
        <Link href="/chat" className="btn-outline mt-5 inline-flex text-sm">
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
