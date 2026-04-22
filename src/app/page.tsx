import Link from 'next/link';

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* Subtle grain atmosphere — sparing. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40 paper-grain"
        aria-hidden
      />

      {/* Top editorial rule with wordmark — like a masthead. */}
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 md:px-10">
        <div className="flex items-center gap-3">
          <DaraaMark />
          <div className="leading-tight">
            <div className="font-display text-xl font-extrabold tracking-tight">درع</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">DARAA</div>
          </div>
        </div>
        <nav className="hidden gap-6 text-sm text-ink-2 md:flex">
          <a href="#how" className="hover:text-ink">كيف يشتغل</a>
          <a href="#tracks" className="hover:text-ink">المسارات</a>
          <a href="/demo/novatech/" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            موقع تجريبي <span aria-hidden>↗</span>
          </a>
        </nav>
      </header>
      <div className="mx-auto mt-6 max-w-6xl px-6 md:px-10">
        <div className="rule animate-rule-draw" />
      </div>

      {/* Hero — editorial layout: eyebrow → massive display headline → rule → lede → CTA. */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-8">
            <span className="eyebrow animate-fade-rise">عدد ٠١ · ربيع ٢٠٢٦</span>
            <h1
              className="mt-5 font-display text-5xl font-extrabold leading-[1.05] tracking-tighter text-ink md:text-7xl lg:text-[5.5rem]"
              style={{ animationDelay: '60ms' }}
            >
              <span className="block animate-fade-rise" style={{ animationDelay: '60ms' }}>
                من أول فكرة
              </span>
              <span className="block animate-fade-rise" style={{ animationDelay: '160ms' }}>
                لآخر <span className="relative inline-block">
                  <span className="relative z-10">تجديد</span>
                  <span
                    aria-hidden
                    className="absolute inset-x-0 bottom-1 h-4 -z-0 bg-accent/25 md:h-5"
                  />
                </span>.
              </span>
              <span
                className="block animate-fade-rise text-accent"
                style={{ animationDelay: '260ms' }}
              >
                مستشار واحد.
              </span>
            </h1>

            <div
              className="mt-8 max-w-xl animate-fade-rise"
              style={{ animationDelay: '380ms' }}
            >
              <div className="rule-accent mb-5 w-16" />
              <p className="text-lg leading-relaxed text-ink-2 md:text-xl">
                درع يرتّب لك الجهات الحكومية بالتسلسل الصحيح، يفحص موقعك ضد
                أنظمة حماية البيانات، ويُجهّز مستنداتك الرسمية — قبل ما تدخل في
                المخالفات.
              </p>
            </div>

            <div
              className="mt-10 flex flex-wrap items-center gap-4 animate-fade-rise"
              style={{ animationDelay: '520ms' }}
            >
              <Link href="/chat" className="btn-ink text-base">
                ابدأ الاستشارة المجانية
                <ArrowLeft />
              </Link>
              <a
                href="/demo/novatech/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-ink-2 underline decoration-rule decoration-2 underline-offset-4 hover:decoration-accent hover:text-ink"
              >
                أو شاهد الفحص على موقع تجريبي <span aria-hidden>↗</span>
              </a>
            </div>

            <p className="mt-4 text-xs text-muted" style={{ animationDelay: '600ms' }}>
              بدون تسجيل · بدون بطاقة ائتمان · النتائج خلال دقائق
            </p>
          </div>

          {/* Stat column — editorial numeric statements */}
          <aside
            className="relative md:col-span-4 animate-fade-rise"
            style={{ animationDelay: '700ms' }}
          >
            <div className="md:sticky md:top-10 md:pe-6 md:border-e md:border-rule">
              <StatBlock
                number="٩٠٪"
                label="من الشركات السعودية لا تعرف حالة التزامها بأنظمة حماية البيانات"
              />
              <div className="my-6 rule" />
              <StatBlock
                number="٥ مليون"
                label="ريال سقف الغرامة على مخالفة واحدة في PDPL"
                numberClass="text-warn"
              />
              <div className="my-6 rule" />
              <StatBlock
                number="٧-١٥"
                label="جهة حكومية يحتاجها صاحب المشروع السعودي — من التأسيس للتشغيل"
              />
            </div>
          </aside>
        </div>
      </section>

      {/* Tracks — two intertwined paths, editorial two-column. */}
      <section id="tracks" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            مساران، منصة واحدة
          </h2>
          <span className="text-xs text-muted md:text-sm">§ ٠١</span>
        </div>
        <div className="rule mb-10" />
        <div className="grid gap-8 md:grid-cols-2">
          <TrackCard
            index="أ"
            title="أبي أفتح مشروع جديد"
            summary="خريطة طريق مرتبة بالتسلسل الصحيح — الجهات المطلوبة، التكاليف التقديرية، والمستندات الجاهزة. من التفكير إلى أول عميل."
            bullets={[
              'السجل التجاري، الزكاة، الموارد البشرية، التأمينات',
              'تنبيهات بنقاط الخلط الشائعة (مثال: قبل ما توقّع عقد الإيجار)',
              'متوفر حالياً: مطاعم · شركات تقنية · متاجر إلكترونية',
            ]}
          />
          <TrackCard
            index="ب"
            title="عندي مشروع شغّال"
            summary="فحص موقعك الفعلي ضد PDPL وضوابط الأمن السيبراني. فجوات بلغة بسيطة، غرامات محتملة، ومستندات علاجية جاهزة للنشر."
            bullets={[
              'فحص حي لسياسة الخصوصية، رؤوس الأمان، وأدوات التتبع',
              'تقرير بلغة عربية بسيطة — بدون مصطلحات قانونية جافة',
              'توليد سياسة خصوصية مخصّصة، جاهزة للطباعة',
            ]}
          />
        </div>
      </section>

      {/* How it works — numbered editorial steps. */}
      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-20 md:px-10 md:pb-32">
        <div className="mb-10 flex items-baseline justify-between">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            كيف يشتغل
          </h2>
          <span className="text-xs text-muted md:text-sm">§ ٠٢</span>
        </div>
        <div className="rule mb-10" />
        <ol className="grid gap-10 md:grid-cols-3">
          <Step
            num="١"
            title="محادثة ذكية"
            body="٥ إلى ٨ أسئلة متسلسلة بالعربي السعودي. كل مصطلح مشروح بمثال من الحياة اليومية."
          />
          <Step
            num="٢"
            title="تحليل متعدد الوكلاء"
            body="أربعة وكلاء يشتغلون بالتوازي — فحص، أنظمة، تحليل، توليد — وتشوفهم يشتغلون مباشرة."
          />
          <Step
            num="٣"
            title="تقرير قابل للتنفيذ"
            body="فجوات بلغة بسيطة، سقف الغرامات، خطة إصلاح، ومستندات جاهزة للتحميل."
          />
        </ol>
      </section>

      {/* Footer — editorial small-type masthead. */}
      <footer className="relative border-t border-rule bg-paper-2/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-muted md:flex-row md:items-center md:px-10">
          <div>
            <span className="font-display text-sm font-bold text-ink">درع</span>
            <span className="mx-2">·</span>
            مستشار التأسيس والامتثال السعودي
          </div>
          <div className="max-w-md text-[11px] leading-relaxed">
            أداة استرشادية. المعلومات لا تغني عن الاستشارة القانونية أو مراجعة
            الجهات الرسمية قبل اتخاذ قرار ملزم.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ------------------------------------------------------------------------- */

function DaraaMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="text-accent">
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
  );
}

