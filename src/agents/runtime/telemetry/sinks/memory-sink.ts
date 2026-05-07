/**
 * In-memory telemetry sink — used in tests and as a default for ephemeral runs.
 *
 * Stores RunRecords in a Map keyed by runId. Cleared when the process exits.
 */

import type { RunRecord, TelemetrySink } from '../types';

export class MemorySink implements TelemetrySink {
  private readonly store = new Map<string, RunRecord>();

  async save(record: RunRecord): Promise<void> {
    // Store an immutable copy so later mutations to the original don't leak in.
    this.store.set(record.runId, JSON.parse(JSON.stringify(record)));
  }

  async load(runId: string): Promise<RunRecord | null> {
    const r = this.store.get(runId);
    return r ? JSON.parse(JSON.stringify(r)) : null;
  }

  async list(): Promise<string[]> {
    return [...this.store.keys()].sort();
  }

  /** Test-only: clear all records. */
  clear(): void {
    this.store.clear();
  }
}
