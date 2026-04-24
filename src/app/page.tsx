import Link from 'next/link';
import { HeroAgentsMockup } from '@/components/landing/hero-agents-mockup';
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
          <a href="#agents" className="hover:text-ink">الوكلاء</a>
          <Link href="/return" className="hover:text-ink">مشاريعي</Link>
          <a href="/demo/novatech/" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
            موقع تجريبي <span aria-hidden>↗</span>
          </a>
        </nav>
      </header>
      <div className="mx-auto mt-6 max-w-6xl px-6 md:px-10">
        <div className="rule animate-rule-draw" />
      </div>

      {/* ── 1. Hero ──────────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-14 pt-14 md:px-10 md:pb-20 md:pt-20">
        <div className="grid items-center gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-7">
            <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tighter text-ink md:text-7xl lg:text-[5.25rem]">
              <span className="block animate-fade-rise">قول لنا وش مشروعك</span>
              <span
                className="block animate-fade-rise text-accent"
                style={{ animationDelay: '160ms' }}
              >
                ونتكفّل بالباقي.
              </span>
            </h1>

            <div
              className="mt-7 max-w-xl animate-fade-rise"
              style={{ animationDelay: '320ms' }}
            >
              <div className="rule-accent mb-5 w-16" />
              <p className="text-lg leading-relaxed text-ink-2 md:text-xl">
                من التأسيس للامتثال — مستشار ذكي يعرف كل جهة حكومية
                بالسعودية ويجهّز لك كل شي.
              </p>
            </div>

            <div
              className="mt-9 flex items-center gap-4 animate-fade-rise"
              style={{ animationDelay: '480ms' }}
            >
              <Link href="/chat" className="btn-ink text-base">
                ابدأ الاستشارة المجانية
                <ArrowLeft />
              </Link>
            </div>

            <p
              className="mt-4 text-xs text-muted animate-fade-rise"
              style={{ animationDelay: '600ms' }}
            >
              بدون تسجيل · بدون بطاقة ائتمان · النتائج خلال دقائق
            </p>
          </div>

          {/* Live mockup */}
          <aside
            className="relative md:col-span-5 animate-fade-rise"
            style={{ animationDelay: '700ms' }}
          >
            <HeroAgentsMockup />
            <p className="mt-3 text-[11px] text-muted">
              عرض توضيحي — الوكلاء في الإنتاج يشتغلون بنفس الترتيب
            </p>
          </aside>
        </div>
      </section>

      {/* ── 2. Agents grid — replaces "مساران، منصة واحدة" ──── */}
      <section id="agents" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="mb-10">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            كل جهة حكومية — وكيل متخصص
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2 md:text-base">
            بدل ما تتنقل بين ٧ منصات حكومية، درع يشغّل وكيل لكل جهة. كل
            وكيل يعرف متطلبات جهته، يتواصل مع الباقين، ويسلّمك النتيجة.
          </p>
        </div>
        <div className="rule mb-8" />

        <div className="grid gap-0 overflow-hidden border border-rule sm:grid-cols-2 lg:grid-cols-4">
          <AgentTile
            name="التجارة"
            deliverable="سجل تجاري"
            detail="نوع الكيان المناسب + اسم تجاري + عقد تأسيس"
            letter="ت"
          />
          <AgentTile
            name="البلدية"
            deliverable="رخصة بلدية"
            detail="رخصة الموقع + اشتراطات حيّك على منصة بلدي"
            letter="ب"
          />
          <AgentTile
            name="الدفاع المدني"
            deliverable="شهادة سلامة"
            detail="طفايات، مخارج طوارئ، كواشف دخان — حسب النشاط"
            letter="س"
          />
          <AgentTile
            name="الغذاء والدواء"
            deliverable="ترخيص SFDA"
            detail="للمطاعم والكوفي — شرط قبل فتح الأبواب"
            letter="غ"
          />
          <AgentTile
            name="الموارد البشرية"
            deliverable="ملف منشأة + نطاقات"
            detail="ملف MOHR + التأمينات + تقدير نطاقات"
            letter="م"
          />
          <AgentTile
            name="الزكاة والضريبة"
            deliverable="ZATCA + فوترة"
            detail="تسجيل ضريبي + VAT + الفوترة الإلكترونية"
            letter="ز"
          />
          <AgentTile
            name="حماية البيانات"
            deliverable="PDPL + NCA ECC"
            detail="سياسة خصوصية، DPO، نقل بيانات، أمن سيبراني"
            letter="ح"
          />
          <AgentTile
            name="المنسّق"
            deliverable="يوزّع الشغل"
            detail="يحدد وش الوكلاء اللي يحتاجهم مشروعك فقط"
            letter="◈"
            muted
          />
        </div>

        <p className="mt-6 max-w-2xl text-sm text-ink-2">
          <span className="font-display font-extrabold">درع يشغّل بس الوكلاء اللي يحتاجهم مشروعك.</span>{' '}
          مطعم؟ <span className="font-mono font-bold tabular-nums text-ink">٦</span> وكلاء. شركة
          تقنية؟ <span className="font-mono font-bold tabular-nums text-ink">٤</span> وكلاء. متجر
          إلكتروني؟ <span className="font-mono font-bold tabular-nums text-ink">٥</span> وكلاء.
        </p>
      </section>

      {/* ── 3. How it works ─────────────────────────────────── */}
      <section id="how" className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="mb-10">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            من السؤال الأول للنتيجة — ٣ دقائق
          </h2>
        </div>
        <div className="rule mb-10" />

        <ol className="grid gap-10 md:grid-cols-3">
          <Step
            num="١"
            title="تكلّم"
            body="قول لدرع وش مشروعك بالعربي العادي. يفهمك ويسألك بس اللي يحتاجه."
          />
          <Step
            num="٢"
            title="الوكلاء يشتغلون"
            body="كل وكيل يجهّز متطلبات جهته، ويتواصل مع الباقين تلقائياً — تشوف المحادثة بينهم مباشرة."
          />
          <Step
            num="٣"
            title="النتيجة جاهزة"
            body="خريطة طريق كاملة + مستندات + تنبيهات ذكية. أو تقرير امتثال بالفجوات والغرامات."
          />
        </ol>
      </section>

      {/* ── 4. Proof — Nova Tech live scan ──────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="mb-10">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            جرّب بنفسك
          </h2>
        </div>
        <div className="rule mb-10" />

        <div className="border border-ink bg-white">
          <div className="border-b border-rule px-6 py-5 md:px-10 md:py-6">
            <span className="font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-accent">
              Nova Tech — SaaS سعودية
            </span>
            <p className="mt-2 max-w-2xl text-base leading-relaxed text-ink-2">
              فحصنا شركة تقنية سعودية — هذي النتيجة:
            </p>
          </div>
          <div className="grid grid-cols-1 divide-y divide-rule sm:grid-cols-3 sm:divide-y-0 sm:divide-s sm:divide-rule">
            <ProofCell
              number={`${toArabicDigits(String(novaStats.complianceScore))}٪`}
              label="نسبة الامتثال"
              numberClass="text-danger"
            />
            <ProofCell
              number={toArabicDigits(novaStats.totalFineCeilingSar.toLocaleString('en-US'))}
              unit="ريال"
              label="غرامات محتملة"
              numberClass="text-danger"
            />
            <ProofCell
              number={toArabicDigits(String(novaStats.gapCount).padStart(2, '0'))}
              label="فجوات مكتشفة"
            />
          </div>
          <div className="border-t border-rule px-6 py-5 md:px-10 md:py-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <a
                href="/demo/novatech/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-accent hover:text-accent-strong"
              >
                <span>شوف التقرير الكامل على الموقع التجريبي</span>
                <span aria-hidden>←</span>
              </a>
              <span className="text-[11px] text-muted">
                من فحص تم في{' '}
                <time dateTime={novaStats.computedAt}>
                  {new Date(novaStats.computedAt).toLocaleDateString('ar-SA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </time>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Numbers ──────────────────────────────────────── */}
      <section className="relative mx-auto max-w-6xl px-6 pb-16 md:px-10 md:pb-24">
        <div className="grid gap-0 border-y-2 border-ink sm:grid-cols-3">
          <StatCell
            number="٩٠٪"
            label="من الشركات السعودية ما تعرف وضعها الامتثالي"
          />
          <StatCell
            number="٥ مليون ريال"
            label="سقف الغرامة على مخالفة واحدة في PDPL"
            numberClass="text-warn"
          />
          <StatCell
            number="٧ – ١٥ جهة"
            label="حكومية لكل مشروع سعودي جديد"
            last
          />
        </div>
      </section>

      {/* ── 6. Footer ───────────────────────────────────────── */}
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

