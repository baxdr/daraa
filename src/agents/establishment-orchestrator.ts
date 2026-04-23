/**
 * Establishment-path orchestrator — now driven by the real agent runtime.
 *
 * Before this rewrite, "specialists" were plain objects in a for-loop and
 * A2A messages were hardcoded if-branches. Now:
 *
 *   1. getAgentsForVertical(v) returns a fresh set of class instances.
 *   2. runAgents(agents, context, hooks) runs them in dependency-ordered
 *      waves — Municipality literally waits in a 'blocked' state until
 *      Civil Defense's outbox message lands in its inbox.
 *   3. Every message delivered through the bus is mirrored to the
 *      plan-store so the UI timeline shows real agent dialogue.
 *
 * See src/agents/runtime/ for the bus + orchestrator runtime, and
 * src/agents/specialists/ for per-regulator classes.
 */

import type { Answers } from './chat-flow';
import { runResearchAgent } from './research-agent';
import { personalizeWarnings } from './personalizer';
import {
  buildRoadmap,
  summariseCosts,
  VERTICALS,
  type GovEntity,
  type VerticalId,
} from '@/knowledge/entities';
import { emit, send, type RunRef } from '@/lib/agent-bus';
import { getPlan, updatePlan } from '@/lib/plan-store';
import { runAgents } from './runtime/orchestrator-runtime';
import type { AgentContext, AgentId, AgentResult } from './runtime/types';
import { getAgentsForVertical } from './specialists';

const CITY_LABELS: Record<string, string> = {
  riyadh: 'الرياض', jeddah: 'جدة', mecca: 'مكة المكرمة',
  medina: 'المدينة المنورة', dammam: 'الدمام', khobar: 'الخُبَر', other: 'مدينة أخرى',
};

export async function runEstablishmentOrchestrator(planId: string): Promise<void> {
  const plan = getPlan(planId);
  if (!plan) return;
  const run: RunRef = { kind: 'plan', id: planId };
  const vertical: VerticalId = plan.vertical;
  const answers: Answers = plan.answers;

  updatePlan(planId, { status: 'running' });
  emit(run, 'orchestrator', 'started', 'جاري استدعاء المتخصّصين وتشغيل حافلة الرسائل…');

  try {
    /* 1. Research Agent — runs outside the agent bus (upstream concern). */
    const agents = getAgentsForVertical(vertical);
    const activeIds = agents.map((a) => a.id);

    emit(run, 'research', 'started', 'جاري البحث عن آخر التحديثات التنظيمية لهذه الجهات…');
    const updates = await runResearchAgent(run, activeIds);
    emit(
      run,
      'research',
      'completed',
      updates.length === 0
        ? 'لا توجد تحديثات جديدة تؤثر على هذه الخطة.'
        : `لقينا ${updates.length} تحديثاً — أُرسلت للمتخصصين المعنيين.`,
    );

    /* 2. Build the context that every specialist gets. */
    const context: AgentContext = {
      vertical,
      answers,
      cityId: answers.est2_city,
      cityLabelAr: answers.est2_city ? CITY_LABELS[answers.est2_city] : undefined,
      partnerCount: answers.est3_partner_count,
      capitalSar: answers.est4_capital_sar,
      hasForeignPartner: answers.est5_foreign_partner === 'yes',
      leaseStatus: answers.est6_lease_status,
    };

    /* 3. Run the real multi-agent pipeline. Every activity + message
     *    flows through the hooks below into the plan-store so the UI
     *    timeline reflects what actually happened. */
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

    /* 4. Assemble the roadmap from agent results (NOT from static data).
     *    Preserve each agent's declared deps so buildRoadmap can group the
     *    entities by dependency depth (= wave number in practice). */
    const entities = buildEntitiesFromAgents(agents, runResult.results);
    const roadmap = buildRoadmap(entities);
    const costSummary = summariseCosts(entities);

    const topWarnings = await personalizeWarnings(answers, computeTopWarnings(vertical, answers));

    emit(
      run,
      'report',
      'completed',
      `الخريطة جاهزة — ${entities.length} جهة، ${roadmap.length} مراحل، ${runResult.waves} موجة تشغيل.`,
    );

    updatePlan(planId, {
      status: 'complete',
      entities,
      roadmap,
      costSummary,
      topWarnings,
      // Keep the vertical metadata in sync with the chat answers.
      verticalLabelAr: VERTICALS[vertical].labelAr,
    });
    emit(run, 'orchestrator', 'completed', 'خريطة الطريق جاهزة — بنحوّلك لها.');
  } catch (err) {
    const message = err instanceof Error ? err.message : 'خطأ غير متوقع';
    console.error('[establishment-orchestrator] pipeline failed:', message);
    emit(run, 'orchestrator', 'error', `حصل خطأ: ${message}`);
    updatePlan(planId, { status: 'error', errorMessage: message });
  }
}

/* ------------------------------------------------------------------------- */
/* Transform agent results → GovEntity[] (what the roadmap UI already knows) */
/* ------------------------------------------------------------------------- */

function buildEntitiesFromAgents(
  agents: readonly import('./runtime/types').Agent[],
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
      // Preserve the agent's declared dependencies so buildRoadmap can
      // group entities by dependency depth — this is what gives the UI
      // its weekly phases.
      dependencies: [...agent.dependencies],
      criticalWarningAr: d.criticalWarningAr,
      commonMistakeAr: d.commonMistakeAr,
      renewalPeriodAr: d.renewalPeriodAr,
      officialUrl: d.officialUrl,
    });
  }
  return entities;
}

/* ------------------------------------------------------------------------- */

function costLabel(cost: { min: number; max: number }): string {
  if (cost.max === 0) return 'رسوم: مجاني';
  if (cost.min === cost.max) return `رسوم: ~${cost.max.toLocaleString('en-US')} ريال`;
  return `رسوم تقديرية: ${cost.min.toLocaleString('en-US')}–${cost.max.toLocaleString('en-US')} ريال`;
}

function computeTopWarnings(vertical: VerticalId, answers: Answers): string[] {
  const out: string[] = [];
  const isPhysical = vertical === 'restaurant' || vertical === 'salon';
  if (isPhysical && answers.est6_lease_status === 'not_signed') {
    out.push(
      'قبل ما توقّع عقد الإيجار — تأكّد من منصة بلدي (balady.gov.sa) إن الموقع يُرخَّص للنشاط اللي تفكّر فيه. المالك قد يوعدك شفهياً، لكن المرجع الرسمي هو منصة البلدية. وقّع بعد التحقق لتفادي خسارة الإيجار.',
    );
  }
  return out;
}
