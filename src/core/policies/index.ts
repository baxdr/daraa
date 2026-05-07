/**
 * Authorization policies.
 *
 * Pure functions that decide whether a principal may perform an action
 * given a resource. They throw `ForbiddenError`/`UnauthorizedError` rather
 * than returning booleans so callers can fail loudly at the call site.
 *
 * Policies stay in `core/` and never reach for HTTP, DB, or session APIs;
 * adapters in `application/` collect the inputs and invoke policies.
 */

import { ForbiddenError, UnauthorizedError } from '@/core/errors';
import type { ProjectId, UserId, WorkspaceId } from '@/core/domain/ids';

export type WorkspaceRole = 'owner' | 'admin' | 'editor' | 'viewer';

export interface WorkspaceMember {
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly role: WorkspaceRole;
}

export interface ProjectAccess {
  readonly projectId: ProjectId;
  readonly ownerUserId: UserId | null;
  readonly workspaceId: WorkspaceId | null;
}

export interface Principal {
  readonly userId: UserId;
  readonly memberships: ReadonlyArray<WorkspaceMember>;
}

const ROLE_RANK: Readonly<Record<WorkspaceRole, number>> = Object.freeze({
  viewer: 0,
  editor: 1,
  admin: 2,
  owner: 3,
});

function rolesAtLeast(role: WorkspaceRole, minimum: WorkspaceRole): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function requireAuthenticated(principal: Principal | null): asserts principal is Principal {
  if (!principal) throw new UnauthorizedError();
}

export function workspaceRoleOf(
  principal: Principal,
  workspaceId: WorkspaceId,
): WorkspaceRole | null {
  const found = principal.memberships.find((m) => m.workspaceId === workspaceId);
  return found ? found.role : null;
}

export function requireWorkspaceRole(
  principal: Principal,
  workspaceId: WorkspaceId,
  minimum: WorkspaceRole,
): void {
  const role = workspaceRoleOf(principal, workspaceId);
  if (!role || !rolesAtLeast(role, minimum)) {
    throw new ForbiddenError(`act with role >= ${minimum}`, `workspace:${workspaceId}`);
  }
}

export function requireProjectRead(principal: Principal | null, project: ProjectAccess): void {
  if (project.ownerUserId === null && project.workspaceId === null) return;
  requireAuthenticated(principal);
  if (project.ownerUserId === principal.userId) return;
  if (project.workspaceId) {
    requireWorkspaceRole(principal, project.workspaceId, 'viewer');
    return;
  }
  throw new ForbiddenError('read', `project:${project.projectId}`);
}

export function requireProjectWrite(principal: Principal | null, project: ProjectAccess): void {
  requireAuthenticated(principal);
  if (project.ownerUserId === principal.userId) return;
  if (project.workspaceId) {
    requireWorkspaceRole(principal, project.workspaceId, 'editor');
    return;
  }
  throw new ForbiddenError('write', `project:${project.projectId}`);
}

export function requireWorkspaceAdmin(principal: Principal, workspaceId: WorkspaceId): void {
  requireWorkspaceRole(principal, workspaceId, 'admin');
}