function AgentTile({
  name,
  deliverable,
  detail,
  letter,
  muted,
}: {
  name: string;
  deliverable: string;
  detail: string;
  letter: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`group relative flex min-h-[180px] flex-col justify-between border-rule p-5 transition-colors md:p-6 ${
        muted
          ? 'bg-paper-2/50 [&]:hover:bg-paper-2'
          : 'bg-white hover:bg-paper-2/40'
      } border-b border-s-0 sm:border-s ltr:first:border-s-0 rtl:first:border-s-0`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="eyebrow !text-[10px]">وكيل</div>
          <div className="mt-1 font-display text-xl font-extrabold tracking-tight text-ink">
            {name}
          </div>
        </div>
        <div
          aria-hidden
          className={`font-display text-4xl font-extrabold leading-none tracking-tighter ${
            muted ? 'text-rule' : 'text-accent/30 group-hover:text-accent/60'
          }`}
        >
          {letter}
        </div>
      </div>
      <div className="mt-4">
        <div className="font-display text-sm font-extrabold tracking-tight text-ink">
          {deliverable}
        </div>
        <p className="mt-1 text-[12.5px] leading-relaxed text-ink-2">{detail}</p>
      </div>
    </div>
  );
}

function Step({ num, title, body }: { num: string; title: string; body: string }) {
  return (
    <li className="relative">
      <div className="flex items-baseline gap-3">
        <span className="font-display text-5xl font-extrabold leading-none text-accent md:text-6xl">
          {num}
        </span>
        <h3 className="font-display text-xl font-extrabold tracking-tight">{title}</h3>
      </div>
      <p className="mt-4 border-t border-rule pt-4 text-sm leading-relaxed text-ink-2">
        {body}
      </p>
    </li>
  );
}

function ProofCell({
  number,
  unit,
  label,
  numberClass,
}: {
  number: string;
  unit?: string;
  label: string;
  numberClass?: string;
}) {
  return (
    <div className="px-6 py-7 md:px-10 md:py-9">
      <div
        className={`font-display text-4xl font-extrabold leading-none tabular-nums tracking-tighter md:text-5xl ${
          numberClass ?? 'text-ink'
        }`}
      >
        {number}
        {unit && (
          <span className="ms-2 text-base font-medium text-muted md:text-lg">{unit}</span>
        )}
      </div>
      <div className="mt-3 text-[13px] text-ink-2">{label}</div>
    </div>
  );
}

function StatCell({
  number,
  label,
  numberClass,
  last,
}: {
  number: string;
  label: string;
  numberClass?: string;
  last?: boolean;
}) {
  return (
    <div
      className={`px-6 py-8 md:px-8 md:py-10 ${
        last ? '' : 'border-b border-rule sm:border-b-0 sm:border-s'
      }`}
    >
      <div
        className={`font-display text-3xl font-extrabold leading-none tracking-tighter md:text-4xl ${
          numberClass ?? 'text-ink'
        }`}
      >
        {number}
      </div>
      <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{label}</p>
    </div>
  );
}
