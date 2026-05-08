/**
 * Compose the GovEntity[] roadmap from the orchestrator's specialist results.
 * Pure helper — no I/O.
 */

import { formatRenewalAr, type GovEntity } from '@/knowledge/entities';
import type { Agent, AgentResult } from '../runtime/types';
import type { AgentId } from '../runtime/types';

export function buildEntitiesFromAgents(
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
      renewalMonths: d.renewalMonths,
      renewalPeriodAr: d.renewalPeriodAr ?? formatRenewalAr(d.renewalMonths),
      ...(d.criticalWarningAr ? { criticalWarningAr: d.criticalWarningAr } : {}),
      ...(d.commonMistakeAr ? { commonMistakeAr: d.commonMistakeAr } : {}),
      ...(d.officialUrl ? { officialUrl: d.officialUrl } : {}),
      ...(d.requirements ? { requirements: [...d.requirements] } : {}),
      ...(d.nameCheck ? { nameCheck: d.nameCheck } : {}),
    });
  }
  return entities;
}

export function costLabel(cost: { min: number; max: number }): string {
  if (cost.max === 0) return 'رسوم: مجاني';
  if (cost.min === cost.max) return `رسوم: ~${cost.max.toLocaleString('en-US')} ريال`;
  return `رسوم تقديرية: ${cost.min.toLocaleString('en-US')}–${cost.max.toLocaleString('en-US')} ريال`;
}
