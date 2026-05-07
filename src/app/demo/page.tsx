import Link from 'next/link';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'درع — سيناريوهات تجريبية',
};

/**
 * /demo — a stage for the hackathon walkthrough. Two scenarios pre-seeded
 * via `npm run seed-demo` render here with the dashboard links the
 * presenter clicks. Designed for a judge to see the drama without waiting
 * for a full pipeline run.
 */

const SCENARIOS = [
  {
    id: 'demo-kafe-rafeh-op',
    title: 'كوفي رافعه',
    subtitle: 'مطعم / كوفي شوب — جدة',
    pitch:
      'صاحب كوفي شوب فتح محله قبل ١١ شهر. اليوم — شهاداته التشغيلية ' +
      'على وشك الانتهاء. درع يكشف له الترتيب الصحيح للتجديد قبل يدخل في المخالفات.',
    stats: [
      { value: '٠٪', label: 'صحة الرخص', tone: 'danger' as const },
      { value: '٠٥', label: 'تجديد قادم', tone: 'warn' as const },
      { value: '١٠', label: 'يوم حتى SFDA', tone: 'danger' as const },
    ],
    headline: 'مرحلة التشغيل — التنبيهات الحيّة',
    variant: 'operational' as const,
  },
  {
    id: 'demo-nova-tech-dig',
    title: 'Nova Tech',
    subtitle: 'شركة تقنية SaaS — ١٠٠ ألف+ مستخدم',
    pitch:
      'SaaS سعودية فيها فجوات PDPL حرجة: سياسة خصوصية إنجليزية فقط، ' +
      'فورم يجمع بيانات بدون موافقة، و DPO غير معيّن رغم تجاوز العتبة النظامية.',
    stats: [
      { value: '٣٢٪', label: 'نسبة الامتثال', tone: 'danger' as const },
      { value: '٠٦', label: 'فجوات مكتشفة', tone: 'warn' as const },
      { value: '٢م.', label: 'سقف الغرامات', tone: 'danger' as const },
    ],
    headline: 'الامتثال الرقمي — الفجوات والغرامات',
    variant: 'digital' as const,
  },
];

export default async function DemoShowcasePage() {
  // Best-effort status check — if a scenario isn't seeded yet we surface
  // a helpful note rather than a 404-on-click.
  const repos = getRepositories();
  const scenarios = await Promise.all(
    SCENARIOS.map(async (s) => ({
      ...s,
      seeded: Boolean(await repos.projects.findById(s.id)),
    })),
  );

  return (
    <main className="relative min-h-screen">
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 md:px-10">
        <Link href="/" className="group flex items-center gap-2.5">
          <svg width="22" height="22" viewBox="0 0 34 34" aria-hidden className="text-accent">
            <path
              d="M17 3 L29 9 L29 19 Q29 27 17 31 Q5 27 5 19 L5 9 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M11 17 L15 21 L23 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-lg font-extrabold tracking-tight group-hover:text-accent">
            درع
          </span>
        </Link>
        <nav className="flex gap-5 text-sm text-ink-2">
          <Link href="/chat" className="hover:text-ink">
            ابدأ محادثتك
          </Link>
          <Link href="/return" className="hover:text-ink">
            مشاريعي
          </Link>
        </nav>
      </header>

      <section className="mx-auto mt-12 max-w-4xl px-6 md:mt-20 md:px-10">
        <span className="eyebrow">عرض توضيحي</span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          سيناريوهات حيّة — اضغط وشف الداشبورد
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2 md:text-lg">
          كل سيناريو مشروع حقيقي دخلناه مسبقاً في النظام — الأرقام والتنبيهات من محركّ التحليل
          الفعلي، مو screenshots. اضغط أي بطاقة تدخل على الداشبورد الكامل.
        </p>
        <div className="rule-accent my-8 w-16" />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <div className="grid gap-8 md:grid-cols-2">
          {scenarios.map((s) => (
            <ScenarioCard key={s.id} s={s} />
          ))}
        </div>

        <div className="mt-12 border-t border-rule pt-8 text-sm text-ink-2">
          <p className="max-w-3xl">
            <span className="font-display font-extrabold text-ink">أو جرّب بنفسك من الصفر:</span>{' '}
            ابدأ محادثة جديدة وشاهد الوكلاء يتواصلون في الخلفية.
          </p>
          <Link href="/chat" className="btn-ink mt-5 inline-flex text-sm">
            ابدأ محادثة جديدة
            <span aria-hidden className="ms-2">
              ←
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}

function ScenarioCard({ s }: { s: (typeof SCENARIOS)[number] & { seeded: boolean } }) {
  const tone = s.variant === 'operational' ? 'bg-warn-soft/50' : 'bg-accent-soft/50';
  return (
    <article className="group overflow-hidden border border-ink bg-white transition-shadow hover:shadow-lg">
      <div className={`px-6 py-5 ${tone} border-b border-rule`}>
        <div className="flex items-baseline justify-between gap-3">
          <div className="eyebrow !text-[10px]">{s.headline}</div>
          {!s.seeded && (
            <span className="font-mono text-[10px] text-danger">
              (غير مُحمّل — شغّل npm run seed-demo)
            </span>
          )}
        </div>
        <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink md:text-3xl">
          {s.title}
        </h2>
        <p className="mt-1 text-sm text-ink-2">{s.subtitle}</p>
      </div>

      <div className="px-6 py-5">
        <p className="text-sm leading-relaxed text-ink-2">{s.pitch}</p>

        <div className="mt-5 grid grid-cols-3 gap-0 border border-rule">
          {s.stats.map((st, i) => (
            <div
              key={i}
              className={`px-3 py-3 text-center ${i < s.stats.length - 1 ? 'border-e border-rule' : ''}`}
            >
              <div
                className={`font-display text-2xl font-extrabold tabular-nums leading-none tracking-tighter md:text-3xl ${
                  st.tone === 'danger'
                    ? 'text-danger'
                    : st.tone === 'warn'
                      ? 'text-warn-strong'
                      : 'text-ink'
                }`}
              >
                {st.value}
              </div>
              <div className="mt-1.5 text-[11px] text-ink-2">{st.label}</div>
            </div>
          ))}
        </div>

        {s.seeded ? (
          <Link href={`/project/${s.id}`} className="btn-ink mt-6 w-full justify-between text-sm">
            <span>افتح الداشبورد الكاملة</span>
            <span aria-hidden>←</span>
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="btn-ink mt-6 w-full cursor-not-allowed justify-between text-sm opacity-40"
          >
            <span>غير مُحمّل</span>
            <span aria-hidden>—</span>
          </button>
        )}
      </div>
    </article>
  );
}
