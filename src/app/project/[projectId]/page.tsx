import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { getProject } from '@/lib/project-store';
import { EntityCard } from '@/components/entity-card';
import { GapCard } from '@/components/gap-card';
import { ScoreRing } from '@/components/score-ring';
import { NumberTicker } from '@/components/number-ticker';
import { DocumentsSection } from '@/components/documents-section';
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import { SaveProjectBanner } from '@/components/save-project-banner';
import { OperationalDashboard } from '@/components/operational-dashboard';
import { computeRenewals } from '@/lib/renewals';
import type { DocumentKind } from '@/agents/document-agent';
import type { Gap } from '@/agents/analysis-agent';
import type { Answers } from '@/agents/chat-flow';

export const dynamic = 'force-dynamic';

const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض', jeddah: 'جدة', mecca: 'مكة المكرمة',
  medina: 'المدينة المنورة', dammam: 'الدمام', khobar: 'الخُبَر', other: 'مدينة أخرى',
};

/**
 * Unified project dashboard. Same page for both modes — establishment
 * renders entities as a roadmap, compliance adds score + gaps + fines on
 * top. Every alert, entity, cost summary, renewal list, and document
 * recommendation lives here so there's ONE place to look.
 */
export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const project = getProject(params.projectId);
  if (!project) notFound();
  if (project.status === 'pending' || project.status === 'running') {
    redirect(`/project/${project.id}/agents`);
  }
  if (project.status === 'error') {
    return <ProjectErrorState projectId={project.id} message={project.errorMessage} />;
  }

  const { mode, companyName, vertical, cityId, entities, roadmap, costSummary, topWarnings, analysis, complianceScore, totalFineCeilingSar, gaps, answers, url, messages, operationalReport } = project;
  const cityLabel = cityId ? CITY_LABELS[cityId] ?? cityId : null;
  const verticalLabel = verticalDisplayLabel(vertical);
  const isCompliance = mode === 'compliance';
  const isOperational = mode === 'operational_compliance';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-14">
      {/* Breadcrumb */}
      <nav aria-label="مسار التنقّل" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-ink">درع</Link>
        <span aria-hidden>›</span>
        <Link href="/chat" className="hover:text-ink">المحادثة</Link>
        <span aria-hidden>›</span>
        <Link href={`/project/${project.id}/agents`} className="hover:text-ink">الوكلاء</Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">
          {isOperational ? 'الامتثال التشغيلي' : isCompliance ? 'تقرير الامتثال' : 'خريطة التأسيس'}
        </span>
      </nav>

      {/* Masthead */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="pill mb-3 text-[11px] font-bold tracking-widest text-accent-strong border-accent/30 bg-accent-soft">
            {isOperational ? '◉ الامتثال التشغيلي' : isCompliance ? '◉ تقرير الامتثال' : '◉ خريطة التأسيس'}
          </span>
          <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tighter md:text-6xl">
            {companyName}
          </h1>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
            <span>{verticalLabel}</span>
            {cityLabel && (<><span className="text-rule">·</span><span>{cityLabel}</span></>)}
            {url && (
              <>
                <span className="text-rule">·</span>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="font-mono text-xs border-b border-rule pb-0.5 hover:border-accent hover:text-accent"
                >
                  {url}
                </a>
              </>
            )}
          </div>
        </div>
        <Link
          href="/"
          className="shrink-0 border border-rule bg-white px-4 py-2 text-xs font-semibold text-ink-2 hover:border-ink hover:text-ink"
        >
          مشروع جديد +
        </Link>
      </header>

      <div className="rule-ink mb-10" />

      <SaveProjectBanner projectId={project.id} initialEmail={project.email} />

      {/* Trade-name finding — hoisted to the top for establishment projects so it's
          the first answer a new founder sees. Full detail still renders inside the
          MCI entity card below. */}
      {!isCompliance && (() => {
        const mciEntity = entities.find((e) => e.id === 'mci');
        const check = mciEntity?.nameCheck;
        if (!check || check.status === 'skipped') return null;
        return (
          <section className="mb-10">
            <TradeNameBanner check={check} companyName={companyName} />
          </section>
        );
      })()}

      {/* Prominent warnings — top of page, before anything else. */}
      {topWarnings.length > 0 && (
        <section className="mb-10 space-y-4">
          {topWarnings.map((w, i) => (
            <div key={i} className="border-s-4 border-warn bg-warn-soft px-6 py-5">
              <div className="flex items-center gap-3">
                <span aria-hidden className="text-xl">⚠️</span>
                <span className="font-display text-xl font-extrabold tracking-tight text-warn-strong">
                  تنبيه مهم
                </span>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-ink">{w}</p>
            </div>
          ))}
        </section>
      )}

      {/* Operational-compliance dashboard — for physical businesses */}
      {isOperational && operationalReport && (
        <section className="mb-12">
          <OperationalDashboard report={operationalReport} />
        </section>
      )}

      {/* Compliance summary — score + fine ceiling */}
      {isCompliance && analysis && (
        <section className="mb-12 grid gap-10 md:grid-cols-2 md:gap-16">
          <div>
            <ScoreRing
              score={complianceScore ?? 0}
              label="نسبة الامتثال"
              sublabel={(complianceScore ?? 0) >= 75 ? 'وضعك جيد — في نقاط يمكن تحسينها.' : (complianceScore ?? 0) >= 50 ? 'في مخاطر متوسطة. راجع الفجوات أدناه.' : 'في فجوات حرجة ينبغي معالجتها قبل أي تفتيش.'}
            />
          </div>
          <div className="border-s-2 border-ink md:ps-8">
            <div className="eyebrow">الغرامة القصوى الممكنة</div>
            <div className="mt-3 font-display text-5xl font-extrabold leading-none tabular-nums tracking-tighter text-danger sm:text-6xl md:text-7xl" style={{ wordBreak: 'break-word' }}>
              <NumberTicker
                target={totalFineCeilingSar ?? 0}
                ariaLabel={`الغرامة القصوى الممكنة: ${(totalFineCeilingSar ?? 0).toLocaleString('en-US')} ريال سعودي`}
              />
            </div>
            <div className="mt-2 font-display text-lg font-extrabold tracking-tight text-muted">
              ريال سعودي
            </div>
            <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-2">
              سقف نظامي — مجموع الحد الأقصى للغرامات على الفجوات المؤكدة. أغلبها يُتفادى بخطوات أدناه.
            </p>
          </div>
        </section>
      )}

      {/* Establishment summary — tiles */}
      {!isCompliance && (
        <section className="mb-12 grid grid-cols-1 gap-0 border border-rule bg-white sm:grid-cols-3">
          <StatCell label="الجهات المطلوبة" value={entities.length.toString()} />
          <StatCell
            label="الرسوم التقديرية"
            value={costSummary.maxSar === 0
              ? 'مجاني'
              : `${costSummary.minSar.toLocaleString('en-US')}–${costSummary.maxSar.toLocaleString('en-US')} ريال`}
            note="رسوم الجهات فقط"
          />
          <StatCell
            label="المدة التقديرية"
            value={`${roadmap.length} أسابيع`}
            note="بالتوازي حيث يمكن"
            noRightBorder
          />
        </section>
      )}

      {/* Compliance gaps section */}
      {isCompliance && gaps && gaps.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">الفجوات المكتشفة</h2>
            <span className="font-mono text-xs tabular-nums text-muted">
              {gaps.length.toString().padStart(2, '0')} / {analysis?.applicableRuleCount.toString().padStart(2, '0') ?? '—'}
            </span>
          </div>
          <div className="rule mb-6" />
          <div className="space-y-4">
            {gaps.map((gap, i) => (
              <GapCard key={gap.id} gap={gap} scanId={project.id} index={i} />
            ))}
          </div>
        </section>
      )}
      {isCompliance && (!gaps || gaps.length === 0) && analysis && (
        <section className="mb-12 border border-accent/20 bg-accent-soft px-6 py-8 text-center">
          <h3 className="font-display text-2xl font-extrabold text-accent-strong">ما لقينا فجوات.</h3>
          <p className="mt-3 text-sm text-ink-2">
            استمر في مراجعة التحديثات التنظيمية — سنُشعرك بأي جديد من الجهات.
          </p>
        </section>
      )}

      {/* Roadmap */}
      {roadmap.length > 0 && (
        <section className="mb-12">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              {isCompliance ? 'الجهات المُطابَقة' : 'خريطة الطريق'}
            </h2>
            <span className="font-mono text-xs tabular-nums text-muted">{isCompliance ? 'بالترتيب الزمني' : 'بالترتيب الصحيح'}</span>
          </div>
          <div className="rule mb-8" />
          <div className="space-y-10">
            {roadmap.map((week, wi) => {
              let running = 0;
              // derive running step counter ignoring earlier weeks
              for (let j = 0; j < wi; j++) running += roadmap[j].entities.length;
              return (
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
                    {week.entities.map((entity, ei) => {
                      const incoming = messages.filter(
                        (m) => m.to === entity.id || m.to === 'ALL',
                      );
                      const outgoing = messages.filter((m) => m.from === entity.id);
                      return (
                        <EntityCard
                          key={entity.id}
                          entity={entity}
                          step={running + ei + 1}
                          incoming={incoming}
                          outgoing={outgoing}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Renewals — operational mode already shows a richer timeline above,
          so we suppress the legacy section there to avoid duplication. */}
      {!isOperational && (() => {
        const renewals = computeRenewals(entities);
        if (renewals.length === 0) return null;
        return (
          <section className="mb-12">
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
              محسوبة من تاريخ إنشاء هذه الخطة كافتراض لتاريخ بدء النشاط.
            </p>
            <ul className="grid gap-3 sm:grid-cols-2">
              {renewals.map((r) => {
                const dueLabel = r.nextDueAt.toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' });
                const urgencyStyle =
                  r.urgency === 'urgent' ? 'border-danger/40 bg-danger/5 text-danger' :
                  r.urgency === 'soon'   ? 'border-warn/40 bg-warn-soft/50 text-warn-strong' :
                                            'border-rule bg-white text-ink-2';
                return (
                  <li key={r.entityId} className={`flex items-start gap-3 border px-4 py-3 ${urgencyStyle}`}>
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
                      <div className="mt-1 text-xs text-muted">دورة: {r.renewalPeriodAr}</div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}

      {/* Documents — compliance mode (gap-driven) */}
      {isCompliance && gaps && (
        <DocumentsSection
          scanId={project.id}
          recommendations={buildRecommendations(answers, gaps)}
        />
      )}

      {/* Compliance-only: URL skipped → partial-report notice */}
      {isCompliance && !url && (
        <section className="mb-12 border-s-2 border-accent bg-accent-soft/60 px-6 py-6">
          <div className="flex items-baseline gap-3">
            <span aria-hidden className="text-lg">ℹ️</span>
            <h3 className="font-display text-xl font-extrabold tracking-tight text-accent-strong">
              هذا التقرير مبني على إجاباتك فقط
            </h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            ما فحصنا موقعك — يعني ممكن يكون فيه فجوات إضافية ما نعرف عنها
            (سياسة الخصوصية، رؤوس الأمان، أدوات التتبع، النماذج). عطنا رابط
            موقعك عشان نعطيك تقرير أدق.
          </p>
          <Link
            href="/chat"
            className="btn-outline mt-5 inline-flex text-sm"
          >
            أضف رابط الموقع وأعد الفحص
            <span aria-hidden className="ms-2">←</span>
          </Link>
        </section>
      )}

      {/* Establishment-only: continue-to-compliance handoff */}
      {!isCompliance && (
        <section className="mb-12 border-s-2 border-ink bg-paper-2 px-6 py-7">
          <div className="flex items-baseline gap-3">
            <span aria-hidden className="text-lg">🔄</span>
            <h3 className="font-display text-2xl font-extrabold tracking-tight">
              فتحت مشروعك؟
            </h3>
          </div>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-2">
            درع يقدر يفحص وضعك الحالي ويتأكد إنك ملتزم بكل الأنظمة — نفس
            الجهات اللي جهّزناها لك فوق. بنسألك بعض أسئلة إضافية عن وضعك
            (موظفين، بيانات، رخص سارية) وبنعطيك تقرير شامل بنسبة الامتثال
            والفجوات.
          </p>
          <Link
            href={`/chat?continueFrom=${project.id}`}
            className="btn-ink mt-6 inline-flex text-sm"
          >
            ابدأ فحص الامتثال
            <span aria-hidden className="ms-2">←</span>
          </Link>
          <p className="mt-3 text-xs text-muted">
            اسم الشركة، نوع النشاط، والمدينة محفوظين — ما نعيد سؤالك عنهم.
          </p>
        </section>
      )}

      <LegalDisclaimer />
    </main>
  );
}

/* ------------------------------------------------------------------------- */

function verticalDisplayLabel(v: string): string {
  switch (v) {
    case 'restaurant':   return 'مطعم / كوفي شوب';
    case 'salon':        return 'صالون / مركز تجميل';
    case 'tech':         return 'شركة تقنية';
    case 'services':     return 'متجر إلكتروني';
    case 'construction': return 'مقاولات / بناء';
    default:             return v;
  }
}

function buildRecommendations(
  answers: Answers,
  gaps: Gap[],
): Array<{ kind: DocumentKind; priorityAr: string; whyAr: string }> {
  const recs: Array<{ kind: DocumentKind; priorityAr: string; whyAr: string }> = [];

  const hasPolicyGap = gaps.some((g) => ['pdpl_privacy_policy_published','pdpl_arabic_available','pdpl_purpose_stated','pdpl_retention_stated','pdpl_cross_border_disclosed','pdpl_third_party_disclosed','pdpl_trackers_disclosed','pdpl_form_consent_present'].includes(g.ruleId));
  const hasDpoGap = gaps.some((g) => g.ruleId === 'pdpl_dpo_required');
  const processesData = answers.q3_processes_personal_data === 'yes';

  if (hasPolicyGap || processesData) {
    recs.push({
      kind: 'privacy_policy',
      priorityAr: hasPolicyGap ? 'ضروري' : 'موصى به',
      whyAr: hasPolicyGap
        ? 'سياسة الخصوصية الحالية ناقصة أو مفقودة — نولّد نسخة جديدة مخصّصة لشركتك.'
        : 'راجع سياستك الحالية ضد القالب — أو ولّد نسخة مخصّصة.',
    });
  }
  if (hasDpoGap) {
    recs.push({
      kind: 'dpo_appointment',
      priorityAr: 'ضروري',
      whyAr: 'لأن قاعدة المستخدمين كبيرة، النظام يتطلب تعيين رسمي لمسؤول حماية بيانات.',
    });
  }
  if (processesData) {
    recs.push({
      kind: 'processing_register',
      priorityAr: 'مطلوب',
      whyAr: 'سجل إلزامي يُقدَّم لـ SDAIA عند التفتيش.',
    });
    recs.push({
      kind: 'incident_response',
      priorityAr: 'موصى به',
      whyAr: 'إجراء جاهز يحدد وش تسوي لو حدث اختراق.',
    });
  }
  return recs;
}

function ProjectErrorState({ projectId, message }: { projectId: string; message?: string }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <span className="eyebrow">خطأ</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
        تعذّر إكمال المشروع
      </h1>
      {message && <p className="mt-3 text-sm text-ink-2">{message}</p>}
      <p className="mt-3 font-mono text-xs text-muted">
        المعرّف: <code dir="ltr">{projectId}</code>
      </p>
      <Link href="/" className="btn-outline mt-8 inline-flex">
        ابدأ مشروع جديد
      </Link>
    </main>
  );
}

function TradeNameBanner({
  check,
  companyName,
}: {
  check: import('@/agents/runtime/types').NameCheckResult;
  companyName: string;
}) {
  const palette =
    check.status === 'likely_available'
      ? {
          wrap: 'border-accent bg-accent-soft',
          accent: 'text-accent-strong',
          heading: `الاسم "${companyName}" — متاح على الأرجح`,
        }
      : check.status === 'likely_taken'
      ? {
          wrap: 'border-danger bg-danger/5',
          accent: 'text-danger',
          heading: `الاسم "${companyName}" — يبدو محجوزاً`,
        }
      : {
          wrap: 'border-ink bg-paper-2',
          accent: 'text-ink-2',
          heading: `الاسم "${companyName}" — الفحص غير حاسم`,
        };

  return (
    <div className={`border-s-4 px-6 py-5 ${palette.wrap}`}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="eyebrow !text-[10px]">نتيجة فحص الاسم التجاري</div>
          <h2 className={`mt-1 font-display text-xl font-extrabold tracking-tight md:text-2xl ${palette.accent}`}>
            {palette.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{check.summaryAr}</p>
        </div>
        <a
          href="https://mc.gov.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-accent underline decoration-rule decoration-2 underline-offset-4 hover:decoration-accent"
        >
          افتح mc.gov.sa ↗
        </a>
      </div>

      {check.alternatives && check.alternatives.length > 0 && (
        <div className="mt-4 border-t border-rule/70 pt-3">
          <div className="text-[11px] font-mono tracking-widest text-muted">بدائل مقترحة</div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {check.alternatives.map((alt, i) => (
              <li
                key={i}
                className="border border-ink/20 bg-white px-3 py-1 text-sm font-semibold text-ink"
              >
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted">
        نتيجة استرشادية — القرار النهائي لاسم المنشأة يحدد في منصة الأعمال.
      </p>
    </div>
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
