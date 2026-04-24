/**
 * Unified project orchestrator.
 *
 * Replaces `establishment-orchestrator.ts` and `orchestrator.ts` (which
 * ran separate pipelines). Single entry point drives both modes by
 * switching behavior inside each agent, plus post-processing compliance-
 * specific steps (scan + analysis + personalizer) when mode === compliance.
 *
 * Flow:
 *   1. Research Agent — broadcast updates to downstream specialists
 *   2. Entity specialists run in dependency waves through the AgentBus
 *   3. (compliance mode + URL) Scan + Analysis + Personalizer
 *   4. Compile the unified project record with entities, roadmap,
 *      warnings, renewals, optional score/gaps
 */

import type { Answers } from './chat-flow';
import { runResearchAgent } from './research-agent';
import { personalizeGaps, personalizeWarnings } from './personalizer';
import { runAnalysis } from './analysis-agent';
import { scanPrivacyPolicy } from '@/scanner/privacy-policy';
import { scanSecurityHeaders } from '@/scanner/security-headers';
import { scanThirdParty } from '@/scanner/third-party';
import { scanForms } from '@/scanner/forms';
import {
  buildRoadmap,
  summariseCosts,
  VERTICALS,
  type GovEntity,
  type VerticalId,
} from '@/knowledge/entities';
import { emit, send, type RunRef } from '@/lib/agent-bus';
import { getProject, updateProject } from '@/lib/project-store';
import { runAgents } from './runtime/orchestrator-runtime';
import type { AgentContext, AgentId, AgentResult } from './runtime/types';
import type { Agent } from './runtime/types';
import { getAgentsForVertical } from './specialists';
import type { ScanResult } from './types';

const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض', jeddah: 'جدة', mecca: 'مكة المكرمة',
  medina: 'المدينة المنورة', dammam: 'الدمام', khobar: 'الخُبَر', other: 'مدينة أخرى',
};

