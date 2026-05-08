import Link from 'next/link';
import { PDPL_RULES, PDPL_DATA_SUBJECT_RIGHTS } from '@/knowledge/pdpl';
import { ECC_DOMAINS, ECC_CONTROLS, getControlsForDomain } from '@/knowledge/nca-ecc';
import { VAT, E_INVOICE_PHASES, ZATCA_RULES } from '@/knowledge/zatca';
import { TERMS } from '@/knowledge/terms';

const FEATURED_TERMS = ['PDPL', 'DPO', 'NCA_ECC', 'ZATCA', 'SDAIA', 'privacy_policy'] as const;

const SEVERITY_STYLE: Record<string, string> = {
  critical: 'border-danger/40 bg-danger/5 text-danger',
  high: 'border-warn/40 bg-warn-soft text-warn-strong',
  medium: 'border-ink/30 bg-paper-2 text-ink-2',
  low: 'border-rule bg-paper-2 text-muted',
};
const SEVERITY_LABEL: Record<string, string> = {
  critical: 'حرج',
  high: 'مرتفع',
  medium: 'متوسط',
  low: 'منخفض',
};

export function KnowledgeCatalogPage() {
  const totalTerms = Object.keys(TERMS).length;

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
          قاعدة معرفة سعودية
          <br />
          <span className="text-accent">شاملة وحيّة</span>
        </h1>
        <div className="rule-accent mt-6 w-16" />
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-ink-2">
          كل قاعدة، كل ضابط، كل مصطلح — مدمج في الكود، مغطّى باختبارات، ومرجَع إلى المصدر النظامي.
          القائمة كاملة هنا — هذي اللي تنبني عليها قرارات الوكلاء.
        </p>
      </header>

      <section className="mb-16 grid grid-cols-2 gap-0 border border-rule bg-white sm:grid-cols-4">
        <Stat label="قاعدة PDPL" value={PDPL_RULES.length.toString()} />
        <Stat label="ضابط NCA-ECC" value={ECC_CONTROLS.length.toString()} />
        <Stat label="قاعدة ZATCA" value={ZATCA_RULES.length.toString()} />
        <Stat label="مصطلح موضَّح" value={totalTerms.toString()} last />
      </section>

      {/* PDPL */}
      <section className="mb-16">
        <SectionHeader
          eyebrow="نظام حماية البيانات الشخصية"
          title="PDPL — Royal Decree M/19"
          desc="نظام حماية البيانات الشخصية الصادر بالمرسوم الملكي رقم م/19 وتعديلاته. ٥ حقوق لصاحب البيانات + قواعد إفصاح + سقوف غرامات."
          count={PDPL_RULES.length}
        />

        <div className="mb-8 grid gap-4 md:grid-cols-5">
          {PDPL_DATA_SUBJECT_RIGHTS.map((r, i) => (
            <div key={r.id} className="border border-rule bg-paper-2 p-4">
              <span className="font-mono text-[10px] tabular-nums text-muted">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="mt-1 font-display text-base font-extrabold tracking-tight">
                {r.nameAr}
              </h3>
              <p className="mt-2 text-xs leading-relaxed text-ink-2">{r.descriptionAr}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {PDPL_RULES.map((rule, i) => (
            <article
              key={rule.id}
              className="border border-rule bg-white p-5 transition-colors hover:border-ink"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[11px] tabular-nums text-muted">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="font-display text-base font-extrabold tracking-tight md:text-lg">
                    {rule.titleAr}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`pill border text-[10px] font-bold tracking-widest ${SEVERITY_STYLE[rule.severity]}`}
                  >
                    {SEVERITY_LABEL[rule.severity] ?? rule.severity}
                  </span>
                  <span className="font-mono text-xs tabular-nums text-ink-2">
                    حتى {rule.fineCapSar.toLocaleString('en-US')} ر.س
                  </span>
                </div>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">{rule.requirementAr}</p>
              <p className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted">
                {rule.id}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* NCA-ECC */}
      <section className="mb-16">
        <SectionHeader
          eyebrow="ضوابط الأمن السيبراني الأساسية"
          title="NCA-ECC — 5 محاور · 114 ضابط"
          desc="ضوابط الأمن السيبراني الأساسية للهيئة الوطنية للأمن السيبراني (ECC-1:2018). إلزامية للجهات الحكومية ومُورّديها وأي شركة تتعامل مع البنية التحتية الحساسة."
          count={ECC_CONTROLS.length}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ECC_DOMAINS.map((d) => {
            const controls = getControlsForDomain(d.id);
            return (
              <div key={d.id} className="border border-rule bg-white p-5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-[11px] tracking-wider text-muted">
                    ECC-{d.prefix}
                  </span>
                  <span className="font-display text-2xl font-extrabold tabular-nums text-accent">
                    {controls.length}
                  </span>
                </div>
                <h3 className="mt-2 font-display text-lg font-extrabold tracking-tight">
                  {d.titleAr}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-ink-2">{d.descriptionAr}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ZATCA */}
      <section className="mb-16">
        <SectionHeader
          eyebrow="الضرائب والفوترة الإلكترونية"
          title="ZATCA — VAT · Fatoora"
          desc="الزكاة والضريبة والجمارك. عتبات تسجيل VAT، مراحل الفوترة الإلكترونية، الاستقطاع، والأنظمة الفرعية."
          count={ZATCA_RULES.length}
        />

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="border-s-2 border-accent bg-accent-soft px-5 py-4">
            <div className="eyebrow !text-[10px]">تسجيل VAT إلزامي</div>
            <div className="mt-2 font-display text-3xl font-extrabold tabular-nums tracking-tight text-accent-strong">
              {VAT.mandatoryRegistrationSar.toLocaleString('en-US')}
            </div>
            <div className="mt-1 text-xs text-ink-2">ريال سنوياً</div>
          </div>
          <div className="border-s-2 border-ink bg-paper-2 px-5 py-4">
            <div className="eyebrow !text-[10px]">تسجيل اختياري</div>
            <div className="mt-2 font-display text-3xl font-extrabold tabular-nums tracking-tight text-ink">
              {VAT.voluntaryRegistrationSar.toLocaleString('en-US')}
            </div>
            <div className="mt-1 text-xs text-ink-2">ريال سنوياً</div>
          </div>
          <div className="border-s-2 border-warn bg-warn-soft px-5 py-4">
            <div className="eyebrow !text-[10px]">معدّل ضريبة القيمة المضافة</div>
            <div className="mt-2 font-display text-3xl font-extrabold tabular-nums tracking-tight text-warn-strong">
              {VAT.standardRatePercent}٪
            </div>
            <div className="mt-1 text-xs text-ink-2">على السلع والخدمات</div>
          </div>
        </div>

        <div className="space-y-4">
          {E_INVOICE_PHASES.map((phase) => (
            <div key={phase.id} className="border border-rule bg-white p-5">
              <h3 className="font-display text-lg font-extrabold tracking-tight">{phase.nameAr}</h3>
              <p className="mt-1 text-xs text-muted">{phase.mandatoryFromAr}</p>
              <ul className="mt-4 space-y-2">
                {phase.requirementsAr.map((r) => (
                  <li key={r} className="flex items-start gap-2 text-sm text-ink-2">
                    <span aria-hidden className="mt-1 text-accent">
                      ▸
                    </span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Terms glossary */}
      <section className="mb-12">
        <SectionHeader
          eyebrow="القاموس المُبسَّط"
          title="مصطلحات بالعربي الواضح"
          desc="كل مصطلح ممكن نستخدمه شُرح بجُملة واحدة بالعامية الخليجية، مع تشبيه من الحياة اليومية."
          count={totalTerms}
        />

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURED_TERMS.map((id) => {
            const t = TERMS[id];
            return (
              <article key={id} className="border border-rule bg-white p-5">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-display text-base font-extrabold tracking-tight">
                    {t.termAr}
                  </h3>
                  <span className="font-mono text-[10px] tabular-nums text-muted" dir="ltr">
                    {t.term}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-ink-2">{t.simpleExplanation}</p>
                {t.analogy && (
                  <p className="mt-3 border-t border-rule pt-3 text-xs italic text-muted">
                    💡 {t.analogy}
                  </p>
                )}
              </article>
            );
          })}
        </div>
        <p className="mt-6 text-xs text-muted">
          * عرض {FEATURED_TERMS.length} من أصل {totalTerms} مصطلح. تظهر الباقي تلقائياً عند ذكرها في
          المحادثة أو التقارير.
        </p>
      </section>

      <section className="border-s-2 border-ink bg-paper-2 px-6 py-7">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">شغّل القواعد عملياً</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
          كل قاعدة هنا تُشغّل تلقائياً على مشروعك. ابدأ فحص امتثال وراح تشوف فجواتك ضد الـ 35 قاعدة
          + 114 ضابط، مع سقف الغرامة المتوقَّع.
        </p>
        <Link href="/chat?mode=compliance" className="btn-ink mt-6 inline-flex text-sm">
          ابدأ فحص امتثال
          <span aria-hidden className="ms-2">
            ←
          </span>
        </Link>
      </section>
    </main>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
  count,
}: {
  eyebrow: string;
  title: string;
  desc: string;
  count: number;
}) {
  return (
    <div className="mb-8">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="eyebrow">{eyebrow}</span>
        <span className="font-mono text-xs tabular-nums text-muted">
          {String(count).padStart(2, '0')} عنصر
        </span>
      </div>
      <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">{desc}</p>
      <div className="rule mt-6" />
    </div>
  );
}

function Stat({ label, value, last }: { label: string; value: string; last?: boolean }) {
  return (
    <div
      className={`px-5 py-5 md:px-6 md:py-6 ${
        last ? '' : 'border-b border-rule sm:border-b-0 sm:border-s'
      }`}
    >
      <div className="font-display text-3xl font-extrabold tabular-nums leading-none tracking-tighter text-ink md:text-4xl">
        {value}
      </div>
      <div className="mt-2 text-xs text-ink-2">{label}</div>
    </div>
  );
}
