import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getPlan } from '@/lib/plan-store';
import { EntityCard } from '@/components/entity-card';
import { EstablishmentProgress } from '@/components/establishment-progress';
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import { computeRenewals } from '@/lib/renewals';

export const dynamic = 'force-dynamic';

const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض',
  jeddah: 'جدة',
  mecca:  'مكة المكرمة',
  medina: 'المدينة المنورة',
  dammam: 'الدمام',
  khobar: 'الخُبَر',
  other:  'مدينة أخرى',
};

export default function EstablishmentPlanPage({ params }: { params: { planId: string } }) {
  const plan = getPlan(params.planId);
  if (!plan) notFound();

  if (plan.status === 'error') {
    return <PlanErrorState planId={plan.id} message={plan.errorMessage} />;
  }

  // While the establishment orchestrator is still running, show the live
  // timeline instead of an empty roadmap. The progress component polls and
  // router.refresh()es when status flips to 'complete' so this page
  // re-renders with the filled-in roadmap below.
  if (plan.status !== 'complete') {
    return <EstablishmentProgress planId={plan.id} />;
  }

  const { answers, entities, roadmap, costSummary, topWarnings, verticalLabelAr } = plan;
  const cityLabel = answers.est2_city ? CITY_LABELS[answers.est2_city] ?? answers.est2_city : null;
  let step = 0;

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-16">
      {/* Masthead */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">خريطة تأسيس</span>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {verticalLabelAr}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
            {cityLabel && <span>{cityLabel}</span>}
            {answers.est3_partner_count && (
              <>
                <span className="text-rule">·</span>
                <span className="font-mono tabular-nums">{answers.est3_partner_count}</span>
                <span>شركاء</span>
              </>
            )}
            {answers.est4_capital_sar && (
              <>
                <span className="text-rule">·</span>
                <span>رأس المال</span>
                <span className="font-mono tabular-nums">{answers.est4_capital_sar.toLocaleString('en-US')}</span>
                <span>ريال</span>
              </>
            )}
          </div>
        </div>
        <Link
          href="/"
          className="text-xs text-muted underline decoration-rule decoration-2 underline-offset-4 hover:text-ink"
        >
          خطة جديدة
        </Link>
      </header>

      <div className="rule-ink mb-10" />

      {/* Prominent legal disclaimer — establishment advice is regulatory */}
      <div className="mb-8 flex items-start gap-3 border border-rule bg-paper-2/50 px-4 py-3 text-xs leading-relaxed text-ink-2">
        <span className="font-mono tracking-widest text-accent">ملاحظة قانونية</span>
        <span className="max-w-3xl">
          المعلومات في هذه الصفحة استرشادية مبنية على الممارسات الشائعة، وليست بديلاً عن
          الاستشارة القانونية أو مراجعة الجهات الرسمية. التكاليف والمدد تقديرية وقابلة للتغيّر —
          راجع كل جهة على موقعها الرسمي قبل التقديم أو الالتزام بأي عقد.
        </span>
      </div>

      {/* Top-level warnings — e.g. "don't sign the lease" */}
      {topWarnings.length > 0 && (
        <div className="mb-10 space-y-4">
          {topWarnings.map((w, i) => (
            <div key={i} className="border-s-4 border-warn bg-warn-soft px-6 py-5">
              <div className="flex items-center gap-3">
                <span className="font-display text-xl font-extrabold tracking-tight text-warn-strong">
                  احذر قبل التوقيع
                </span>
                <span className="font-mono text-xs tracking-widest text-warn-strong/90">تنبيه مخصّص</span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink">{w}</p>
            </div>
          ))}
        </div>
      )}

      {/* Summary stat row */}
      <section className="mb-12 grid grid-cols-1 gap-0 border border-rule bg-white sm:grid-cols-3">
        <StatCell
          label="الجهات المطلوبة"
          value={entities.length.toString()}
        />
        <StatCell
          label="الرسوم التقديرية"
          value={
            costSummary.maxSar === 0
              ? 'مجاني'
              : `${costSummary.minSar.toLocaleString('en-US')} – ${costSummary.maxSar.toLocaleString('en-US')} ريال`
          }
          note="رسوم الجهات فقط"
        />
        <StatCell
          label="المدة التقديرية"
          value={`${roadmap.length} أسابيع`}
          note="بالتوازي حيث يمكن"
          noRightBorder
        />
      </section>

      {/* Roadmap — timeline with week headers */}
      <section>
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            خريطة الطريق
          </h2>
          <span className="font-mono text-xs tabular-nums text-muted">
            بالترتيب الصحيح
          </span>
        </div>
        <div className="rule mb-8" />

        <div className="space-y-10">
          {roadmap.map((week, wi) => (
            <div key={week.label}>
              <div className="mb-4 flex items-baseline gap-4">
                <span className="font-display text-3xl font-extrabold tabular-nums leading-none text-ink md:text-4xl">
                  {String(wi + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <div className="eyebrow">المرحلة</div>
                  <div className="font-display text-lg font-extrabold tracking-tight">
                    {week.label}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                {week.entities.map((entity) => {
                  step += 1;
                  return <EntityCard key={entity.id} entity={entity} step={step} />;
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {(() => {
        const renewals = computeRenewals(entities);
        if (renewals.length === 0) return null;
        return (
          <section className="mt-16">
            <div className="mb-6 flex items-baseline justify-between">
              <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
                التجديدات القادمة
              </h2>
              <span className="font-mono text-xs tabular-nums text-muted">
                {renewals.length.toString().padStart(2, '0')} تجديد
              </span>
            </div>
            <div className="rule mb-6" />
            <p className="mb-5 max-w-2xl text-xs leading-relaxed text-muted">
              محسوبة من تاريخ إنشاء هذه الخطة كافتراض لتاريخ بدء النشاط. عند فتح الحساب وتسجيل تواريخ الإصدار الفعلية، التواريخ تُحدّث تلقائياً.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {renewals.map((r) => {
                const dueLabel = r.nextDueAt.toLocaleDateString('ar-SA', {
                  year: 'numeric', month: 'long', day: 'numeric',
                });
                const urgencyStyle =
                  r.urgency === 'urgent' ? 'border-danger/40 bg-danger/5 text-danger' :
                  r.urgency === 'soon'   ? 'border-warn/40 bg-warn-soft/50 text-warn-strong' :
                                            'border-rule bg-white text-ink-2';
                return (
                  <li
                    key={r.entityId}
                    className={`flex items-start gap-3 border px-4 py-3 ${urgencyStyle}`}
                  >
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-current" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <div className="font-display text-sm font-extrabold leading-tight tracking-tight text-ink">
                        {r.nameSimpleAr}
                      </div>
                      <div className="mt-1 text-xs text-ink-2">
                        {dueLabel}
                        <span className="mx-2 text-rule">·</span>
                        <span className="font-mono tabular-nums">{r.daysRemaining}</span>
                        <span> يوم متبقي</span>
                      </div>
                      <div className="mt-1 text-[11px] text-muted">
                        دورة: {r.renewalPeriodAr}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}

      <LegalDisclaimer />
    </main>
  );
}

function PlanErrorState({ planId, message }: { planId: string; message?: string }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <span className="eyebrow">خطأ</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
        تعذّر إكمال خطة التأسيس
      </h1>
      {message && <p className="mt-3 text-sm text-ink-2">{message}</p>}
      <p className="mt-3 font-mono text-xs text-muted">
        المعرّف: <code dir="ltr">{planId}</code>
      </p>
      <Link href="/" className="btn-outline mt-8 inline-flex">
        ابدأ خطة جديدة
      </Link>
    </main>
  );
}

function StatCell({
  label,
  value,
  note,
  noRightBorder,
}: {
  label: string;
  value: string;
  note?: string;
  noRightBorder?: boolean;
}) {
  return (
    <div
      className={`px-5 py-5 md:px-6 md:py-6 ${
        noRightBorder ? '' : 'border-b border-rule sm:border-b-0 sm:border-s'
      }`}
    >
      <div className="eyebrow">{label}</div>
      <div className="mt-2 font-display text-2xl font-extrabold leading-tight tracking-tight text-ink">
        {value}
      </div>
      {note && <div className="mt-1 text-xs text-muted">{note}</div>}
    </div>
  );
}
