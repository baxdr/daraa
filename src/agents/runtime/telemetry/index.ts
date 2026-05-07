/**
 * Telemetry — public entry point.
 *
 * For most callers: import { makeRecorder, MemorySink, FsSink } from '@/agents/runtime/telemetry';
 */

export { makeRecorder, type Recorder } from './recorder';
export { MemorySink } from './sinks/memory-sink';
export { FsSink } from './sinks/fs-sink';
export type { AgentEventRecord, MessageRecord, RunRecord, TelemetrySink } from './types';
