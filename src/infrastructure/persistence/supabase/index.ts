/**
 * Supabase persistence layer factory.
 *
 * The active repositories (projects + chatSessions) use the service-role
 * client internally and don't need request context. workspaces/auditLogs
 * remain scaffolded but unused; the factory threads through an optional
 * cookie-bound client for them so legacy callers compile.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProjectRepository,
  ChatSessionRepository,
  AuditLogRepository,
  WorkspaceRepository,
} from '@/core/repositories';
import type { Database } from '@/types/supabase';
import { SupabaseProjectRepository } from './sb-project-repository';
import { SupabaseChatSessionRepository } from './sb-chat-session-repository';
import { SupabaseAuditLogRepository } from './sb-audit-log-repository';
import { SupabaseWorkspaceRepository } from './sb-workspace-repository';

export interface Repositories {
  projects: ProjectRepository;
  chatSessions: ChatSessionRepository;
  auditLogs: AuditLogRepository;
  workspaces: WorkspaceRepository;
}

export function createSupabaseRepositories(client?: SupabaseClient<Database>): Repositories {
  return {
    projects: new SupabaseProjectRepository(),
    chatSessions: new SupabaseChatSessionRepository(),
    auditLogs: new SupabaseAuditLogRepository(client as SupabaseClient<Database>),
    workspaces: new SupabaseWorkspaceRepository(client as SupabaseClient<Database>),
  };
}
