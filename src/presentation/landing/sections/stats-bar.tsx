import { StatBar } from '../primitives/stat-bar';

export function StatsBarSection() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
      <div className="grid gap-0 border-y-2 border-ink sm:grid-cols-2 lg:grid-cols-4">
        <StatBar number="١٩" label="وكيل AI متخصص" />
        <StatBar number="١٤" label="قاعدة PDPL" />
        <StatBar number="١١" label="جهة حكومية" />
        <StatBar number="٤" label="وثائق قانونية" />
      </div>
    </section>
  );
}
