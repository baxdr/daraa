/**
 * Filesystem-backed ProjectRepository implementation.
 *
 * Wraps the existing project-store.ts Map + project-fs.ts atomic writes.
 * Behavior is identical to the current system; async methods satisfy the
 * repository interface contract.
 */

import {
  createProject as storeCreateProject,
  getProject as storeGetProject,
  updateProject as storeUpdateProject,
  getProjectsByEmail as storeGetProjectsByEmail,
  getProjectsByOwner as storeGetProjectsByOwner,
  emitProjectActivity as storeEmitProjectActivity,
  sendProjectMessage as storeSendProjectMessage,
} from '@/lib/project-store';
import { flushNow as fsFlushNow } from '@/lib/project-fs';
import type { ProjectRepository } from '@/core/repositories/project-repository';
import type { ProjectRecord } from '@/core/domain/project.entity';
import type { AgentActivity, AgentMessage } from '@/agents/types';

export class FilesystemProjectRepository implements ProjectRepository {
  async create(input: {
    mode?: ProjectRecord['mode'];
    vertical: ProjectRecord['vertical'];
    companyName: string;
    cityId?: string | undefined;
    answers: ProjectRecord['answers'];
    email?: string | undefined;
    ownerUserId?: string | undefined;
    workspaceId?: string | undefined;
  }): Promise<ProjectRecord> {
    const record = storeCreateProject({
      ...(input.mode !== undefined ? { mode: input.mode } : {}),
      vertical: input.vertical,
      companyName: input.companyName,
      ...(input.cityId !== undefined ? { cityId: input.cityId } : {}),
      answers: input.answers,
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId } : {}),
      ...(input.workspaceId !== undefined ? { workspaceId: input.workspaceId } : {}),
    });
    return record;
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    return storeGetProject(id);
  }

  async update(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    return storeUpdateProject(id, patch);
  }

  async findByEmail(email: string): Promise<readonly ProjectRecord[]> {
    return storeGetProjectsByEmail(email);
  }

  async findByOwner(ownerUserId: string): Promise<readonly ProjectRecord[]> {
    return storeGetProjectsByOwner(ownerUserId);
  }

  async appendActivity(
    id: string,
    activity: Omit<AgentActivity, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null> {
    storeEmitProjectActivity(id, activity.agent, activity.status, activity.messageAr);
    return storeGetProject(id);
  }

  async appendMessage(
    id: string,
    message: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null> {
    storeSendProjectMessage(id, message);
    return storeGetProject(id);
  }

  async flush(id: string): Promise<void> {
    const project = storeGetProject(id);
    if (project) {
      await fsFlushNow(project);
    }
  }
}
