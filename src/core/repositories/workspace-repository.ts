/**
 * WorkspaceRepository interface — abstraction for workspace persistence.
 *
 * Stub for Phase 2. Full implementation (multi-tenant support) in Phase 3+.
 * For now, each user has a synthetic "personal" workspace.
 */

export interface Workspace {
  id: string;
  name: string;
  ownerId: string;
  createdAt: number;
}

export interface WorkspaceRepository {
  /**
   * Create a new workspace.
   */
  create(input: { name: string; ownerId: string }): Promise<Workspace>;

  /**
   * Retrieve a workspace by ID.
   */
  findById(id: string): Promise<Workspace | null>;

  /**
   * Get the primary workspace for a user (stub: returns synthetic workspace).
   */
  findPrimaryForUser(userId: string): Promise<Workspace>;
}
