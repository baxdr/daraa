/**
 * Unified project orchestrator — main entry point.
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

import { runResearchAgent } from '../research-agent';
import { personalizeGaps, personalizeWarnings } from '../personalizer';
import { runAnalysis } from '../analysis-agent';
import { runOperationalAnalysis } from '../operational-analysis';
import { buildRoadmap, summariseCosts } from '@/knowledge/entities';
import { emit, send, type RunRef } from '@/lib/agent-bus';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { runAgents } from '../runtime/orchestrator-runtime';
import type { AgentContext } from '../runtime/types';
import { getAgentsForVertical } from '../specialists';
import type { ScanResult } from '../types';
import { CITY_LABELS, computeTopWarnings } from './warnings';
import { buildEntitiesFromAgents, costLabel } from './entity-builder';
import { runScanPipeline } from './scan-pipeline';

export async function runProjectOrchestrator(projectId: string): Promise<void> {
  const repos = getRepositories();
  const project = await repos.projects.findById(projectId);
  if (!project) return;
  const run: RunRef = { kind: 'project', id: projectId };
  const mode = project.mode;
  const vertical = project.vertical;
  const answers = project.answers;

  await repos.projects.update(projectId, { status: 'running' });
  const modeLabel =
    mode === 'establishment'
      ? 'التأسيس'
      : mode === 'operational_compliance'
        ? 'الامتثال التشغيلي'
        : 'الامتثال الرقمي';
  emit(run, 'orchestrator', 'started', `جاري تشغيل المتخصّصين — وضع ${modeLabel}.`);

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

    await repos.projects.update(projectId, {
      regulatoryUpdates: updates.map((u) => {
        const date = u.date;
        return {
          forAgent: u.entity,
          summaryAr: u.summaryAr,
          ...(date ? { date } : {}),
          source: u.source,
        };
      }),
    });

    /* ---------------------------------------------------------------
     * 2. Context + specialist run through the real bus.
     * --------------------------------------------------------------- */
    const cityId = answers.est2_city;
    const cityLabelAr = cityId ? CITY_LABELS[cityId] : undefined;
    const partnerCount = answers.est3_partner_count;
    const capitalSar = answers.est4_capital_sar;
    const leaseStatus = answers.est6_lease_status;
    const context: AgentContext = {
      mode,
      vertical,
      answers,
      ...(cityId ? { cityId } : {}),
      ...(cityLabelAr ? { cityLabelAr } : {}),
      ...(partnerCount ? { partnerCount } : {}),
      ...(capitalSar ? { capitalSar } : {}),
      hasForeignPartner: answers.est5_foreign_partner === 'yes',
      ...(leaseStatus ? { leaseStatus } : {}),
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
    const shouldScan =
      (mode === 'compliance' && !!project.url) ||
      (mode === 'operational_compliance' && answers.op9_has_website === 'yes' && !!project.url);
    if (shouldScan && project.url) {
      emit(run, 'scan', 'started', `جاري زيارة ${project.url}…`);
      emit(run, 'scan', 'working', '↳ فحص سياسة الخصوصية + رؤوس الأمان + أدوات التتبع + الفورمز');
      const outcome = await runScanPipeline(project.url);
      scanResult = outcome.scanResult;
      emit(
        run,
        'scan',
        'completed',
        `اكتمل الفحص — رؤوس ${outcome.scanResult.securityHeaders?.score ?? 0}٪، ${outcome.trackerCount} أدوات تتبع، ${outcome.formIssues} مخالفات فورم.`,
      );
      send(run, {
        from: 'scan',
        to: 'pdpl_nca',
        type: 'data_share',
        messageAr:
          `تسليم نتائج الفحص — سياسة: ${outcome.scanResult.privacyPolicy.found ? 'موجودة' : 'مفقودة'}، ` +
          `رؤوس: ${outcome.scanResult.securityHeaders?.score ?? 0}%، تتبع: ${outcome.trackerCount}، فورمز: ${outcome.formIssues}.`,
        payload: {
          policyFound: outcome.scanResult.privacyPolicy.found,
          headerScore: outcome.scanResult.securityHeaders?.score ?? 0,
          trackerCount: outcome.trackerCount,
          formIssueCount: outcome.formIssues,
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
            console.warn(
              '[orchestrator] personalizeGaps failed:',
              err instanceof Error ? err.message : err,
            );
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

        await repos.projects.update(projectId, {
          ...(scanResult ? { scanResult } : {}),
          analysis,
          complianceScore: analysis.complianceScore,
          totalFineCeilingSar: analysis.totalFineCeilingSar,
          gaps: analysis.gaps,
        });
      } catch (err) {
        console.error(
          '[orchestrator] runAnalysis failed:',
          err instanceof Error ? err.message : err,
        );
        emit(run, 'analysis', 'error', 'تعذّر إجراء تحليل الامتثال — عرضنا باقي النتائج.');
        await repos.projects.update(projectId, {
          ...(scanResult ? { scanResult } : {}),
          complianceScore: 0,
          totalFineCeilingSar: 0,
          gaps: [],
        });
      }
    }

    /* ---------------------------------------------------------------
     * 3b. Operational compliance — license renewal analysis for
     *     physical businesses. Deterministic, no LLM.
     * --------------------------------------------------------------- */
    if (mode === 'operational_compliance') {
      emit(run, 'analysis', 'started', 'جاري تقييم حالة الرخص والتجديدات…');
      try {
        const opReport = runOperationalAnalysis({ answers });
        emit(
          run,
          'analysis',
          'completed',
          `اكتمل التقييم — صحة الرخص ${opReport.healthScore}٪، ${opReport.gaps.length} تنبيهاً ` +
            `منها ${opReport.overdue.length} متأخرة و ${opReport.upcomingRenewals.length} قادمة.`,
        );
        send(run, {
          from: 'analysis',
          to: 'report',
          type: 'data_share',
          messageAr:
            `نتيجة تشغيلية — ${opReport.healthScore}٪ صحة الرخص، ${opReport.overdue.length} ` +
            `متأخرة، ${opReport.upcomingRenewals.length} تجديد خلال ١٨٠ يوم.`,
          payload: {
            healthScore: opReport.healthScore,
            overdueCount: opReport.overdue.length,
            upcomingCount: opReport.upcomingRenewals.length,
          },
        });
        await repos.projects.update(projectId, {
          ...(scanResult ? { scanResult } : {}),
          operationalReport: opReport,
        });
      } catch (err) {
        console.error(
          '[orchestrator] runOperationalAnalysis failed:',
          err instanceof Error ? err.message : err,
        );
        emit(run, 'analysis', 'error', 'تعذّر تقييم الرخص — عرضنا باقي النتائج.');
      }
    }

    /* ---------------------------------------------------------------
     * 4. Compile the roadmap from specialist results + warnings.
     * --------------------------------------------------------------- */
    const entities = buildEntitiesFromAgents(agents, runResult.results);
    const roadmap = buildRoadmap(entities);
    const costSummary = summariseCosts(entities);
    const rawWarnings = computeTopWarnings(mode, vertical, answers);
    const topWarnings =
      rawWarnings.length > 0 ? await personalizeWarnings(answers, rawWarnings) : rawWarnings;

    emit(
      run,
      'report',
      'completed',
      `التقرير جاهز — ${entities.length} جهة، ${roadmap.length} مراحل، ${runResult.waves} موجة.`,
    );

    await repos.projects.update(projectId, {
      status: 'complete',
      // Auto-transition: every completed project enters active_monitoring.
      // From here on, the dashboard shows the renewal-schedule view built
      // from entities + renewalPeriodAr, same for establishment and
      // compliance modes.
      phase: 'active_monitoring',
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
    await repos.projects.update(projectId, { status: 'error', errorMessage: message });
  }
}
