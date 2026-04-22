import { nanoid } from 'nanoid';
import type { Answers } from '@/agents/chat-flow';
import type { AgentActivity, AgentId, AgentMessage } from '@/agents/types';
import { AGENT_LABELS_AR } from '@/agents/types';
import type {
  CostSummary,
  GovEntity,
  RoadmapWeek,
  VerticalId,
} from '@/knowledge/entities';

export type PlanStatus = 'pending' | 'running' | 'complete' | 'error';

export interface EstablishmentPlan {
  id: string;
  createdAt: number;
  status: PlanStatus;
  vertical: VerticalId;
  verticalLabelAr: string;
  verticalShipsInMvp: boolean;
  answers: Answers;
  /** Populated once the orchestrator finishes. */
  roadmap: RoadmapWeek[];
  entities: GovEntity[];
  costSummary: CostSummary;
  topWarnings: string[];
  /** Activities + A2A messages — rendered on the progress page. */
  activities: AgentActivity[];
  messages: AgentMessage[];
  errorMessage?: string;
}

const globalForPlans = globalThis as unknown as { __daraaPlans?: Map<string, EstablishmentPlan> };
const PLANS: Map<string, EstablishmentPlan> =
  globalForPlans.__daraaPlans ?? (globalForPlans.__daraaPlans = new Map());
const TTL_MS = 60 * 60 * 1000;

function prune() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, p] of PLANS) if (p.createdAt < cutoff) PLANS.delete(id);
}

export function createPlan(params: {
  vertical: VerticalId;
  verticalLabelAr: string;
  verticalShipsInMvp: boolean;
  answers: Answers;
}): EstablishmentPlan {
  prune();
  const stored: EstablishmentPlan = {
    id: nanoid(),
    createdAt: Date.now(),
    status: 'pending',
    vertical: params.vertical,
    verticalLabelAr: params.verticalLabelAr,
    verticalShipsInMvp: params.verticalShipsInMvp,
    answers: params.answers,
    roadmap: [],
    entities: [],
    costSummary: { minSar: 0, maxSar: 0, itemCount: 0 },
    topWarnings: [],
    activities: [],
    messages: [],
  };
  PLANS.set(stored.id, stored);
  return stored;
}

export function getPlan(id: string): EstablishmentPlan | null {
  return PLANS.get(id) ?? null;
}

export function updatePlan(id: string, patch: Partial<EstablishmentPlan>): EstablishmentPlan | null {
  const existing = PLANS.get(id);
  if (!existing) return null;
  // Mutate in place — see scan-store.ts for the rationale. emit*/send* helpers
  // push into the record's arrays; replacing the record would orphan those.
  Object.assign(existing, patch);
  return existing;
}

export function emitPlanActivity(
  planId: string,
  agent: AgentId,
  status: AgentActivity['status'],
  messageAr: string,
): void {
  const plan = PLANS.get(planId);
  if (!plan) return;
  plan.activities.push({
    seq: plan.activities.length,
    kind: 'activity',
    agent,
    agentAr: AGENT_LABELS_AR[agent],
    status,
    messageAr,
    createdAt: Date.now(),
  });
}

export function sendPlanMessage(
  planId: string,
  msg: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
): void {
  const plan = PLANS.get(planId);
  if (!plan) return;
  plan.messages.push({
    seq: plan.messages.length,
    kind: 'message',
    ...msg,
    createdAt: Date.now(),
  });
}
