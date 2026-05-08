import { EntityCard } from '@/presentation/components/entity-card';
import type { CostSummary, RoadmapWeek } from '@/knowledge/entities';
import type { AgentMessage } from '@/agents/types';

interface RoadmapSectionProps {
  roadmap: RoadmapWeek[];
  messages: AgentMessage[];
  costSummary: CostSummary;
  isCompliance: boolean;
}

export function RoadmapSection({
  roadmap,
  messages,
  costSummary,
  isCompliance,
}: RoadmapSectionProps) {
  if (roadmap.length === 0) return null;

  return (
    <section className="mb-12">
      <RoadmapHeader
        roadmapLen={roadmap.length}
        costSummary={costSummary}
        isCompliance={isCompliance}
      />
      <div className="rule mb-8" />
      <div className="space-y-10">
        {roadmap.map((week, wi) => {
          let running = 0;
          for (let j = 0; j < wi; j++) running += roadmap[j]?.entities.length ?? 0;
          return (
            <RoadmapWeekBlock
              key={week.label}
              week={week}
              weekIndex={wi}
              startStep={running}
              messages={messages}
              isCompliance={isCompliance}
            />
          );
        })}
      </div>
    </section>
  );
}

function RoadmapHeader({
  roadmapLen,
  costSummary,
  isCompliance,
}: {
  roadmapLen: number;
  costSummary: CostSummary;
  isCompliance: boolean;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          {isCompliance ? 'الجهات المُطابَقة' : 'خريطة الطريق'}
        </h2>
        <div className="mt-2 flex items-center gap-3 text-xs text-ink-2">
          <span>{isCompliance ? 'بالترتيب الزمني' : 'بالترتيب الصحيح'}</span>
          {!isCompliance && (
            <>
              <span className="text-rule">·</span>
              <span className="font-semibold">
                إجمالي الرسوم:{' '}
                <span className="font-display text-ink">
                  {costSummary.minSar.toLocaleString('en-US')}–
                  {costSummary.maxSar.toLocaleString('en-US')}
                </span>{' '}
                ريال
              </span>
            </>
          )}
        </div>
      </div>
      <span className="font-mono text-xs tabular-nums text-muted">
        {roadmapLen.toString().padStart(2, '0')} مرحلة
      </span>
    </div>
  );
}

function weekTotalCostLabel(week: RoadmapWeek): string {
  const min = week.entities.reduce((sum, e) => sum + e.estimatedCostSar.min, 0);
  const max = week.entities.reduce((sum, e) => sum + e.estimatedCostSar.max, 0);
  if (max === 0) return 'مجاني';
  return `${min.toLocaleString('en-US')}–${max.toLocaleString('en-US')}`;
}

function RoadmapWeekBlock({
  week,
  weekIndex,
  startStep,
  messages,
  isCompliance,
}: {
  week: RoadmapWeek;
  weekIndex: number;
  startStep: number;
  messages: AgentMessage[];
  isCompliance: boolean;
}) {
  const costLabel = weekTotalCostLabel(week);
  return (
    <div>
      <div className="mb-4 flex items-baseline gap-4">
        <div className="flex items-center gap-3">
          <span className="font-display text-3xl font-extrabold tabular-nums leading-none text-ink md:text-4xl">
            {String(weekIndex + 1).padStart(2, '0')}
          </span>
          <div className="h-6 w-1 rounded-full bg-accent" aria-hidden />
        </div>
        <div className="flex-1">
          <div className="eyebrow">المرحلة</div>
          <div className="font-display text-lg font-extrabold tracking-tight">{week.label}</div>
          {!isCompliance && (
            <div className="mt-1 text-xs text-ink-2">
              <span className="font-semibold text-ink">{week.entities.length}</span>{' '}
              {week.entities.length === 1 ? 'جهة' : 'جهات'} ·
              <span className="mx-1">الرسوم: {costLabel} ريال</span>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {week.entities.map((entity, ei) => {
          const incoming = messages.filter((m) => m.to === entity.id || m.to === 'ALL');
          const outgoing = messages.filter((m) => m.from === entity.id);
          return (
            <EntityCard
              key={entity.id}
              entity={entity}
              step={startStep + ei + 1}
              incoming={incoming}
              outgoing={outgoing}
            />
          );
        })}
      </div>
    </div>
  );
}
