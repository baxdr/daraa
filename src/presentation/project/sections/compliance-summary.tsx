import { ScoreRing } from '@/presentation/components/score-ring';
import { NumberTicker } from '@/presentation/components/number-ticker';

interface ComplianceSummaryProps {
  complianceScore: number | undefined;
  totalFineCeilingSar: number | undefined;
}

function scoreSublabel(score: number): string {
  if (score >= 75) return 'وضعك جيد — في نقاط يمكن تحسينها.';
  if (score >= 50) return 'في مخاطر متوسطة. راجع الفجوات أدناه.';
  return 'في فجوات حرجة ينبغي معالجتها قبل أي تفتيش.';
}

export function ComplianceSummary({
  complianceScore,
  totalFineCeilingSar,
}: ComplianceSummaryProps) {
  const score = complianceScore ?? 0;
  const fine = totalFineCeilingSar ?? 0;

  return (
    <section className="mb-12 grid gap-10 md:grid-cols-2 md:gap-16">
      <div>
        <ScoreRing score={score} label="نسبة الامتثال" sublabel={scoreSublabel(score)} />
      </div>
      <div className="border-s-2 border-ink md:ps-8">
        <div className="eyebrow">الغرامة القصوى الممكنة</div>
        <div
          className="mt-3 font-display text-5xl font-extrabold tabular-nums leading-none tracking-tighter text-danger sm:text-6xl md:text-7xl"
          style={{ wordBreak: 'break-word' }}
        >
          <NumberTicker
            target={fine}
            ariaLabel={`الغرامة القصوى الممكنة: ${fine.toLocaleString('en-US')} ريال سعودي`}
          />
        </div>
        <div className="mt-2 font-display text-lg font-extrabold tracking-tight text-muted">
          ريال سعودي
        </div>
        <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-2">
          سقف نظامي — مجموع الحد الأقصى للغرامات على الفجوات المؤكدة. أغلبها يُتفادى بخطوات أدناه.
        </p>
      </div>
    </section>
  );
}
