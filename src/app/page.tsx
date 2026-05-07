import Link from 'next/link';
import novaStats from '@/data/nova-tech-stats.json';

/** Convert Latin digits in a string to Arabic-Indic digits (٠١٢٣٤٥٦٧٨٩). */
function toArabicDigits(input: string): string {
  return input.replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[Number(d)]);
}

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40 paper-grain"
        aria-hidden
      />

      {/* ── Nav ──────────────────────────────────────────────── */}
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
          <a href="#scenarios" className="hover:text-ink">السيناريوهات</a>
          <Link href="/return" className="hover:text-ink">مشاريعي</Link>
        </nav>
      </header>
      <div className="mx-auto mt-6 max-w-6xl px-6 md:px-10">
        <div className="rule animate-rule-draw" />
      </div>

      {/* ── 1. HERO SECTION ──────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
        <div className="grid items-center gap-12 md:grid-cols-12">
          <div className="md:col-span-7">
            {/* Hero headline */}
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tighter text-ink md:text-6xl lg:text-7xl">
              <span className="block animate-fade-rise">أسّس شركتك بثقة،</span>
              <span
                className="block animate-fade-rise text-accent"
                style={{ animationDelay: '160ms' }}
              >
                وامتثل بذكاء
              </span>
            </h1>

            {/* Subheadline */}
            <div
              className="mt-8 max-w-xl animate-fade-rise"
              style={{ animationDelay: '320ms' }}
            >
              <div className="rule-accent mb-5 w-16" />
              <p className="text-lg leading-relaxed text-ink-2 md:text-xl">
                مستشار AI يرتّب لك ١١ جهة حكومية بالتسلسل الصحيح، ويفحص امتثالك لـ
                {' '}
                <span className="font-bold">PDPL</span>
                {' '}
                و
                {' '}
                <span className="font-bold">NCA</span>
                {' '}
                في ثوانٍ
              </p>
            </div>

            {/* CTA Buttons */}
            <div
              className="mt-10 flex flex-col gap-3 animate-fade-rise sm:flex-row sm:gap-4"
              style={{ animationDelay: '480ms' }}
            >
              <Link href="/chat" className="btn-ink text-base">
                أفتح شركة جديدة
                <ArrowLeft />
              </Link>
              <Link href="/chat?mode=compliance" className="btn-outline text-base">
                أفحص امتثال شركتي
                <ArrowLeft />
              </Link>
            </div>

            {/* Social proof */}
            <p
              className="mt-6 text-xs text-muted animate-fade-rise"
              style={{ animationDelay: '600ms' }}
            >
              <span className="font-mono font-bold text-ink">١٩</span> وكيل AI · يفهم العربي الخليجي · مجاني للتجربة
            </p>
          </div>

          {/* Hero visual indicator */}
          <aside className="relative md:col-span-5 animate-fade-rise" style={{ animationDelay: '700ms' }}>
            <div className="relative rounded-lg border border-rule bg-gradient-to-b from-white to-paper-2 p-8 md:p-10">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-accent animate-pulse" />
                  <span className="text-sm text-ink-2">تحليل فوري</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-3/4 rounded bg-rule" />
                  <div className="h-2 w-1/2 rounded bg-rule" />
                </div>
                <div className="mt-6 flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-accent/50" />
                  <span className="text-sm text-ink-2">١١ جهة حكومية</span>
                </div>
                <div className="space-y-2">
                  <div className="h-2 w-full rounded bg-rule" />
                  <div className="h-2 w-4/5 rounded bg-rule" />
                </div>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-muted">
              الوكلاء يعملون بالتوازي — تسلسل ذكي لأولويات جهاتك
            </p>
          </aside>
        </div>
      </section>

      {/* ── 2. PROBLEM SECTION ────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            الفرق واضح
          </h2>
        </div>
        <div className="rule mb-12" />

        <div className="grid gap-8 md:grid-cols-2">
          {/* Without DARAA */}
          <div className="rounded-lg border border-rule bg-white p-8 md:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-paper-2 px-4 py-2">
              <span aria-hidden className="text-lg">✗</span>
              <span className="text-sm font-bold text-ink-2">بدون درع</span>
            </div>
            <h3 className="font-display text-2xl font-extrabold text-ink">المشاكل</h3>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-warn" aria-hidden>⚠</span>
                <span className="text-sm text-ink-2">جهات حكومية كثيرة ومُربكة</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-warn" aria-hidden>⚠</span>
                <span className="text-sm text-ink-2">ترتيب خاطئ يؤدي لرفض الطلب</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-warn" aria-hidden>⚠</span>
                <span className="text-sm text-ink-2">وثائق مرفوضة وطلبات متكررة</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-warn" aria-hidden>⚠</span>
                <span className="text-sm text-ink-2">غرامات غير متوقعة</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-warn" aria-hidden>⚠</span>
                <span className="text-sm text-ink-2">شهور من التأخير والتعقيد</span>
              </li>
            </ul>
          </div>

          {/* With DARAA */}
          <div className="rounded-lg border border-accent bg-gradient-to-b from-white to-paper-2/50 p-8 md:p-10">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-4 py-2">
              <span aria-hidden className="text-lg">✓</span>
              <span className="text-sm font-bold text-accent">مع درع</span>
            </div>
            <h3 className="font-display text-2xl font-extrabold text-ink">الحلول</h3>
            <ul className="mt-6 space-y-4">
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-accent" aria-hidden>✓</span>
                <span className="text-sm text-ink-2">تسلسل صحيح مخصص لنشاطك</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-accent" aria-hidden>✓</span>
                <span className="text-sm text-ink-2">وثائق جاهزة بالكامل</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-accent" aria-hidden>✓</span>
                <span className="text-sm text-ink-2">تحذيرات مسبقة من الغرامات</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-accent" aria-hidden>✓</span>
                <span className="text-sm text-ink-2">خريطة طريق كاملة</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 text-lg text-accent" aria-hidden>✓</span>
                <span className="text-sm text-ink-2">أيام بدلاً من أشهر</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ── 3. HOW IT WORKS ──────────────────────────────────── */}
      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            كيف يشتغل
          </h2>
        </div>
        <div className="rule mb-12" />

        <ol className="grid gap-10 md:grid-cols-3">
          <Step
            num="١"
            icon="💬"
            title="تكلّم بالعربي"
            body="قل ودي أفتح كوفي بجدة — Claude يفهم قصدك ويسألك بس اللي يحتاجه."
          />
          <Step
            num="٢"
            icon="⚙️"
            title="الوكلاء يشتغلون"
            body="١٩ وكيل متخصص يحلل وضعك بالتوازي — تشوف الحوار بينهم مباشرة."
          />
          <Step
            num="٣"
            icon="📋"
            title="خارطة طريق جاهزة"
            body="تسلسل · تكاليف · وثائق · تحذيرات — كل شي في مكان واحد."
          />
        </ol>
      </section>

      {/* ── 4. DEMO SCENARIOS ─────────────────────────────────── */}
      <section id="scenarios" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="mb-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            جرّب السيناريوهات الجاهزة
          </h2>
        </div>
        <div className="rule mb-12" />

        <div className="grid gap-8 md:grid-cols-2">
          {/* Kafe Rafeh */}
          <Link
            href="/project/demo-kafe-rafeh-op"
            className="group rounded-lg border border-rule bg-white p-8 transition-all hover:border-accent hover:shadow-lg md:p-10"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 px-3 py-1">
              <span className="text-xs font-bold text-accent">تطبيقي</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-extrabold text-ink">
                  مقهى رافعة
                </h3>
                <p className="mt-2 text-sm text-ink-2">
                  وضع تشغيلي فعلي — رخص قريبة من الانتهاء
                </p>
              </div>
              <div className="text-3xl">☕</div>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-accent transition-all group-hover:gap-3">
              <span className="text-sm font-bold">شاهد الديمو</span>
              <ArrowLeft />
            </div>
          </Link>

          {/* Nova Tech */}
          <Link
            href="/project/demo-nova-tech-dig"
            className="group rounded-lg border border-rule bg-white p-8 transition-all hover:border-accent hover:shadow-lg md:p-10"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-warn/10 px-3 py-1">
              <span className="text-xs font-bold text-warn">امتثال رقمي</span>
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-2xl font-extrabold text-ink">
                  Nova Tech
                </h3>
                <p className="mt-2 text-sm text-ink-2">
                  تحليل امتثال شامل — نسبة {toArabicDigits(String(novaStats.complianceScore))}٪
                </p>
              </div>
              <div className="text-3xl">💻</div>
            </div>
            <div className="mt-6 inline-flex items-center gap-2 text-accent transition-all group-hover:gap-3">
              <span className="text-sm font-bold">شاهد الديمو</span>
              <ArrowLeft />
            </div>
          </Link>
        </div>
      </section>

      {/* ── 5. STATS BAR ──────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-0 border-y-2 border-ink sm:grid-cols-2 lg:grid-cols-4">
          <StatBar number="١٩" label="وكيل AI متخصص" />
          <StatBar number="١٤" label="قاعدة PDPL" />
          <StatBar number="١١" label="جهة حكومية" />
          <StatBar number="٤" label="وثائق قانونية" />
        </div>
      </section>

      {/* ── 6. FOOTER ──────────────────────────────────────── */}
      <footer className="relative border-t border-rule bg-paper-2/60">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-muted md:flex-row md:items-center md:px-10">
          <div>
            <span className="font-display text-sm font-bold text-ink">درع</span>
            <span className="mx-2">·</span>
            مستشار التأسيس والامتثال السعودي
          </div>
          <div className="max-w-md text-[11px] leading-relaxed">
            أداة استرشادية — لا تغني عن الاستشارة القانونية أو مراجعة الجهات
            الرسمية قبل اتخاذ قرار ملزم.
          </div>
        </div>
      </footer>
    </main>
  );
}

