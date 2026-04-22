/**
 * In-memory scan store (Week 1 MVP), mirroring chat-sessions.ts.
 * Replaced by a Supabase `scans` row with Realtime-backed status in Week 2.
 */

import { nanoid } from 'nanoid';
import type { Answers } from '@/agents/chat-flow';
import type { AgentActivity, AgentId, AgentMessage, ScanResult } from '@/agents/types';
import { AGENT_LABELS_AR } from '@/agents/types';
import type { AnalysisReport } from '@/agents/analysis-agent';

export type ScanStatus = 'pending' | 'scanning' | 'analyzing' | 'complete' | 'error';

export interface ScanRecord {
  id: string;
  createdAt: number;
  status: ScanStatus;
  answers: Answers;
  url: string | null;
  activities: AgentActivity[];
  /** A2A messages on the inter-agent bus — rendered in the timeline. */
  messages: AgentMessage[];
  scanResult?: ScanResult;
  analysis?: AnalysisReport;
  errorMessage?: string;
}

const globalForScans = globalThis as unknown as { __daraaScans?: Map<string, ScanRecord> };
const SCANS: Map<string, ScanRecord> =
  globalForScans.__daraaScans ?? (globalForScans.__daraaScans = new Map());
const SCAN_TTL_MS = 60 * 60 * 1000;

function prune() {
  const cutoff = Date.now() - SCAN_TTL_MS;
  for (const [id, s] of SCANS) if (s.createdAt < cutoff) SCANS.delete(id);
}

export function createScan(answers: Answers, url: string | null): ScanRecord {
  prune();
  const record: ScanRecord = {
    id: nanoid(),
    createdAt: Date.now(),
    status: 'pending',
    answers,
    url,
    activities: [],
    messages: [],
  };
  SCANS.set(record.id, record);
  return record;
}

/**
 * Append an activity to a scan's timeline. Mutates in place — safe because
 * the store's Map always hands out the same record reference.
 */
export function emitActivity(
  scanId: string,
  agent: AgentId,
  status: AgentActivity['status'],
  messageAr: string,
): void {
  const scan = SCANS.get(scanId);
  if (!scan) return;
  scan.activities.push({
    seq: scan.activities.length,
    kind: 'activity',
    agent,
    agentAr: AGENT_LABELS_AR[agent],
    status,
    messageAr,
    createdAt: Date.now(),
  });
}

/**
 * Append an A2A message to the scan's bus.
 * The UI renders these distinctly from plain activities — the point is to
 * show inter-agent communication, not just a status feed.
 */
export function sendScanMessage(
  scanId: string,
  msg: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
): void {
  const scan = SCANS.get(scanId);
  if (!scan) return;
  scan.messages.push({
    seq: scan.messages.length,
    kind: 'message',
    ...msg,
    createdAt: Date.now(),
  });
}

export function getScan(id: string): ScanRecord | null {
  return SCANS.get(id) ?? null;
}

export function updateScan(id: string, patch: Partial<ScanRecord>): ScanRecord | null {
  const existing = SCANS.get(id);
  if (!existing) return null;
  // Mutate in place — spread-then-set loses any events pushed to the OLD
  // record reference by concurrent emit*/send* calls that captured the old
  // scan. emitActivity pushes to `scan.activities`; if we replace the record
  // now, those pushes land on an orphan.
  Object.assign(existing, patch);
  return existing;
}
