import Link from 'next/link';
import { ArrowLeft } from '../primitives/arrow-left';

interface ScenarioCardProps {
  href: string;
  badgeAr: string;
  titleAr: string;
  subtitleAr: string;
  iconSvg: React.ReactNode;
  badgeTone: 'accent' | 'warn' | 'danger';
}

function ScenarioCard({
  href,
  badgeAr,
  titleAr,
  subtitleAr,
  iconSvg,
  badgeTone,
}: ScenarioCardProps) {
  const toneClasses =
    badgeTone === 'accent'
      ? 'bg-accent/10 text-accent'
      : badgeTone === 'warn'
        ? 'bg-warn/10 text-warn-strong'
        : 'bg-danger/10 text-danger';
  return (
    <Link
      href={href}
      className="group rounded-lg border border-rule bg-white p-8 transition-all hover:border-accent hover:shadow-lg md:p-10"
    >
      <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-3 py-1 ${toneClasses}`}>
        <span className="text-xs font-bold">{badgeAr}</span>
      </div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl font-extrabold text-ink">{titleAr}</h3>
          <p className="mt-2 text-sm text-ink-2">{subtitleAr}</p>
        </div>
        <div className="text-accent">{iconSvg}</div>
      </div>
      <div className="mt-6 inline-flex items-center gap-2 text-accent transition-all group-hover:gap-3">
        <span className="text-sm font-bold">افتح الحالة</span>
        <ArrowLeft />
      </div>
    </Link>
  );
}

const CoffeeIcon = (
  <svg
    aria-hidden
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M6 14h20v8a6 6 0 0 1-6 6H12a6 6 0 0 1-6-6v-8z" />
    <path d="M26 16h2a4 4 0 0 1 0 8h-2" />
    <path d="M11 6c0 2 2 2 2 4M16 6c0 2 2 2 2 4M21 6c0 2 2 2 2 4" />
  </svg>
);

const GroceryIcon = (
  <svg
    aria-hidden
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5 8h4l3 16h17l3-12H10" />
    <circle cx="14" cy="29" r="2" />
    <circle cx="26" cy="29" r="2" />
  </svg>
);

const LaundryIcon = (
  <svg
    aria-hidden
    width="36"
    height="36"
    viewBox="0 0 36 36"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="6" y="6" width="24" height="24" rx="2" />
    <circle cx="18" cy="20" r="6" />
    <circle cx="11" cy="11" r="1" fill="currentColor" />
    <circle cx="15" cy="11" r="1" fill="currentColor" />
  </svg>
);

export function Scenarios() {
  return (
    <section id="scenarios" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
      <div className="mb-12">
        <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
          جرّب السيناريوهات الجاهزة
        </h2>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-ink-2">
          ٣ محلات حقيقية بأنواع مختلفة — كل واحد يعرض حالة رخص مختلفة (سارية، قاربت، متأخرة).
        </p>
      </div>
      <div className="rule mb-12" />

      <div className="grid gap-8 md:grid-cols-3">
        <ScenarioCard
          href="/project/demo-kafe-rafeh-op"
          badgeAr="كوفي شوب"
          titleAr="مقهى رافعة"
          subtitleAr="رخص قريبة من الانتهاء — تنبيهات نشطة"
          iconSvg={CoffeeIcon}
          badgeTone="warn"
        />
        <ScenarioCard
          href="/project/demo-tamra-grocery"
          badgeAr="بقالة"
          titleAr="بقالة تمرة"
          subtitleAr="ترخيص SFDA منتهي — يحتاج إجراء فوري"
          iconSvg={GroceryIcon}
          badgeTone="danger"
        />
        <ScenarioCard
          href="/project/demo-bayan-laundry"
          badgeAr="مغسلة"
          titleAr="مغسلة بيان"
          subtitleAr="رخصة بلدية تنتهي خلال أسبوع"
          iconSvg={LaundryIcon}
          badgeTone="accent"
        />
      </div>
    </section>
  );
}
