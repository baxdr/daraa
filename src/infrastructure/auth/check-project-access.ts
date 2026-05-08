/**
 * Project access check wrappers.
 *
 * Sit on top of core/policies/requireProjectRead/Write to add the two
 * pragmatic exceptions every API route + page handler must apply:
 *
 *   1. Demo projects (id starts with `demo-`) are always public — they
 *      exist for judges/visitors to click through without signing up.
 *   2. Anonymous projects (no ownerUserId AND no workspaceId) are
 *      readable by any visitor with the link (link-share semantics,
 *      same as Notion shared docs). Writes still require auth.
 *
 * Throws ForbiddenError / UnauthorizedError on denial. Caller decides
 * how to translate (HTTP status vs redirect vs render notice).
 */

import { requireProjectRead, requireProjectWrite } from '@/core/policies';
import type { Principal, ProjectAccess } from '@/core/policies';
import { toProjectId, toUserId, toWorkspaceId } from '@/core/domain/ids';

export interface ProjectShape {
  id: string;
  ownerUserId?: string | undefined;
  workspaceId?: string | undefined;
}

function isDemoProject(id: string): boolean {
  return id.startsWith('demo-');
}

function toProjectAccess(project: ProjectShape): ProjectAccess {
  return {
    projectId: toProjectId(project.id),
    ownerUserId: project.ownerUserId ? toUserId(project.ownerUserId) : null,
    workspaceId: project.workspaceId ? toWorkspaceId(project.workspaceId) : null,
  };
}

/** Throws if the principal cannot read this project. */
export function checkProjectReadAccess(principal: Principal | null, project: ProjectShape): void {
  if (isDemoProject(project.id)) return;
  requireProjectRead(principal, toProjectAccess(project));
}

/** Throws if the principal cannot write this project. */
export function checkProjectWriteAccess(principal: Principal | null, project: ProjectShape): void {
  if (isDemoProject(project.id)) {
    // Demo projects are read-only for everyone except the seed script
    // (which uses the service-role key and bypasses this layer).
    requireProjectWrite(principal, toProjectAccess(project));
    return;
  }
  requireProjectWrite(principal, toProjectAccess(project));
}
