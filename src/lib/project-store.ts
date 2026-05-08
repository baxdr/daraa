/**
 * Unified project store — one model for both establishment and compliance.
 *
 * Persistence: this module keeps an in-memory `Map<id, ProjectRecord>` as
 * the authoritative live state, and delegates to `project-fs.ts` for
 * durability. Every mutation (create / update / activity-emit / message-
 * send) calls `markDirty(record)` which schedules a debounced atomic write
 * to `data/projects/<id>.json`. Terminal state transitions use `flushNow`.
 *
 * This replaces the old in-memory-only design — a hackathon-safe swap for
 * Supabase that survives server restarts and HMR, and can be drop-in-
 * replaced later by swapping the fs calls with DB calls.
 */

import { nanoid } from 'nanoid';
import type { Answers } from '@/agents/chat-flow';
import type { AgentActivity, AgentId, AgentMessage, ScanResult } from '@/agents/types';
import { AGENT_LABELS_AR } from '@/agents/types';
import type { AnalysisReport, Gap } from '@/agents/analysis-agent';
import type { OperationalReport } from '@/agents/operational-analysis';
import type { CostSummary, GovEntity, RoadmapWeek, VerticalId } from '@/knowledge/entities';
import {
  scanAllProjectsSync,
  markDirty as fsMarkDirty,
  flushNow as fsFlushNow,
} from './project-fs';

export type ProjectMode = 'establishment' | 'compliance' | 'operational_compliance';
export type ProjectStatus = 'pending' | 'running' | 'complete' | 'error';
/** After the initial pipeline completes, every project enters the
 *  `active_monitoring` phase — a continuous view of license renewals and
 *  alerts. `roadmap` is the initial construction phase; `active_monitoring`
 *  is the ongoing steady state that starts automatically. */
export type ProjectPhase = 'roadmap' | 'active_monitoring';

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
  /** Lifecycle phase — 'roadmap' during initial construction, flips to
   *  'active_monitoring' once the orchestrator finishes. Compliance and
   *  operational-compliance projects skip straight to active_monitoring. */
  phase: ProjectPhase;

  /** Authenticated owner. null/undefined = anonymous (link-shareable).
   *  Set by /auth/callback when a user claims the project, or at creation
   *  time when /chat starts under an authenticated session. */
  ownerUserId?: string;
  /** Workspace this project belongs to. For owned projects, the user's
   *  primary workspace. For demo projects, the system workspace. */
  workspaceId?: string;

  /** User email for return-experience lookup. Optional. */
  email?: string;

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

  // Digital-compliance-only outputs — left as null in establishment mode.
  complianceScore?: number;
  totalFineCeilingSar?: number;
  gaps?: Gap[];
  analysis?: AnalysisReport;
  scanResult?: ScanResult;

  // Operational-compliance output — populated when mode is operational.
  operationalReport?: OperationalReport;

  errorMessage?: string;
}

/* ------------------------------------------------------------------------- */
/* In-memory store + eager disk boot                                         */
/* ------------------------------------------------------------------------- */

const globalForProjects = globalThis as unknown as { __daraaProjects?: Map<string, ProjectRecord> };

function initStore(): Map<string, ProjectRecord> {
  if (globalForProjects.__daraaProjects) return globalForProjects.__daraaProjects;
  // First load in this process — hydrate from disk.
  const map = scanAllProjectsSync();
  globalForProjects.__daraaProjects = map;
  return map;
}

const PROJECTS: Map<string, ProjectRecord> = initStore();

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
  email?: string;
  ownerUserId?: string;
  workspaceId?: string;
}): ProjectRecord {
  const record: ProjectRecord = {
    id: nanoid(),
    createdAt: Date.now(),
    mode: params.mode,
    status: 'pending',
    phase: 'roadmap',
    ...(params.ownerUserId !== undefined ? { ownerUserId: params.ownerUserId } : {}),
    ...(params.workspaceId !== undefined ? { workspaceId: params.workspaceId } : {}),
    ...(params.email !== undefined ? { email: params.email } : {}),
    companyName: params.companyName,
    vertical: params.vertical,
    ...(params.cityId !== undefined ? { cityId: params.cityId } : {}),
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
  fsMarkDirty(record);
  return record;
}

export function getProject(id: string): ProjectRecord | null {
  return PROJECTS.get(id) ?? null;
}

/** Mutate in place. Terminal status transitions (complete / error) flush
 *  synchronously so the UI can reload without racing the write. */
export function updateProject(id: string, patch: Partial<ProjectRecord>): ProjectRecord | null {
  const existing = PROJECTS.get(id);
  if (!existing) return null;
  Object.assign(existing, patch);
  if (patch.status === 'complete' || patch.status === 'error') {
    // Fire-and-forget — callers don't await durability. The in-memory copy
    // is already canonical.
    void fsFlushNow(existing);
  } else {
    fsMarkDirty(existing);
  }
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
  fsMarkDirty(p);
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
  fsMarkDirty(p);
}

/* ------------------------------------------------------------------------- */
/* Return-by-email                                                           */
/* ------------------------------------------------------------------------- */

/**
 * Look up all projects for a given email (normalised by lowercasing and
 * trimming upstream). Iterates the in-memory Map — ~O(n) where n is the
 * number of projects, which is fine for a hackathon.
 */
export function getProjectsByEmail(email: string): ProjectRecord[] {
  const normalized = email.trim().toLowerCase();
  if (!normalized) return [];
  const matches: ProjectRecord[] = [];
  for (const p of PROJECTS.values()) {
    if (p.email && p.email.trim().toLowerCase() === normalized) matches.push(p);
  }
  return matches.sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Look up all projects owned by a given userId. Used by /account to render
 * the user's dashboard. Demo projects (id starting with `demo-`) are
 * deliberately excluded so they don't pollute every user's list.
 */
export function getProjectsByOwner(ownerUserId: string): ProjectRecord[] {
  const trimmed = ownerUserId.trim();
  if (!trimmed) return [];
  const matches: ProjectRecord[] = [];
  for (const p of PROJECTS.values()) {
    if (p.ownerUserId === trimmed && !p.id.startsWith('demo-')) matches.push(p);
  }
  return matches.sort((a, b) => b.createdAt - a.createdAt);
}