function ArrowLeft() {
  // Used inside RTL — visually points "forward" i.e. to the right-written next screen.
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M10 4 L4 8 L10 12"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StatBlock({
  number,
  label,
  numberClass,
}: {
  number: string;
  label: string;
  numberClass?: string;
}) {
  return (
    <div>
      <div
        className={`font-display text-5xl font-extrabold leading-none tracking-tighter md:text-6xl ${
          numberClass ?? 'text-ink'
        }`}
      >
        {number}
      </div>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{label}</p>
    </div>
  );
}

function TrackCard({
  index,
  title,
  summary,
  bullets,
}: {
  index: string;
  title: string;
  summary: string;
  bullets: string[];
}) {
  return (
    <article className="group relative">
      <div className="mb-5 flex items-baseline gap-4">
        <span className="font-display text-6xl font-extrabold leading-none text-paper-3 transition-colors group-hover:text-accent md:text-7xl">
          {index}
        </span>
        <h3 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          {title}
        </h3>
      </div>
      <p className="text-base leading-relaxed text-ink-2">{summary}</p>
      <ul className="mt-6 space-y-2 border-t border-rule pt-5 text-sm text-ink-2">
        {bullets.map((b, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <li className="relative">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-4xl font-extrabold text-accent md:text-5xl">
          {num}
        </span>
        <h3 className="font-display text-xl font-extrabold tracking-tight">{title}</h3>
      </div>
      <p className="mt-3 border-t border-rule pt-4 text-sm leading-relaxed text-ink-2">
        {body}
      </p>
    </li>
  );
}
