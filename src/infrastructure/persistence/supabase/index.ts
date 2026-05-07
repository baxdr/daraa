/**
 * Supabase persistence layer factory.
 *
 * Creates all repository implementations backed by Supabase.
 * This factory is the single source of truth for dependency injection
 * and can be swapped out in the persistence-router.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProjectRepository,
  DocumentRepository,
  ChatSessionRepository,
  AuditLogRepository,
  WorkspaceRepository,
} from '@/core/repositories';
import type { Database } from '@/types/supabase';
import { SupabaseProjectRepository } from './sb-project-repository';
import { SupabaseDocumentRepository } from './sb-document-repository';
import { SupabaseChatSessionRepository } from './sb-chat-session-repository';
import { SupabaseAuditLogRepository } from './sb-audit-log-repository';
import { SupabaseWorkspaceRepository } from './sb-workspace-repository';

export interface Repositories {
  projects: ProjectRepository;
  documents: DocumentRepository;
  chatSessions: ChatSessionRepository;
  auditLogs: AuditLogRepository;
  workspaces: WorkspaceRepository;
}

/**
 * Create all Supabase repositories.
 * The client should be a server-side client created from cookies/headers.
 */
export function createSupabaseRepositories(client: SupabaseClient<Database>): Repositories {
  return {
    projects: new SupabaseProjectRepository(client),
    documents: new SupabaseDocumentRepository(client),
    chatSessions: new SupabaseChatSessionRepository(client),
    auditLogs: new SupabaseAuditLogRepository(client),
    workspaces: new SupabaseWorkspaceRepository(client),
  };
}
