/**
 * Filesystem persistence layer factory.
 *
 * Creates all repository implementations backed by the current fs + in-memory
 * system. This factory is the single source of truth for dependency injection.
 */

import type {
  ProjectRepository,
  ChatSessionRepository,
  AuditLogRepository,
  WorkspaceRepository,
} from '@/core/repositories';
import { FilesystemProjectRepository } from './fs-project-repository';
import { FilesystemChatSessionRepository } from './fs-chat-session-repository';
import { FilesystemAuditLogRepository } from './fs-audit-log-repository';
import { FilesystemWorkspaceRepository } from './fs-workspace-repository';

export interface Repositories {
  projects: ProjectRepository;
  chatSessions: ChatSessionRepository;
  auditLogs: AuditLogRepository;
  workspaces: WorkspaceRepository;
}

export function createFilesystemRepositories(): Repositories {
  return {
    projects: new FilesystemProjectRepository(),
    chatSessions: new FilesystemChatSessionRepository(),
    auditLogs: new FilesystemAuditLogRepository(),
    workspaces: new FilesystemWorkspaceRepository(),
  };
}
