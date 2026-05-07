/**
 * Tests for core/policies — workspace and project authorization.
 */
import { describe, it, expect } from 'vitest';
import {
  requireAuthenticated,
  requireWorkspaceRole,
  requireProjectRead,
  requireProjectWrite,
  requireWorkspaceAdmin,
  workspaceRoleOf,
  type Principal,
  type ProjectAccess,
} from '@/core/policies';
import { ForbiddenError, UnauthorizedError } from '@/core/errors';
import {
  toUserId,
  toWorkspaceId,
  toProjectId,
  type UserId,
  type WorkspaceId,
} from '@/core/domain/ids';

const userA: UserId = toUserId('user-a');
const userB: UserId = toUserId('user-b');
const ws1: WorkspaceId = toWorkspaceId('ws-1');
const ws2: WorkspaceId = toWorkspaceId('ws-2');

function principal(userId: UserId, memberships: Principal['memberships'] = []): Principal {
  return { userId, memberships };
}

describe('core/policies', () => {
  describe('requireAuthenticated', () => {
    it('throws UnauthorizedError when principal is null', () => {
      expect(() => requireAuthenticated(null)).toThrow(UnauthorizedError);
    });

    it('passes through when principal exists', () => {
      expect(() => requireAuthenticated(principal(userA))).not.toThrow();
    });
  });

  describe('workspaceRoleOf', () => {
    it('returns null when not a member', () => {
      expect(workspaceRoleOf(principal(userA), ws1)).toBeNull();
    });

    it('returns the role when member', () => {
      const p = principal(userA, [{ workspaceId: ws1, userId: userA, role: 'editor' }]);
      expect(workspaceRoleOf(p, ws1)).toBe('editor');
    });
  });

  describe('requireWorkspaceRole', () => {
    it('admin satisfies editor minimum', () => {
      const p = principal(userA, [{ workspaceId: ws1, userId: userA, role: 'admin' }]);
      expect(() => requireWorkspaceRole(p, ws1, 'editor')).not.toThrow();
    });

    it('viewer does not satisfy editor minimum', () => {
      const p = principal(userA, [{ workspaceId: ws1, userId: userA, role: 'viewer' }]);
      expect(() => requireWorkspaceRole(p, ws1, 'editor')).toThrow(ForbiddenError);
    });

    it('non-member is rejected', () => {
      expect(() => requireWorkspaceRole(principal(userA), ws1, 'viewer')).toThrow(ForbiddenError);
    });
  });

  describe('requireProjectRead', () => {
    const orphanProject: ProjectAccess = {
      projectId: toProjectId('p1'),
      ownerUserId: null,
      workspaceId: null,
    };

    it('allows anonymous read on orphan project (legacy MVP behavior)', () => {
      expect(() => requireProjectRead(null, orphanProject)).not.toThrow();
    });

    it('allows owner', () => {
      const p: ProjectAccess = {
        projectId: toProjectId('p1'),
        ownerUserId: userA,
        workspaceId: null,
      };
      expect(() => requireProjectRead(principal(userA), p)).not.toThrow();
    });

    it('rejects non-owner with no workspace access', () => {
      const p: ProjectAccess = {
        projectId: toProjectId('p1'),
        ownerUserId: userA,
        workspaceId: null,
      };
      expect(() => requireProjectRead(principal(userB), p)).toThrow(ForbiddenError);
    });

    it('allows workspace viewer', () => {
      const p: ProjectAccess = {
        projectId: toProjectId('p1'),
        ownerUserId: null,
        workspaceId: ws1,
      };
      const me = principal(userB, [{ workspaceId: ws1, userId: userB, role: 'viewer' }]);
      expect(() => requireProjectRead(me, p)).not.toThrow();
    });

    it('rejects member of unrelated workspace', () => {
      const p: ProjectAccess = {
        projectId: toProjectId('p1'),
        ownerUserId: null,
        workspaceId: ws1,
      };
      const me = principal(userB, [{ workspaceId: ws2, userId: userB, role: 'admin' }]);
      expect(() => requireProjectRead(me, p)).toThrow(ForbiddenError);
    });
  });

  describe('requireProjectWrite', () => {
    it('viewer cannot write workspace project', () => {
      const p: ProjectAccess = {
        projectId: toProjectId('p1'),
        ownerUserId: null,
        workspaceId: ws1,
      };
      const me = principal(userB, [{ workspaceId: ws1, userId: userB, role: 'viewer' }]);
      expect(() => requireProjectWrite(me, p)).toThrow(ForbiddenError);
    });

    it('editor can write workspace project', () => {
      const p: ProjectAccess = {
        projectId: toProjectId('p1'),
        ownerUserId: null,
        workspaceId: ws1,
      };
      const me = principal(userB, [{ workspaceId: ws1, userId: userB, role: 'editor' }]);
      expect(() => requireProjectWrite(me, p)).not.toThrow();
    });

    it('anonymous cannot write even on orphan project', () => {
      const p: ProjectAccess = {
        projectId: toProjectId('p1'),
        ownerUserId: null,
        workspaceId: null,
      };
      expect(() => requireProjectWrite(null, p)).toThrow(UnauthorizedError);
    });
  });

  describe('requireWorkspaceAdmin', () => {
    it('owner is admin', () => {
      const p = principal(userA, [{ workspaceId: ws1, userId: userA, role: 'owner' }]);
      expect(() => requireWorkspaceAdmin(p, ws1)).not.toThrow();
    });

    it('editor is not admin', () => {
      const p = principal(userA, [{ workspaceId: ws1, userId: userA, role: 'editor' }]);
      expect(() => requireWorkspaceAdmin(p, ws1)).toThrow(ForbiddenError);
    });
  });
});