/* ─────────────────────────────────────────────────────────── */

function DaraaMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden className="text-accent">
      <path
        d="M17 3 L29 9 L29 19 Q29 27 17 31 Q5 27 5 19 L5 9 Z"
        fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"
      />
      <path
        d="M11 17 L15 21 L23 13"
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        d="M10 4 L4 8 L10 12"
        fill="none" stroke="currentColor" strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  );
}

function Step({
  num,
  icon,
  title,
  body,
}: {
  num: string;
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <li className="relative">
      <div className="flex items-baseline gap-3">
        <div className="flex items-center gap-2">
          <span className="font-display text-5xl font-extrabold leading-none text-accent md:text-6xl">
            {num}
          </span>
          <span className="text-3xl" aria-hidden>{icon}</span>
        </div>
        <h3 className="font-display text-xl font-extrabold tracking-tight">{title}</h3>
      </div>
      <p className="mt-4 border-t border-rule pt-4 text-sm leading-relaxed text-ink-2">
        {body}
      </p>
    </li>
  );
}

function StatBar({
  number,
  label,
}: {
  number: string;
  label: string;
}) {
  return (
    <div className="px-6 py-8 md:px-8 md:py-10 border-b border-rule sm:border-b-0 sm:border-s sm:border-rule last:border-b-0 last:border-s-0">
      <div className="font-display text-3xl font-extrabold leading-none tracking-tighter md:text-4xl text-ink">
        {number}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{label}</p>
    </div>
  );
}
