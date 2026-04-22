/**
 * Agent Bus — A2A message passing across scans and plans.
 *
 * The messages here are deterministic: sender and recipient are fixed at
 * orchestrator-design time from the entity dependency graph (e.g.
 * civil_defense → municipality). Don't oversell as emergent.
 *
 * Thin facade over scan-store and plan-store so orchestrator code reads
 * naturally: `send(run, { from, to, ... })`.
 */

import type { AgentMessage, AgentActivity, AgentId } from '@/agents/types';
import {
  emitActivity as emitScanActivity,
  sendScanMessage,
  getScan,
} from './scan-store';
import {
  emitPlanActivity,
  sendPlanMessage,
  getPlan,
} from './plan-store';

export type RunKind = 'scan' | 'plan';

export interface RunRef {
  kind: RunKind;
  id: string;
}

/**
 * Emit a status activity for a single agent. This is the "I'm doing X" feed.
 */
export function emit(
  run: RunRef,
  agent: AgentId,
  status: AgentActivity['status'],
  messageAr: string,
): void {
  if (run.kind === 'scan') emitScanActivity(run.id, agent, status, messageAr);
  else                     emitPlanActivity(run.id, agent, status, messageAr);
}

/**
 * Send an A2A message. `to: 'ALL'` broadcasts to every agent on the bus.
 */
export function send(
  run: RunRef,
  msg: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
): void {
  if (run.kind === 'scan') sendScanMessage(run.id, msg);
  else                     sendPlanMessage(run.id, msg);
}

/**
 * Convenience: emit a working-status activity AND immediately send a
 * dependency-type A2A message. Used at entity handoffs in the establishment
 * orchestrator (e.g. "civil_defense: done → municipality: I'm ready").
 */
export function handoff(
  run: RunRef,
  from: AgentId,
  to: AgentId | 'ALL',
  messageAr: string,
  type: AgentMessage['type'] = 'dependency',
  payload?: Record<string, unknown>,
): void {
  send(run, { from, to, type, messageAr, payload });
}

export function loadMessages(run: RunRef): AgentMessage[] {
  const record = run.kind === 'scan' ? getScan(run.id) : getPlan(run.id);
  return record?.messages ?? [];
}

export function loadActivities(run: RunRef): AgentActivity[] {
  const record = run.kind === 'scan' ? getScan(run.id) : getPlan(run.id);
  return record?.activities ?? [];
}
