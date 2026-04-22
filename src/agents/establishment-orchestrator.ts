/**
 * Establishment-path orchestrator.
 *
 * Fire-and-forget from /api/establishment/resolve. Walks the entity
 * dependency graph in entities.ts in order (mci → civil_defense → municipality
 * → sfda → mohr_gosi → zatca) and emits A2A messages at each handoff.
 *
 * The message routing is deterministic — who-sends-what-to-whom is derived
 * from the dependency graph, not emergent. The protocol is real (sender
 * names the recipient by id; receiver acks when applicable), but don't
 * sell this as agent autonomy.
 */

import type { Answers } from './chat-flow';
import { runResearchAgent } from './research-agent';
import { personalizeWarnings } from './personalizer';
import {
  VERTICALS,
  ALWAYS_REQUIRED,
  buildRoadmap,
  resolveEntities,
  summariseCosts,
  type GovEntity,
  type VerticalId,
} from '@/knowledge/entities';
import type { AgentId } from './types';
import { emit, send, type RunRef } from '@/lib/agent-bus';
import { getPlan, updatePlan } from '@/lib/plan-store';

/** Map entity.id → AgentId used on the bus. */
const ENTITY_TO_AGENT: Record<string, AgentId> = {
  mci:            'mci',
  zatca:          'zatca',
  mol:            'mohr_gosi',
  gosi:           'mohr_gosi',
  civil_defense:  'civil_defense',
  municipality:   'municipality',
  sfda:           'sfda',
  pdpl_readiness: 'pdpl_nca',
  maroof:         'mci', // maroof is under MCI
};

function agentFor(entityId: string): AgentId {
  return ENTITY_TO_AGENT[entityId] ?? 'mci';
}

/**
 * Pick the set of entity-specialist agents that will actually "speak" given
 * the vertical — used as the Research Agent's targeting list.
 */
function activeAgentsForPlan(entities: GovEntity[]): AgentId[] {
  const set = new Set<AgentId>();
  for (const e of entities) set.add(agentFor(e.id));
  return Array.from(set);
}

