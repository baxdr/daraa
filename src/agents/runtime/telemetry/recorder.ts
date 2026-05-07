/**
 * Telemetry recorder — turns AgentRunHooks into a RunRecord.
 *
 * Usage:
 *   const recorder = makeRecorder(context, agentIds);
 *   const result = await runAgents(agents, context, recorder.hooks);
 *   const record = recorder.finish();
 *   await sink.save(record);
 *
 * Design:
 *   - The recorder owns its own seq counter and start-times map.
 *   - It does NOT persist by itself. The caller picks a sink afterwards.
 *   - Errors during recording must NEVER break the orchestrator. We catch
 *     and discard internally (silent telemetry failure).
 */

import type { AgentContext, AgentMessage, AgentResult } from '../types';
import type { AgentId } from '../../types';
import type { AgentRunHooks } from '../orchestrator-runtime';
import type { AgentEventRecord, MessageRecord, RunRecord } from './types';

export interface Recorder {
  readonly runId: string;
  readonly hooks: AgentRunHooks;
  /** Snapshot the current state into a RunRecord. Does not stop recording. */
  snapshot(): RunRecord;
  /** Mark the run as finished and return the final RunRecord. */
  finish(): RunRecord;
}

const MAX_PAYLOAD_BYTES = 16 * 1024;

function generateRunId(): string {
  // Sortable timestamp prefix + short random suffix — readable on disk.
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  return `run_${ts}_${rand}`;
}

function safePayload(p: Record<string, unknown>): Record<string, unknown> {
  // Trim payloads larger than MAX_PAYLOAD_BYTES — protects fs-sink from runaway memory.
  try {
    const json = JSON.stringify(p);
    if (json.length <= MAX_PAYLOAD_BYTES) return p;
    return { __truncated: true, __originalBytes: json.length, preview: json.slice(0, 1024) };
  } catch {
    return { __unserializable: true };
  }
}

export function makeRecorder(context: AgentContext, agentIds: AgentId[]): Recorder {
  const runId = generateRunId();
  const startedAt = Date.now();

  let seq = 0;
  const events: AgentEventRecord[] = [];
  const messages: MessageRecord[] = [];
  const finalResults: Partial<Record<AgentId, AgentResult>> = {};
  const startTimes = new Map<string, number>(); // key = `${agentId}:${wave}`

  const next = (): number => {
    seq += 1;
    return seq;
  };

  const onAgentStart = (agentId: AgentId, wave: number) => {
    try {
      const ts = Date.now();
      startTimes.set(`${agentId}:${wave}`, ts);
      events.push({ runId, seq: next(), ts, wave, agentId, phase: 'start' });
    } catch {
      /* telemetry must not break the run */
    }
  };

  const onAgentFinish: AgentRunHooks['onAgentFinish'] = (event) => {
    try {
      const ts = Date.now();
      const startKey = `${event.agentId}:${event.waveNumber}`;
      const startedAtAgent = startTimes.get(startKey);
      const durationMs = startedAtAgent !== undefined ? ts - startedAtAgent : undefined;

      const eventRecord: AgentEventRecord = {
        runId,
        seq: next(),
        ts,
        wave: event.waveNumber,
        agentId: event.agentId,
        phase: 'finish',
        status: event.status,
        ...(durationMs !== undefined ? { durationMs } : {}),
        ...(event.result.status === 'error' ? { error: event.result.error } : {}),
      };
      events.push(eventRecord);
      finalResults[event.agentId] = event.result;
    } catch {
      /* telemetry must not break the run */
    }
  };

  const onMessages: AgentRunHooks['onMessages'] = (delivered) => {
    try {
      const ts = Date.now();
      // We can't know the wave from the message itself — infer from latest finish event.
      const lastEvent = events.length > 0 ? events[events.length - 1] : undefined;
      const wave = lastEvent?.wave ?? 1;
      for (const m of delivered as readonly AgentMessage[]) {
        messages.push({
          runId,
          seq: next(),
          ts,
          wave,
          from: m.from,
          to: m.to,
          type: m.type,
          payload: safePayload(m.payload),
          messageAr: m.messageAr,
        });
      }
    } catch {
      /* telemetry must not break the run */
    }
  };

  const buildSnapshot = (finishedAt?: number): RunRecord => ({
    runId,
    startedAt,
    ...(finishedAt !== undefined ? { finishedAt } : {}),
    // Deep clone the context so external mutation doesn't change the record.
    // JSON-clone is sufficient — context is required to be JSON-serializable
    // (RunRecord is persisted via fs-sink as JSON anyway).
    context: JSON.parse(JSON.stringify(context)) as AgentContext,
    agentIds: [...agentIds],
    events: [...events],
    messages: [...messages],
    finalResults: { ...finalResults },
  });

  return {
    runId,
    hooks: { onAgentStart, onAgentFinish, onMessages },
    snapshot: () => buildSnapshot(),
    finish: () => buildSnapshot(Date.now()),
  };
}
