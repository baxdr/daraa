/**
 * AuditLogRepository interface — abstraction for immutable audit logging.
 *
 * Audit logs are append-only records of sensitive events. The implementation
 * must guarantee write-once semantics (no updates or deletes).
 * Stub implementation returns empty results; full impl in Auth phase.
 */

export interface AuditLogEvent {
  id: string;
  workspaceId: string;
  userId?: string;
  action: string; // e.g. 'project.created', 'document.downloaded', 'user.invited'
  resourceType: string; // e.g. 'project', 'workspace', 'user'
  resourceId: string;
  metadata?: Record<string, unknown>;
  createdAt: number;
}

export interface AuditLogRepository {
  /**
   * Record an audit event. Append-only — the implementation must persist
   * atomically and reject mutations.
   */
  record(event: Omit<AuditLogEvent, 'id' | 'createdAt'>): Promise<AuditLogEvent>;

  /**
   * Retrieve audit events for a workspace (stub for Phase 2).
   * Full implementation with pagination/filtering in Auth phase.
   */
  findByWorkspace(
    workspaceId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<readonly AuditLogEvent[]>;
}
