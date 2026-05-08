import { StatBar } from '../primitives/stat-bar';

export function StatsBarSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
      <div className="grid gap-0 border-y-2 border-ink sm:grid-cols-2 lg:grid-cols-4">
        <StatBar number="١٠" label="ايجنتات Claude AI" />
        <StatBar number="٥" label="فئات محلات" />
        <StatBar number="١٦" label="فحص لكل محل" />
        <StatBar number="∞" label="تذكيرات تجديد" />
      </div>
    </section>
  );
}
