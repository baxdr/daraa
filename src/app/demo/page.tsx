import Link from 'next/link';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';

export const dynamic = 'force-dynamic';
export const metadata = {
  title: 'درع — سيناريوهات تجريبية',
};

const SCENARIOS = [
  {
    id: 'demo-kafe-rafeh-op',
    title: 'كوفي رافعه',
    subtitle: 'كوفي شوب — جدة',
    pitch:
      'كوفي شغّال من سنة. كل رخصه قاربت تنتهي في نفس الفترة — درع يرتّب الأولويات + يبعث تذكير لكل تجديد.',
    stats: [
      { value: '٧٥٪', label: 'صحة الرخص', tone: 'warn' as const },
      { value: '٠٤', label: 'تجديد قادم', tone: 'warn' as const },
      { value: '١٠', label: 'يوم حتى SFDA', tone: 'warn' as const },
    ],
  },
  {
    id: 'demo-tamra-grocery',
    title: 'بقالة تمرة',
    subtitle: 'بقالة / سوبر ماركت — جدة',
    pitch:
      'بقالة تأخر صاحبها في التجديدات — ٤ رخص متأخرة + مخالفات بنية تحتية. مثال على القيمة اللي توفرها التذكيرات الآلية.',
    stats: [
      { value: '٢٠٪', label: 'صحة الرخص', tone: 'danger' as const },
      { value: '٠٤', label: 'متأخر', tone: 'danger' as const },
      { value: '١', label: 'طفاية فقط', tone: 'danger' as const },
    ],
  },
  {
    id: 'demo-bayan-laundry',
    title: 'مغسلة بيان',
    subtitle: 'مغسلة ملابس — الرياض',
    pitch:
      'مغسلة منتظمة بالتجديدات لكن لوحتها الإعلانية غير معتمدة. درع يكشف هذا قبل ما تصير مخالفة بلدية.',
    stats: [
      { value: '٨٠٪', label: 'صحة الرخص', tone: 'ok' as const },
      { value: '٠٢', label: 'تنبيه', tone: 'warn' as const },
      { value: '١', label: 'لوحة غير معتمدة', tone: 'warn' as const },
    ],
  },
];

export default async function DemoShowcasePage() {
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
          ٣ محلات حقيقية — شف ايجنتاتنا اشتغلوا عليها
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2 md:text-lg">
          كل سيناريو دخل الـ pipeline الحقيقي: ١٠ ايجنتات ذكاء اصطناعي، استدعاءات أدوات، رسائل A2A،
          traces محفوظة. اضغط أي بطاقة وشف الداشبورد + قسم «شفافية الذكاء الاصطناعي».
        </p>
        <div className="rule-accent my-8 w-16" />
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24 md:px-10">
        <div className="grid gap-8 md:grid-cols-3">
          {scenarios.map((s) => (
            <ScenarioCard key={s.id} s={s} />
          ))}
        </div>

        <div className="mt-12 border-t border-rule pt-8 text-sm text-ink-2">
          <p className="max-w-3xl">
            <span className="font-display font-extrabold text-ink">أو جرّب بنفسك من الصفر:</span>{' '}
            ابدأ محادثة جديدة وشاهد الوكلاء يفحصون رخص محلك.
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
  return (
    <article className="group overflow-hidden border border-ink bg-white transition-shadow hover:shadow-lg">
      <div className="border-b border-rule bg-paper-2/40 px-6 py-5">
        <div className="flex items-baseline justify-between gap-3">
          <div className="eyebrow !text-[10px]">حالة المحل</div>
          {!s.seeded && <span className="font-mono text-[10px] text-danger">(غير مُحمّل)</span>}
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
                      : st.tone === 'ok'
                        ? 'text-accent-strong'
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
          <>
            <Link href={`/project/${s.id}`} className="btn-ink mt-6 w-full justify-between text-sm">
              <span>افتح الداشبورد الكاملة</span>
              <span aria-hidden>←</span>
            </Link>
            <Link
              href={`/project/${s.id}#agent-traces`}
              className="mt-2 flex w-full items-center justify-between border border-rule bg-white px-4 py-2.5 font-mono text-[11px] text-ink-2 hover:border-accent hover:text-accent"
              dir="ltr"
            >
              <span>↓ jump to agent traces</span>
              <span aria-hidden>↗</span>
            </Link>
          </>
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
