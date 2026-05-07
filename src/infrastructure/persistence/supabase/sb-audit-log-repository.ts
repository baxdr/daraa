// @ts-nocheck
// TODO(phase-4): rewrite with proper Supabase TS strict types. Filesystem driver
// remains the default; this file compiles only when PERSISTENCE_DRIVER=supabase.
/**
 * Supabase-backed AuditLogRepository implementation.
 *
 * Append-only audit logging. Enforced at the database level via RLS
 * (no UPDATE/DELETE policies for authenticated users).
 */

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { AuditLogRepository, AuditLogEvent } from '@/core/repositories/audit-log-repository';
import type { Database } from '@/types/supabase';

export class SupabaseAuditLogRepository implements AuditLogRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async record(event: Omit<AuditLogEvent, 'id' | 'createdAt'>): Promise<AuditLogEvent> {
    const id = nanoid();
    const now = new Date().toISOString();

    const { data: logged, error } = await this.supabase
      .from('audit_logs')
      .insert([
        {
          id,
          workspace_id: event.workspaceId,
          user_id: event.userId ?? null,
          action: event.action,
          resource_type: event.resourceType,
          resource_id: event.resourceId,
          metadata: event.metadata ?? null,
          created_at: now,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: logged.id,
      workspaceId: logged.workspace_id,
      userId: logged.user_id ?? undefined,
      action: logged.action,
      resourceType: logged.resource_type,
      resourceId: logged.resource_id,
      metadata: logged.metadata ?? undefined,
      createdAt: new Date(logged.created_at).getTime(),
    };
  }

  async findByWorkspace(
    workspaceId: string,
    opts?: { limit?: number; offset?: number },
  ): Promise<readonly AuditLogEvent[]> {
    let query = this.supabase
      .from('audit_logs')
      .select()
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (opts?.limit) query = query.limit(opts.limit);
    if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit || 10) - 1);

    const { data: logs, error } = await query;

    if (error) throw error;

    return (logs || []).map((log) => ({
      id: log.id,
      workspaceId: log.workspace_id,
      userId: log.user_id ?? undefined,
      action: log.action,
      resourceType: log.resource_type,
      resourceId: log.resource_id,
      metadata: log.metadata ?? undefined,
      createdAt: new Date(log.created_at).getTime(),
    }));
  }
}
