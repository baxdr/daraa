/**
 * Filesystem-backed AuditLogRepository implementation.
 *
 * Appends to data/audit-logs.jsonl (one JSON object per line).
 * For Phase 2, findByWorkspace is a stub returning empty.
 * Full querying in Phase 3+ (Auth).
 */

import { nanoid } from 'nanoid';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { AuditLogRepository, AuditLogEvent } from '@/core/repositories/audit-log-repository';

const DATA_ROOT = join(process.cwd(), 'data');
const AUDIT_LOG_PATH = join(DATA_ROOT, 'audit-logs.jsonl');

export class FilesystemAuditLogRepository implements AuditLogRepository {
  async record(event: Omit<AuditLogEvent, 'id' | 'createdAt'>): Promise<AuditLogEvent> {
    const auditEvent: AuditLogEvent = {
      ...event,
      id: nanoid(),
      createdAt: Date.now(),
    };

    // Append to JSONL file atomically.
    const line = JSON.stringify(auditEvent) + '\n';
    try {
      await fs.appendFile(AUDIT_LOG_PATH, line, { encoding: 'utf8' });
    } catch (err) {
      console.warn('[audit-log] append failed:', err instanceof Error ? err.message : err);
    }

    return auditEvent;
  }

  async findByWorkspace(
    _workspaceId: string,
    _opts?: { limit?: number; offset?: number } | undefined,
  ): Promise<readonly AuditLogEvent[]> {
    // TODO: Phase 3+ (Auth) implements full workspace-scoped queries.
    return [];
  }
}
