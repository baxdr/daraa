/**
 * Agent Bus — A2A message passing over the unified project store.
 *
 * The messages here are deterministic: sender and recipient are fixed at
 * orchestrator-design time from the entity dependency graph (e.g.
 * civil_defense → municipality). Don't oversell as emergent.
 *
 * On serverless (Vercel), the in-memory PROJECTS map only lives on the
 * lambda running the orchestrator. The polling client will usually hit a
 * different lambda, so each emit/send schedules a real-time upsert to the
 * persistence layer (Supabase) via the repository's appendActivity /
 * appendMessage methods. Callers do not await these writes — they are
 * tracked per-run and `flushBus(run)` awaits the queue when the
 * orchestrator finishes.
 */

import type { AgentMessage, AgentActivity, AgentId } from '@/agents/types';
import { emitProjectActivity, sendProjectMessage, getProject } from './project-store';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';

export type RunKind = 'project';

export interface RunRef {
  kind: RunKind;
  id: string;
}

// Per-run queue of in-flight Supabase upserts. We chain via .then so writes
// for the same project remain ordered (the upsert sends the full record, so
// out-of-order writes would briefly drop the latest activity).
const PENDING: Map<string, Promise<void>> = new Map();

function schedulePersist(runId: string, work: () => Promise<unknown>): void {
  const tail = PENDING.get(runId) ?? Promise.resolve();
  const next = tail
    .catch(() => undefined)
    .then(async () => {
      try {
        await work();
      } catch (err) {
        // Persistence failures are logged but do not crash the orchestrator —
        // the in-memory copy is still authoritative for the current run.
        console.error('[agent-bus] persist failed:', err instanceof Error ? err.message : err);
      }
    });
  PENDING.set(runId, next);
}

/**
 * Emit a status activity for a single agent. This is the "I'm doing X" feed.
 *
 * Writes to in-memory immediately so the orchestrator's own reads are
 * consistent, then schedules a fire-and-forget Supabase upsert so the
 * polling client can see the activity from any lambda instance.
 */
export function emit(
  run: RunRef,
  agent: AgentId,
  status: AgentActivity['status'],
  messageAr: string,
): void {
  emitProjectActivity(run.id, agent, status, messageAr);
  const repos = getRepositories();
  // Repo's appendActivity / appendMessage would double-push to memory; use
  // flush(id) which only upserts the current in-memory record.
  schedulePersist(run.id, () => repos.projects.flush(run.id));
}

/**
 * Send an A2A message. `to: 'ALL'` broadcasts to every agent on the bus.
 */
export function send(run: RunRef, msg: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>): void {
  sendProjectMessage(run.id, msg);
  const repos = getRepositories();
  schedulePersist(run.id, () => repos.projects.flush(run.id));
}

/**
 * Convenience: send a dependency-type A2A message. Used at entity handoffs
 * (e.g. "civil_defense: done → municipality: I'm ready").
 */
export function handoff(
  run: RunRef,
  from: AgentId,
  to: AgentId | 'ALL',
  messageAr: string,
  type: AgentMessage['type'] = 'dependency',
  payload?: Record<string, unknown>,
): void {
  send(run, { from, to, type, messageAr, ...(payload ? { payload } : {}) });
}

export function loadMessages(run: RunRef): AgentMessage[] {
  return getProject(run.id)?.messages ?? [];
}

export function loadActivities(run: RunRef): AgentActivity[] {
  return getProject(run.id)?.activities ?? [];
}

/**
 * Await all in-flight persistence writes for a run. Call at the end of the
 * orchestrator pipeline (after the terminal update) to ensure no activity
 * lags behind when the lambda is reaped.
 */
export async function flushBus(run: RunRef): Promise<void> {
  const tail = PENDING.get(run.id);
  if (!tail) return;
  PENDING.delete(run.id);
  await tail.catch(() => undefined);
}