export async function runProjectOrchestrator(projectId: string): Promise<void> {
  const project = getProject(projectId);
  if (!project) return;
  const run: RunRef = { kind: 'project', id: projectId };
  const mode = project.mode;
  const vertical = project.vertical;
  const answers = project.answers;

  updateProject(projectId, { status: 'running' });
  emit(run, 'orchestrator', 'started', `جاري تشغيل المتخصّصين — وضع ${mode === 'establishment' ? 'التأسيس' : 'الامتثال'}.`);

  try {
    /* ---------------------------------------------------------------
     * 1. Research — broadcast targeted regulatory updates.
     * --------------------------------------------------------------- */
    const agents = getAgentsForVertical(vertical);
    const activeIds = agents.map((a) => a.id);

    emit(run, 'research', 'started', 'جاري البحث عن آخر التحديثات التنظيمية للمتخصّصين…');
    const updates = await runResearchAgent(run, activeIds);
    emit(
      run,
      'research',
      'completed',
      updates.length === 0
        ? 'لا توجد تحديثات جديدة تؤثر على هذه الخطة.'
        : `لقينا ${updates.length} تحديثاً — أُرسلت للمتخصصين المعنيين.`,
    );

    updateProject(projectId, {
      regulatoryUpdates: updates.map((u) => ({
        forAgent: u.entity,
        summaryAr: u.summaryAr,
        date: u.date,
        source: u.source,
      })),
    });

    /* ---------------------------------------------------------------
     * 2. Context + specialist run through the real bus.
     * --------------------------------------------------------------- */
    const context: AgentContext = {
      mode,
      vertical,
      answers,
      cityId: answers.est2_city,
      cityLabelAr: answers.est2_city ? CITY_LABELS[answers.est2_city] : undefined,
      partnerCount: answers.est3_partner_count,
      capitalSar: answers.est4_capital_sar,
      hasForeignPartner: answers.est5_foreign_partner === 'yes',
      leaseStatus: answers.est6_lease_status,
      websiteUrl: project.url,
    };

    const runResult = await runAgents(agents, context, {
      onAgentStart: (agentId, wave) => {
        emit(run, agentId, 'started', `المتخصّص بدأ — الموجة ${wave}`);
      },
      onAgentFinish: (event) => {
        if (event.result.status === 'complete') {
          const { data } = event.result;
          emit(
            run,
            event.agentId,
            'completed',
            `${data.nameSimpleAr}: ${costLabel(data.estimatedCostSar)} — ${data.estimatedTimeAr}`,
          );
        } else if (event.result.status === 'blocked') {
          emit(run, event.agentId, 'working', `محجوب: ${event.result.reason}`);
        } else {
          emit(run, event.agentId, 'error', `خطأ: ${event.result.error}`);
        }
      },
      onMessages: (messages) => {
        for (const m of messages) send(run, m);
      },
    });

    /* ---------------------------------------------------------------
     * 3. Compliance mode (and a URL) — run the external scan + rules.
     *    These are orchestrator-level pipeline steps, not agent classes,
     *    because they don't fit the inbox/dependency model cleanly.
     * --------------------------------------------------------------- */
    let scanResult: ScanResult | null = null;
    if (mode === 'compliance' && project.url) {
      emit(run, 'scan', 'started', `جاري زيارة ${project.url}…`);
      emit(run, 'scan', 'working', '↳ فحص سياسة الخصوصية + رؤوس الأمان + أدوات التتبع + الفورمز');

      // Promise.allSettled so one scanner's implementation error (not its
      // own caught errors — those already surface as `{error: ...}`) can't
      // collapse the whole phase. Each scanner has an empty-result contract
      // we fall back to if it rejects at the JS level.
      const [ppRes, shRes, tpRes, fRes] = await Promise.allSettled([
        scanPrivacyPolicy(project.url),
        scanSecurityHeaders(project.url),
        scanThirdParty(project.url),
        scanForms(project.url),
      ]);
      const privacyPolicy   = ppRes.status === 'fulfilled' ? ppRes.value : { found: false, error: 'scanner_crashed' };
      const securityHeaders = shRes.status === 'fulfilled' ? shRes.value : { httpsEnforced: false, hsts: false, contentSecurityPolicy: false, xFrameOptions: false, xContentTypeOptionsNoSniff: false, referrerPolicy: false, permissionsPolicy: false, score: 0, finalUrl: project.url, error: 'scanner_crashed' };
      const thirdParty      = tpRes.status === 'fulfilled' ? tpRes.value : { detected: [], crossBorderCount: 0, categories: { analytics: 0, advertising: 0, chat: 0, marketing: 0, session_replay: 0, other: 0 }, error: 'scanner_crashed' };
      const dataForms       = fRes.status  === 'fulfilled' ? fRes.value  : { formsFound: 0, results: [], error: 'scanner_crashed' };
      scanResult = {
        url: project.url,
        scannedAt: new Date().toISOString(),
        privacyPolicy,
        securityHeaders,
        thirdParty,
        dataForms,
      };

      const trackerCount = thirdParty.detected.length;
      const formIssues = dataForms.results.reduce((n, f) => n + f.violations.length, 0);
      emit(
        run,
        'scan',
        'completed',
        `اكتمل الفحص — رؤوس ${securityHeaders.score}٪، ${trackerCount} أدوات تتبع، ${formIssues} مخالفات فورم.`,
      );

      send(run, {
        from: 'scan',
        to: 'pdpl_nca',
        type: 'data_share',
        messageAr: `تسليم نتائج الفحص — سياسة: ${privacyPolicy.found ? 'موجودة' : 'مفقودة'}، ` +
          `رؤوس: ${securityHeaders.score}%، تتبع: ${trackerCount}، فورمز: ${formIssues}.`,
        payload: {
          policyFound: privacyPolicy.found,
          headerScore: securityHeaders.score,
          trackerCount,
          formIssueCount: formIssues,
        },
      });
    }

    if (mode === 'compliance') {
      emit(run, 'analysis', 'started', 'جاري مقارنة وضع شركتك مع القواعد…');
      try {
        const baseAnalysis = runAnalysis({ answers, scan: scanResult });
        emit(
          run,
          'analysis',
          'completed',
          `اكتمل التحليل — نسبة الامتثال ${baseAnalysis.complianceScore}٪، وعدد الفجوات ${baseAnalysis.gaps.length}.`,
        );

        let analysis = baseAnalysis;
        if (baseAnalysis.gaps.length > 0) {
          emit(run, 'analysis', 'working', 'جاري تخصيص شرح الفجوات ببيانات شركتكم…');
          try {
            analysis = { ...baseAnalysis, gaps: await personalizeGaps(answers, baseAnalysis.gaps) };
          } catch (err) {
            // Personalisation is pure polish — failure here should not lose
            // the underlying analysis. Keep the base-rule copy.
            console.warn('[orchestrator] personalizeGaps failed:', err instanceof Error ? err.message : err);
          }
        }

        send(run, {
          from: 'analysis',
          to: 'report',
          type: 'data_share',
          messageAr:
            `نتيجة نهائية — ${analysis.complianceScore}٪ التزام، ${analysis.gaps.length} فجوات، ` +
            `${analysis.totalFineCeilingSar.toLocaleString('en-US')} ريال سقف غرامات.`,
          payload: {
            complianceScore: analysis.complianceScore,
            gapCount: analysis.gaps.length,
            fineCeiling: analysis.totalFineCeilingSar,
          },
        });

        updateProject(projectId, {
          scanResult: scanResult ?? undefined,
          analysis,
          complianceScore: analysis.complianceScore,
          totalFineCeilingSar: analysis.totalFineCeilingSar,
          gaps: analysis.gaps,
        });
      } catch (err) {
        // Analysis blew up — surface the failure on the timeline but keep
        // going so the user still gets the entities + roadmap below.
        console.error('[orchestrator] runAnalysis failed:', err instanceof Error ? err.message : err);
        emit(run, 'analysis', 'error', 'تعذّر إجراء تحليل الامتثال — عرضنا باقي النتائج.');
        updateProject(projectId, {
          scanResult: scanResult ?? undefined,
          complianceScore: 0,
          totalFineCeilingSar: 0,
          gaps: [],
        });
      }
    }

    /* ---------------------------------------------------------------
     * 4. Compile the roadmap from specialist results + warnings.
     * --------------------------------------------------------------- */
    const entities = buildEntitiesFromAgents(agents, runResult.results);
    const roadmap = buildRoadmap(entities);
    const costSummary = summariseCosts(entities);
    const rawWarnings = computeTopWarnings(mode, vertical, answers);
    const topWarnings = rawWarnings.length > 0
      ? await personalizeWarnings(answers, rawWarnings)
      : rawWarnings;

    emit(
      run,
      'report',
      'completed',
      `التقرير جاهز — ${entities.length} جهة، ${roadmap.length} مراحل، ${runResult.waves} موجة.`,
    );

    updateProject(projectId, {
      status: 'complete',
      entities,
      roadmap,
      costSummary,
      topWarnings,
    });
    emit(run, 'orchestrator', 'completed', 'المشروع جاهز — بنحوّلك للداشبورد.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
    console.error('[project-orchestrator] pipeline failed:', message);
    emit(run, 'orchestrator', 'error', `حصل خطأ: ${message}`);
    updateProject(projectId, { status: 'error', errorMessage: message });
  }
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

function buildEntitiesFromAgents(
  agents: readonly Agent[],
  results: Map<AgentId, AgentResult>,
): GovEntity[] {
  const entities: GovEntity[] = [];
  let order = 1;
  for (const agent of agents) {
    const result = results.get(agent.id);
    if (!result || result.status !== 'complete') continue;
    const d = result.data;
    entities.push({
      id: d.entityId,
      nameAr: d.nameAr,
      nameSimpleAr: d.nameSimpleAr,
      explainAr: d.explainAr,
      estimatedCostSar: d.estimatedCostSar,
      estimatedTimeAr: d.estimatedTimeAr,
      order: order++,
      dependencies: [...agent.dependencies],
      criticalWarningAr: d.criticalWarningAr,
      commonMistakeAr: d.commonMistakeAr,
      renewalPeriodAr: d.renewalPeriodAr,
      officialUrl: d.officialUrl,
      requirements: d.requirements ? [...d.requirements] : undefined,
      nameCheck: d.nameCheck,
    });
  }
  return entities;
}

function costLabel(cost: { min: number; max: number }): string {
  if (cost.max === 0) return 'رسوم: مجاني';
  if (cost.min === cost.max) return `رسوم: ~${cost.max.toLocaleString('en-US')} ريال`;
  return `رسوم تقديرية: ${cost.min.toLocaleString('en-US')}–${cost.max.toLocaleString('en-US')} ريال`;
}

function computeTopWarnings(
  mode: 'establishment' | 'compliance',
  vertical: VerticalId,
  answers: Answers,
): string[] {
  const out: string[] = [];

  // Establishment-only — "don't sign the lease before verifying the activity
  // is allowed at this location" is the product's most distinctive moment.
  if (mode === 'establishment') {
    const isPhysical = vertical === 'restaurant' || vertical === 'salon';
    if (isPhysical && answers.est6_lease_status === 'not_signed') {
      out.push(
        'قبل ما توقّع عقد الإيجار — تأكّد من منصة بلدي (balady.gov.sa) إن الموقع يُرخَّص للنشاط اللي تفكّر فيه. المالك قد يوعدك شفهياً، لكن المرجع الرسمي هو منصة البلدية. وقّع بعد التحقق لتفادي خسارة الإيجار.',
      );
    }
  }

  // Compliance-mode — cross-border hosting without an explicit legal basis.
  if (mode === 'compliance' && answers.q6_data_location === 'outside') {
    out.push(
      'بياناتكم مُستضافة خارج المملكة. نظام حماية البيانات يتطلّب ضمانات إضافية لنقل البيانات عبر الحدود — لا تعتمدوا على اتفاقية الخدمة الافتراضية مع مزوّد السحابة وحدها، راجعوا شروط SDAIA.',
    );
  }

  // Vertical ignorance — unknown vertical placeholder.
  void VERTICALS[vertical];

  return out;
}
