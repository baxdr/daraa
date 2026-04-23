/**
 * Agent Bus — A2A message passing over the unified project store.
 *
 * The messages here are deterministic: sender and recipient are fixed at
 * orchestrator-design time from the entity dependency graph (e.g.
 * civil_defense → municipality). Don't oversell as emergent.
 *
 * Thin facade over project-store so orchestrator code reads naturally:
 * `send(run, { from, to, ... })`.
 */

import type { AgentMessage, AgentActivity, AgentId } from '@/agents/types';
import {
  emitProjectActivity,
  sendProjectMessage,
  getProject,
} from './project-store';

export type RunKind = 'project';

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
  emitProjectActivity(run.id, agent, status, messageAr);
}

/**
 * Send an A2A message. `to: 'ALL'` broadcasts to every agent on the bus.
 */
export function send(
  run: RunRef,
  msg: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
): void {
  sendProjectMessage(run.id, msg);
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
  send(run, { from, to, type, messageAr, payload });
}

export function loadMessages(run: RunRef): AgentMessage[] {
  return getProject(run.id)?.messages ?? [];
}

export function loadActivities(run: RunRef): AgentActivity[] {
  return getProject(run.id)?.activities ?? [];
}
