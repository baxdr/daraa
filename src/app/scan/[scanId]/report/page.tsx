import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getScan } from '@/lib/scan-store';
import { ScoreRing } from '@/components/score-ring';
import { GapCard } from '@/components/gap-card';
import { NumberTicker } from '@/components/number-ticker';
import { DocumentsSection } from '@/components/documents-section';
import { LegalDisclaimer } from '@/components/legal-disclaimer';
import type { DocumentKind } from '@/agents/document-agent';
import type { Gap } from '@/agents/analysis-agent';
import type { Answers } from '@/agents/chat-flow';

export const dynamic = 'force-dynamic';

export default function ReportPage({ params }: { params: { scanId: string } }) {
  const scan = getScan(params.scanId);
  if (!scan) notFound();
  if (scan.status !== 'complete' || !scan.analysis) {
    return <NotReadyState scanId={scan.id} status={scan.status} />;
  }

  const { analysis } = scan;
  const scoreSublabel =
    analysis.complianceScore >= 75
      ? 'وضعك جيد. في نقاط يمكن تحسينها، لكن المخاطر المباشرة محدودة.'
      : analysis.complianceScore >= 50
        ? 'في مخاطر متوسطة. القائمة أدناه مرتّبة حسب الأولوية.'
        : 'في فجوات حرجة ينبغي معالجتها قبل أي تفتيش.';

  return (
    <main className="mx-auto max-w-4xl px-6 py-10 md:px-10 md:py-16">
      {/* Masthead */}
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="eyebrow">تقرير الامتثال</span>
          <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
            {scan.url ? 'الموقع المفحوص' : 'التقرير المبني على إجاباتك'}
          </h1>
          {scan.url && (
            <p
              dir="ltr"
              className="mt-2 inline-block font-mono text-sm text-ink-2 border-b border-rule pb-0.5"
            >
              {scan.url}
            </p>
          )}
        </div>
        <Link
          href="/"
          className="text-xs text-muted underline decoration-rule decoration-2 underline-offset-4 hover:text-ink"
        >
          فحص جديد
        </Link>
      </header>

      <div className="rule-ink mb-10" />

      {/* Hero summary: score (left in LTR = leading-edge for RTL attention) + fine statement */}
      <section className="grid gap-10 md:grid-cols-2 md:gap-16">
        <div>
          <ScoreRing
            score={analysis.complianceScore}
            label="نسبة الامتثال"
            sublabel={scoreSublabel}
          />
        </div>
        <div className="border-s-2 border-ink md:ps-8">
          <div className="eyebrow">الغرامة القصوى الممكنة</div>
          <div
            className="mt-3 font-display text-5xl font-extrabold leading-none tabular-nums tracking-tighter text-danger sm:text-6xl md:text-7xl"
            style={{ wordBreak: 'break-word' }}
          >
            <NumberTicker
              target={analysis.totalFineCeilingSar}
              ariaLabel={`الغرامة القصوى الممكنة: ${analysis.totalFineCeilingSar.toLocaleString('en-US')} ريال سعودي`}
            />
          </div>
          <div className="mt-2 font-display text-lg font-extrabold tracking-tight text-muted">
            ريال سعودي
          </div>
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-ink-2">
            سقف نظامي — مجموع الحد الأقصى للغرامات على الفجوات المؤكدة. أغلبها
            يُتفادى بخطوات بسيطة مذكورة أدناه.
          </p>
        </div>
      </section>

      {/* Degradation banners */}
      {(analysis.scanSkipped || analysis.degradedMode) && (
        <div className="mt-10 flex items-start gap-3 border-s-2 border-warn bg-warn-soft/60 px-4 py-3 text-sm text-ink">
          <span className="mt-0.5 font-mono text-xs tracking-widest text-warn-strong">ملاحظة</span>
          <span>
            {analysis.scanSkipped
              ? 'لم يتم فحص موقع. بعض القواعد التي تعتمد على المحتوى المنشور غير مؤكدة — أضف الرابط للحصول على تقرير أدق.'
              : 'تعذّر التحليل العميق لمحتوى الموقع (مفتاح الـ AI غير مُعدّ). النتائج معتمدة على الإشارات السطحية.'}
          </span>
        </div>
      )}

      {/* Gaps section */}
      <section className="mt-16">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            الفجوات المكتشفة
          </h2>
          <span className="font-mono text-xs tabular-nums text-muted">
            {analysis.gaps.length.toString().padStart(2, '0')} / {analysis.applicableRuleCount.toString().padStart(2, '0')}
          </span>
        </div>
        <div className="rule mb-6" />
        {analysis.gaps.length === 0 ? (
          <div className="border border-accent/20 bg-accent-soft px-6 py-8 text-center">
            <h3 className="font-display text-2xl font-extrabold text-accent-strong">
              ما لقينا فجوات.
            </h3>
            <p className="mt-3 text-sm text-ink-2">
              استمر في مراجعة التحديثات التنظيمية — الأنظمة تتغيّر، وسنشعرك بأي جديد.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {analysis.gaps.map((gap, i) => (
              <GapCard key={gap.id} gap={gap} scanId={scan.id} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Compliant items */}
      {analysis.compliantItems.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              نقاط الالتزام
            </h2>
            <span className="font-mono text-xs tabular-nums text-muted">
              {analysis.compliantItems.length.toString().padStart(2, '0')}
            </span>
          </div>
          <div className="rule mb-6" />
          <ul className="grid gap-2 sm:grid-cols-2">
            {analysis.compliantItems.map((item) => (
              <li
                key={item.ruleId}
                className="flex items-start gap-3 border border-rule bg-white px-4 py-3 text-sm text-ink"
              >
                <span
                  aria-hidden
                  className="mt-1 h-4 w-1 bg-accent shrink-0"
                />
                <span>{item.titleAr}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Remediation plan */}
      {analysis.remediationPlan.length > 0 && (
        <section className="mt-16">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
              خطة الإصلاح
            </h2>
            <span className="font-mono text-xs tabular-nums text-muted">
              {analysis.remediationPlan.length} مراحل
            </span>
          </div>
          <div className="rule mb-6" />
          <div className="space-y-8">
            {analysis.remediationPlan.map((week, i) => (
              <div key={i} className="grid grid-cols-[auto_1fr] gap-x-6 md:gap-x-10">
                <div className="font-display text-3xl font-extrabold tabular-nums leading-none text-accent md:text-4xl">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div>
                  <div className="eyebrow">{week.window}</div>
                  <ul className="mt-3 space-y-2 text-sm text-ink">
                    {week.tasks.map((t, j) => (
                      <li key={j} className="flex items-start gap-3 border-b border-rule/70 pb-2 last:border-b-0">
                        <span className="mt-2 h-1 w-3 shrink-0 bg-ink" aria-hidden />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <DocumentsSection
        scanId={scan.id}
        recommendations={buildRecommendations(scan.answers, analysis.gaps)}
      />

      <LegalDisclaimer />
    </main>
  );
}

/* Decide which docs to feature based on gaps + answers. */
function buildRecommendations(
  answers: Answers,
  gaps: Gap[],
): Array<{ kind: DocumentKind; priorityAr: string; whyAr: string }> {
  const recs: Array<{ kind: DocumentKind; priorityAr: string; whyAr: string }> = [];

  const hasPrivacyPolicyGap = gaps.some((g) => g.ruleId.startsWith('pdpl_') &&
    ['pdpl_privacy_policy_published','pdpl_arabic_available','pdpl_purpose_stated','pdpl_retention_stated','pdpl_cross_border_disclosed','pdpl_third_party_disclosed','pdpl_trackers_disclosed'].includes(g.ruleId));
  const hasDpoGap = gaps.some((g) => g.ruleId === 'pdpl_dpo_required');
  const processesData = answers.q3_processes_personal_data === 'yes';

  if (hasPrivacyPolicyGap || processesData) {
    recs.push({
      kind: 'privacy_policy',
      priorityAr: hasPrivacyPolicyGap ? 'ضروري' : 'موصى به',
      whyAr: hasPrivacyPolicyGap
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
      whyAr: 'سجل إلزامي يُقدَّم لـ SDAIA عند التفتيش. يوثّق كل نشاط تعالج فيه بيانات شخصية.',
    });
    recs.push({
      kind: 'incident_response',
      priorityAr: 'موصى به',
      whyAr: 'إجراء جاهز يحدد وش تسوي لو حدث اختراق — بما في ذلك البلاغ لـ SDAIA خلال ٧٢ ساعة.',
    });
  }

  return recs;
}

function NotReadyState({ scanId, status }: { scanId: string; status: string }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <span className="eyebrow">{status === 'error' ? 'خطأ' : 'قيد التحضير'}</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
        {status === 'error' ? 'صار خطأ أثناء الفحص' : 'التقرير لم يكتمل بعد'}
      </h1>
      <p className="mt-3 font-mono text-xs text-muted">
        الحالة الحالية: <code dir="ltr">{status}</code>
      </p>
      <Link href={`/scan/${scanId}`} className="btn-outline mt-8 inline-flex">
        العودة للشاشة السابقة
      </Link>
    </main>
  );
}
