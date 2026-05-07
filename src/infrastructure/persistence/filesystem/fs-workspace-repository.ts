/**
 * Filesystem-backed WorkspaceRepository implementation.
 *
 * Stub for Phase 2. Returns a synthetic "personal" workspace for any user.
 * Real implementation (multi-tenant support) in Phase 3+ (Auth).
 */

import { nanoid } from 'nanoid';
import type { WorkspaceRepository, Workspace } from '@/core/repositories/workspace-repository';

const PERSONAL_WORKSPACE_ID_CACHE = new Map<string, string>();

export class FilesystemWorkspaceRepository implements WorkspaceRepository {
  async create(input: { name: string; ownerId: string }): Promise<Workspace> {
    // TODO: Phase 3+ persists to Supabase.
    const workspace: Workspace = {
      id: nanoid(),
      name: input.name,
      ownerId: input.ownerId,
      createdAt: Date.now(),
    };
    return workspace;
  }

  async findById(_id: string): Promise<Workspace | null> {
    // TODO: Phase 3+ queries Supabase.
    return null;
  }

  async findPrimaryForUser(userId: string): Promise<Workspace> {
    // Return a cached synthetic workspace. Real impl stores in DB.
    let id = PERSONAL_WORKSPACE_ID_CACHE.get(userId);
    if (!id) {
      id = nanoid();
      PERSONAL_WORKSPACE_ID_CACHE.set(userId, id);
    }
    return {
      id,
      name: 'Personal Workspace',
      ownerId: userId,
      createdAt: Date.now(),
    };
  }
}
