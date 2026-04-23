/**
 * Unified project store — one model for both establishment and compliance.
 *
 * Replaces the previous split between `plan-store.ts` (establishment) and
 * `scan-store.ts` (compliance). Every chat session now produces a single
 * `Project` record; the `mode` field distinguishes which lens the
 * orchestrator + UI apply.
 *
 * Activities + A2A messages live here too, so the unified dashboard
 * (`/project/[id]`) and agent timeline (`/project/[id]/agents`) can read
 * from a single record without knowing which mode they're in.
 */

import { nanoid } from 'nanoid';
import type { Answers } from '@/agents/chat-flow';
import type {
  AgentActivity,
  AgentId,
  AgentMessage,
  ScanResult,
} from '@/agents/types';
import { AGENT_LABELS_AR } from '@/agents/types';
import type { AnalysisReport, Gap } from '@/agents/analysis-agent';
import type {
  CostSummary,
  GovEntity,
  RoadmapWeek,
  VerticalId,
} from '@/knowledge/entities';

export type ProjectMode = 'establishment' | 'compliance';
export type ProjectStatus = 'pending' | 'running' | 'complete' | 'error';

export interface RegulatoryUpdateRecord {
  forAgent: AgentId;
  summaryAr: string;
  date?: string;
  source: string;
}

export interface ProjectRecord {
  id: string;
  createdAt: number;
  mode: ProjectMode;
  status: ProjectStatus;

  /** User-typed company name (may be empty until collected). */
  companyName: string;
  /** For establishment mode; for compliance we map q1_company_type → vertical. */
  vertical: VerticalId;
  cityId?: string;
  url: string | null;

  answers: Answers;

  // Real-time streams for the unified timeline UI.
  activities: AgentActivity[];
  messages: AgentMessage[];

  // Shared outputs (both modes populate these — establishment with
  // "needed" steps, compliance with "current state").
  entities: GovEntity[];
  roadmap: RoadmapWeek[];
  costSummary: CostSummary;
  topWarnings: string[];
  regulatoryUpdates: RegulatoryUpdateRecord[];

  // Compliance-only outputs — left as null in establishment mode.
  complianceScore?: number;
  totalFineCeilingSar?: number;
  gaps?: Gap[];
  analysis?: AnalysisReport;
  scanResult?: ScanResult;

  errorMessage?: string;
}

/* ------------------------------------------------------------------------- */
/* globalThis pinned store so Next dev HMR keeps records across recompiles.  */
/* ------------------------------------------------------------------------- */

const globalForProjects = globalThis as unknown as { __daraaProjects?: Map<string, ProjectRecord> };
const PROJECTS: Map<string, ProjectRecord> =
  globalForProjects.__daraaProjects ?? (globalForProjects.__daraaProjects = new Map());
const TTL_MS = 60 * 60 * 1000;

function prune() {
  const cutoff = Date.now() - TTL_MS;
  for (const [id, p] of PROJECTS) if (p.createdAt < cutoff) PROJECTS.delete(id);
}

/* ------------------------------------------------------------------------- */
/* CRUD                                                                      */
/* ------------------------------------------------------------------------- */

export function createProject(params: {
  mode: ProjectMode;
  vertical: VerticalId;
  companyName: string;
  cityId?: string;
  url: string | null;
  answers: Answers;
}): ProjectRecord {
  prune();
  const record: ProjectRecord = {
    id: nanoid(),
    createdAt: Date.now(),
    mode: params.mode,
    status: 'pending',
    companyName: params.companyName,
    vertical: params.vertical,
    cityId: params.cityId,
    url: params.url,
    answers: params.answers,
    activities: [],
    messages: [],
    entities: [],
    roadmap: [],
    costSummary: { minSar: 0, maxSar: 0, itemCount: 0 },
    topWarnings: [],
    regulatoryUpdates: [],
  };
  PROJECTS.set(record.id, record);
  return record;
}

export function getProject(id: string): ProjectRecord | null {
  return PROJECTS.get(id) ?? null;
}

/** Mutate in place — emit helpers push into the arrays directly, so
 *  spread-replacement would orphan concurrent pushes. */
export function updateProject(id: string, patch: Partial<ProjectRecord>): ProjectRecord | null {
  const existing = PROJECTS.get(id);
  if (!existing) return null;
  Object.assign(existing, patch);
  return existing;
}

/* ------------------------------------------------------------------------- */
/* Activity + message emit helpers                                            */
/* ------------------------------------------------------------------------- */

export function emitProjectActivity(
  projectId: string,
  agent: AgentId,
  status: AgentActivity['status'],
  messageAr: string,
): void {
  const p = PROJECTS.get(projectId);
  if (!p) return;
  p.activities.push({
    seq: p.activities.length,
    kind: 'activity',
    agent,
    agentAr: AGENT_LABELS_AR[agent],
    status,
    messageAr,
    createdAt: Date.now(),
  });
}

export function sendProjectMessage(
  projectId: string,
  msg: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
): void {
  const p = PROJECTS.get(projectId);
  if (!p) return;
  p.messages.push({
    seq: p.messages.length,
    kind: 'message',
    ...msg,
    createdAt: Date.now(),
  });
}
