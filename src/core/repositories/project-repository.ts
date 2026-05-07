/**
 * ProjectRepository interface — pure abstraction for project persistence.
 *
 * All methods are async (prepared for Supabase phase). Inputs and outputs
 * use the same ProjectRecord type from core/domain to avoid duplication.
 * The interface makes no assumptions about the underlying storage.
 */

import type { ProjectRecord } from '@/core/domain/project.entity';
import type { AgentActivity, AgentMessage } from '@/agents/types';

export interface ProjectRepository {
  /**
   * Create a new project record. The implementation must assign an ID,
   * timestamp, and persist atomically.
   */
  create(input: {
    mode: ProjectRecord['mode'];
    vertical: ProjectRecord['vertical'];
    companyName: string;
    cityId?: string | undefined;
    url: string | null;
    answers: ProjectRecord['answers'];
    email?: string | undefined;
  }): Promise<ProjectRecord>;

  /**
   * Retrieve a project by ID. Returns null if not found.
   */
  findById(id: string): Promise<ProjectRecord | null>;

  /**
   * Update a project record with a partial patch. Returns the updated
   * record, or null if not found.
   */
  update(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null>;

  /**
   * Look up all projects associated with an email address.
   * Email matching is case-insensitive and whitespace-trimmed.
   * Returns sorted by createdAt (newest first).
   */
  findByEmail(email: string): Promise<readonly ProjectRecord[]>;

  /**
   * Append a new activity record. The implementation must assign seq and
   * createdAt. Returns the updated project record.
   */
  appendActivity(
    id: string,
    activity: Omit<AgentActivity, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null>;

  /**
   * Append a new message record. The implementation must assign seq and
   * createdAt. Returns the updated project record.
   */
  appendMessage(
    id: string,
    message: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null>;

  /**
   * Force durability for a project immediately (bypassing any debouncing).
   * Used for terminal state transitions (complete / error).
   */
  flush(id: string): Promise<void>;
}
