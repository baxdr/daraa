/**
 * Project orchestrator — small-shop edition.
 *
 * Single mode (operational_compliance) post-pivot. Pipeline:
 *   1. Research Agent — broadcasts targeted regulatory updates to specialists
 *   2. Specialist agents run in dependency waves through the AgentBus
 *   3. Operational analysis — deterministic gap detection from chat answers
 *   4. Compile entities, roadmap, warnings, and the renewal calendar
 */

import { runResearchAgent } from '../research-agent';
import { runOperationalAnalysis } from '../operational-analysis';
import { buildRoadmap, summariseCosts } from '@/knowledge/entities';
import { emit, send, type RunRef } from '@/lib/agent-bus';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { runAgents } from '../runtime/orchestrator-runtime';
import type { AgentContext } from '../runtime/types';
import { getAgentsForVertical } from '../specialists';
import { CITY_LABELS, computeTopWarnings } from './warnings';
import { buildEntitiesFromAgents, costLabel } from './entity-builder';
import { computeRenewalsForProject } from '@/lib/renewals';

export async function runProjectOrchestrator(projectId: string): Promise<void> {
  const repos = getRepositories();
  const project = await repos.projects.findById(projectId);
  if (!project) return;
  const run: RunRef = { kind: 'project', id: projectId };
  const vertical = project.vertical;
  const answers = project.answers;

  await repos.projects.update(projectId, { status: 'running' });
  emit(run, 'orchestrator', 'started', 'جاري تشغيل المتخصّصين — متابعة رخص المحل.');

  try {
    /* 1. Research — broadcast targeted regulatory updates. */
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

    /* 2. Specialist run through the bus. */
    const cityId = answers.op2_city;
    const cityLabelAr = cityId ? CITY_LABELS[cityId] : undefined;
    const context: AgentContext = {
      mode: 'operational_compliance',
      vertical,
      answers,
      ...(cityId ? { cityId } : {}),
      ...(cityLabelAr ? { cityLabelAr } : {}),
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

    /* 3. Operational analysis — license renewal + infrastructure gaps. */
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
        operationalReport: opReport,
      });
    } catch (err) {
      console.error(
        '[orchestrator] runOperationalAnalysis failed:',
        err instanceof Error ? err.message : err,
      );
      emit(run, 'analysis', 'error', 'تعذّر تقييم الرخص — عرضنا باقي النتائج.');
    }

    /* 4. Compile entities, roadmap, warnings, renewal calendar. */
    const entities = buildEntitiesFromAgents(agents, runResult.results);
    const roadmap = buildRoadmap(entities);
    const costSummary = summariseCosts(entities);
    const topWarnings = computeTopWarnings(vertical, answers);
    const renewals = computeRenewalsForProject(answers, entities);

    emit(
      run,
      'report',
      'completed',
      `التقرير جاهز — ${entities.length} جهة، ${roadmap.length} مراحل، ${runResult.waves} موجة.`,
    );

    await repos.projects.update(projectId, {
      status: 'complete',
      // Auto-transition: every completed project enters active_monitoring.
      phase: 'active_monitoring',
      entities,
      roadmap,
      costSummary,
      topWarnings,
      renewals,
    });
    emit(run, 'orchestrator', 'completed', 'المشروع جاهز — بنحوّلك للداشبورد.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
    console.error('[project-orchestrator] pipeline failed:', message);
    emit(run, 'orchestrator', 'error', `حصل خطأ: ${message}`);
    await repos.projects.update(projectId, { status: 'error', errorMessage: message });
  }
}
