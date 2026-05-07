/**
 * Filesystem telemetry sink — writes RunRecords to disk as JSON.
 *
 * Layout: <baseDir>/<runId>.json
 *
 * Use only on the server (writes use node:fs/promises). The Phase 11
 * Supabase migration replaces this for production observability.
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { RunRecord, TelemetrySink } from '../types';

export class FsSink implements TelemetrySink {
  constructor(private readonly baseDir: string) {}

  private async ensureDir(): Promise<void> {
    await mkdir(this.baseDir, { recursive: true });
  }

  async save(record: RunRecord): Promise<void> {
    await this.ensureDir();
    const path = join(this.baseDir, `${record.runId}.json`);
    await writeFile(path, JSON.stringify(record, null, 2), 'utf-8');
  }

  async load(runId: string): Promise<RunRecord | null> {
    try {
      const path = join(this.baseDir, `${runId}.json`);
      const raw = await readFile(path, 'utf-8');
      return JSON.parse(raw) as RunRecord;
    } catch (err) {
      if (isNotFoundError(err)) return null;
      throw err;
    }
  }

  async list(): Promise<string[]> {
    try {
      await this.ensureDir();
      const files = await readdir(this.baseDir);
      return files
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.slice(0, -'.json'.length))
        .sort();
    } catch (err) {
      if (isNotFoundError(err)) return [];
      throw err;
    }
  }
}

function isNotFoundError(err: unknown): boolean {
  return (
    err !== null &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code: string }).code === 'ENOENT'
  );
}