export async function runEstablishmentOrchestrator(planId: string): Promise<void> {
  const plan = getPlan(planId);
  if (!plan) return;
  const run: RunRef = { kind: 'plan', id: planId };
  const vertical: VerticalId = plan.vertical;
  const answers: Answers = plan.answers;
  const shipsInMvp = plan.verticalShipsInMvp;

  updatePlan(planId, { status: 'running' });
  emit(run, 'orchestrator', 'started', 'جاري التنسيق بين متخصّصي الجهات…');

  try {
    // 1. Entity list (ALWAYS_REQUIRED + vertical-specific)
    const entities = shipsInMvp ? resolveEntities(vertical) : [...ALWAYS_REQUIRED];
    const activeAgents = activeAgentsForPlan(entities);

    // 2. Research Agent — pull recent updates for the specialists we'll run.
    emit(run, 'research', 'started', 'جاري البحث عن آخر التحديثات التنظيمية لهذه الجهات…');
    const updates = await runResearchAgent(run, activeAgents);
    emit(
      run,
      'research',
      'completed',
      updates.length === 0
        ? 'لا توجد تحديثات جديدة تؤثر على هذه الخطة.'
        : `لقينا ${updates.length} تحديثاً — أُرسلت للمتخصصين المعنيين.`,
    );

    // 3. Walk the entity list in dependency order, emitting handoffs.
    const completedIds = new Set<string>();
    const label = VERTICALS[vertical].labelAr;

    for (const entity of entities) {
      const agent = agentFor(entity.id);

      // If dependencies aren't all done, emit a "waiting" status.
      const unmet = entity.dependencies.filter((d) => !completedIds.has(d));
      if (unmet.length > 0) {
        // Send a dependency message from this agent back to the dependency.
        for (const dep of unmet) {
          send(run, {
            from: agent,
            to: agentFor(dep),
            type: 'dependency',
            messageAr: `أحتاج إنجازك قبل ما أبدأ — ${entity.nameSimpleAr} يعتمد على ${dep === 'mci' ? 'السجل التجاري' : dep === 'civil_defense' ? 'شهادة السلامة' : 'خطوتك'}.`,
          });
        }
        emit(run, agent, 'working', `بانتظار الاعتماد من ${unmet.map(prettifyDep).join('، ')}…`);
      }

      // "Run" the specialist — compile requirements + warnings.
      emit(run, agent, 'started', `${entity.nameSimpleAr} — جاري تحديد المتطلبات…`);

      // Specialist emits findings (cost range, any critical warning).
      if (entity.criticalWarningAr) {
        emit(run, agent, 'working', `⚠️ تنبيه: ${entity.criticalWarningAr.slice(0, 120)}…`);
      }

      emit(
        run,
        agent,
        'completed',
        `${entity.nameSimpleAr}: ${costLabel(entity)} — ${entity.estimatedTimeAr}.`,
      );

      // A2A: after completing, broadcast to the next in line where relevant.
      if (entity.id === 'mci') {
        send(run, {
          from: agent,
          to: 'ALL',
          type: 'data_share',
          messageAr: 'السجل التجاري جاهز — تقدرون تعتمدون على رقم السجل في طلباتكم.',
          payload: { entityType: recommendEntityType(answers) },
        });
      }
      if (entity.id === 'civil_defense') {
        send(run, {
          from: 'civil_defense',
          to: 'municipality',
          type: 'dependency',
          messageAr: 'شهادة السلامة اكتملت — الحين تقدر تبدأ رخصة البلدية.',
        });
      }
      if (entity.id === 'municipality') {
        send(run, {
          from: 'municipality',
          to: 'sfda',
          type: 'dependency',
          messageAr: 'رخصة البلدية جاهزة — تقدر تطلب ترخيص الغذاء.',
        });
      }
      // mol → gosi is internally the same AgentId ('mohr_gosi') — the
      // specialist tracks both in one module — so there's no A2A to emit.

      completedIds.add(entity.id);
    }

    // Sanity: every entity should have completed. If not, the dependency
    // graph is malformed (e.g. a future typo in entities.ts) and the loop
    // above silently failed to progress past an unsatisfiable dep.
    if (completedIds.size !== entities.length) {
      const missing = entities.filter((e) => !completedIds.has(e.id)).map((e) => e.nameSimpleAr).join('، ');
      throw new Error(`تعذّر إكمال الجدول — تبعيات غير مُحلَّة: ${missing}`);
    }

    // 4. Report agent compiles the final plan artifacts.
    emit(run, 'report', 'started', 'تجميع خريطة الطريق والتكاليف…');
    const roadmap = buildRoadmap(entities);
    const costSummary = summariseCosts(entities);
    const rawWarnings = computeTopWarnings(vertical, answers);
    const topWarnings = rawWarnings.length > 0
      ? await personalizeWarnings(answers, rawWarnings)
      : rawWarnings;
    emit(
      run,
      'report',
      'completed',
      `الخريطة جاهزة — ${entities.length} جهة، ${roadmap.length} مراحل.`,
    );

    updatePlan(planId, {
      status: 'complete',
      entities,
      roadmap,
      costSummary,
      topWarnings,
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

function costLabel(e: GovEntity): string {
  if (e.estimatedCostSar.max === 0) return 'رسوم: مجاني';
  if (e.estimatedCostSar.min === e.estimatedCostSar.max) {
    return `رسوم: ~${e.estimatedCostSar.max.toLocaleString('en-US')} ريال`;
  }
  return `رسوم تقديرية: ${e.estimatedCostSar.min.toLocaleString('en-US')}–${e.estimatedCostSar.max.toLocaleString('en-US')} ريال`;
}

function prettifyDep(id: string): string {
  switch (id) {
    case 'mci':           return 'متخصّص التجارة';
    case 'civil_defense': return 'متخصّص الدفاع المدني';
    case 'municipality':  return 'متخصّص البلدية';
    case 'mol':           return 'متخصّص الموارد البشرية';
    default:              return id;
  }
}

function recommendEntityType(answers: Answers): string {
  const partners = answers.est3_partner_count ?? 1;
  const capital = answers.est4_capital_sar ?? 0;
  const foreign = answers.est5_foreign_partner === 'yes';
  if (partners === 1 && !foreign && capital < 500_000) return 'مؤسسة فردية';
  if (partners === 1) return 'شركة شخص واحد (ذ.م.م)';
  return 'شركة ذات مسؤولية محدودة (ذ.م.م)';
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
