/**
 * Branded type definitions for domain IDs.
 *
 * These are intentionally lightweight: they provide type-safety without
 * runtime overhead. Each factory function is just a cast with a comment.
 */

export type ProjectId = string & { readonly __brand: 'ProjectId' };
export type WorkspaceId = string & { readonly __brand: 'WorkspaceId' };
export type UserId = string & { readonly __brand: 'UserId' };
export type DocumentId = string & { readonly __brand: 'DocumentId' };
export type ChatSessionId = string & { readonly __brand: 'ChatSessionId' };

export function toProjectId(s: string): ProjectId {
  return s as ProjectId;
}

export function toWorkspaceId(s: string): WorkspaceId {
  return s as WorkspaceId;
}

export function toUserId(s: string): UserId {
  return s as UserId;
}

export function toDocumentId(s: string): DocumentId {
  return s as DocumentId;
}

export function toChatSessionId(s: string): ChatSessionId {
  return s as ChatSessionId;
}
