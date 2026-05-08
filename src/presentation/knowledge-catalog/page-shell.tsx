import Link from 'next/link';
import { ALWAYS_REQUIRED, VERTICALS } from '@/knowledge/entities';
import { VAT } from '@/knowledge/zatca';
import { TERMS } from '@/knowledge/terms';

const FEATURED_TERMS = ['ZATCA', 'tax_VAT', 'gov_GOSI', 'license_CR'] as const;

export function KnowledgeCatalogPage() {
  const totalTerms = Object.keys(TERMS).length;
  const totalEntities =
    ALWAYS_REQUIRED.length +
    Object.values(VERTICALS).reduce((acc, v) => acc + v.entities.length, 0);

  return (
    <main className="relative mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-16">
      <nav aria-label="مسار التنقّل" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          درع
        </Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">قاعدة المعرفة</span>
      </nav>

      <header className="mb-10">
        <span className="eyebrow">قاعدة المعرفة · Knowledge Base</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.1] tracking-tighter md:text-6xl">
          مرجع المحلات الصغيرة
          <br />
          <span className="text-accent">في السعودية</span>
        </h1>
        <div className="rule-accent mt-6 w-16" />
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          الجهات التنظيمية لكل نوع محل + متطلباتها + مواعيد التجديد. كل ما تحتاج معرفته في مكان واحد
          — مرجَع للمصادر الرسمية.
        </p>
      </header>

      <section className="mb-16 grid grid-cols-2 gap-0 border border-rule bg-white sm:grid-cols-4">
        <Stat label="فئات محلات" value={Object.keys(VERTICALS).length.toString()} />
        <Stat label="جهات تنظيمية" value={totalEntities.toString()} />
        <Stat label="مصطلح موضّح" value={totalTerms.toString()} />
        <Stat
          label="حد VAT"
          value={`${(VAT.mandatoryRegistrationSar / 1000).toFixed(0)}K SAR`}
          last
        />
      </section>

      <section className="mb-16">
        <SectionHeader
          eyebrow="الفئات المدعومة"
          title="٥ أنواع محلات"
          subtitle="كل فئة لها مجموعة جهات تنظيمية فريدة + متطلبات تشغيلية محددة."
        />
        <div className="mt-8 grid grid-cols-1 gap-0 border border-rule bg-white md:grid-cols-2">
          {Object.values(VERTICALS).map((v, i) => (
            <div
              key={v.id}
              className={`p-6 ${i % 2 === 0 ? 'md:border-e' : ''} ${i < Object.values(VERTICALS).length - 2 ? 'border-b' : ''} border-rule`}
            >
              <h3 className="font-display text-2xl font-extrabold tracking-tight">{v.labelAr}</h3>
              <p className="mt-2 text-sm text-ink-2">
                {[...ALWAYS_REQUIRED, ...v.entities].length} جهة تنظيمية مطلوبة
              </p>
              <ul className="mt-4 flex flex-wrap gap-1.5">
                {[...ALWAYS_REQUIRED, ...v.entities].map((e) => (
                  <li
                    key={e.id}
                    className="border border-ink/10 bg-paper-2 px-2.5 py-1 font-mono text-[11px]"
                  >
                    {e.nameSimpleAr}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-16">
        <SectionHeader
          eyebrow="المتطلبات الأساسية"
          title="جهات يلزم على كل محل"
          subtitle="بغض النظر عن نوع النشاط — هذي الجهات تنطبق على أي محل تجاري في السعودية."
        />
        <ul className="mt-8 space-y-3">
          {ALWAYS_REQUIRED.map((e) => (
            <li key={e.id} className="border border-rule bg-white p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-display text-xl font-extrabold tracking-tight">{e.nameAr}</h3>
                {e.officialUrl && (
                  <a
                    href={e.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-accent hover:text-accent-strong"
                  >
                    افتح البوابة الرسمية ↗
                  </a>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-ink-2">{e.explainAr}</p>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-muted">
                <span>التجديد: {e.renewalPeriodAr ?? 'مستمر'}</span>
                {e.estimatedTimeAr && (
                  <>
                    <span aria-hidden className="text-rule">
                      ·
                    </span>
                    <span>{e.estimatedTimeAr}</span>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-16">
        <SectionHeader
          eyebrow="مفاهيم أساسية"
          title="مصطلحات شائعة"
          subtitle="مفاهيم تتكرر في الإجراءات الحكومية — شرحناها بالعربي السهل."
        />
        <ul className="mt-8 grid grid-cols-1 gap-3 md:grid-cols-2">
          {FEATURED_TERMS.filter((t) => TERMS[t]).map((t) => {
            const term = TERMS[t];
            return (
              <li key={t} className="border border-rule bg-white p-5">
                <div className="font-display text-lg font-extrabold tracking-tight">
                  {term.termAr}
                </div>
                <p className="mt-2 text-sm leading-relaxed text-ink-2">{term.simpleExplanation}</p>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}

function Stat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div className={`px-6 py-5 text-center ${last ? '' : 'border-e border-rule'}`}>
      <div className="font-display text-3xl font-extrabold tabular-nums leading-none md:text-4xl">
        {value}
      </div>
      <div className="mt-2 text-[11px] text-muted">{label}</div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-2 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
        {title}
      </h2>
      <div className="rule-accent mt-4 w-12" />
      <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-2">{subtitle}</p>
    </div>
  );
}
