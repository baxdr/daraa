/**
 * Domain events.
 *
 * Events describe facts that have happened in the domain. They are emitted
 * by use-cases and consumed by infrastructure adapters (telemetry, audit log,
 * email, websockets, ...). Events never carry behaviour or framework types.
 *
 * Convention: every event has a discriminator `type`, an `occurredAt` ISO
 * timestamp, and a payload of value-objects/IDs (no entity references).
 */

import type { ProjectId, UserId, WorkspaceId, DocumentId, ChatSessionId } from '@/core/domain/ids';

interface DomainEventBase<T extends string> {
  readonly type: T;
  readonly occurredAt: string;
}

export interface ProjectClaimedEvent extends DomainEventBase<'project.claimed'> {
  readonly projectId: ProjectId;
  readonly userId: UserId;
  readonly viaEmail: string;
}

export interface ProjectStartedEvent extends DomainEventBase<'project.started'> {
  readonly projectId: ProjectId;
  readonly ownerId: UserId | null;
  readonly mode: 'establish' | 'audit';
}

export interface AgentRunStartedEvent extends DomainEventBase<'agent.run.started'> {
  readonly projectId: ProjectId;
  readonly agentId: string;
  readonly runId: string;
}

export interface AgentRunCompletedEvent extends DomainEventBase<'agent.run.completed'> {
  readonly projectId: ProjectId;
  readonly agentId: string;
  readonly runId: string;
  readonly durationMs: number;
}

export interface AgentRunFailedEvent extends DomainEventBase<'agent.run.failed'> {
  readonly projectId: ProjectId;
  readonly agentId: string;
  readonly runId: string;
  readonly errorCode: string;
}

export interface ScanCompletedEvent extends DomainEventBase<'scan.completed'> {
  readonly projectId: ProjectId;
  readonly scanType: string;
  readonly score: number;
}

export interface DocumentGeneratedEvent extends DomainEventBase<'document.generated'> {
  readonly projectId: ProjectId;
  readonly documentId: DocumentId;
  readonly documentKind: string;
  readonly version: number;
}

export interface ChatMessageSentEvent extends DomainEventBase<'chat.message.sent'> {
  readonly projectId: ProjectId;
  readonly sessionId: ChatSessionId;
  readonly role: 'user' | 'assistant';
}

export interface WorkspaceMemberInvitedEvent extends DomainEventBase<'workspace.member.invited'> {
  readonly workspaceId: WorkspaceId;
  readonly invitedEmail: string;
  readonly invitedBy: UserId;
  readonly role: 'owner' | 'admin' | 'editor' | 'viewer';
}

export type DomainEvent =
  | ProjectClaimedEvent
  | ProjectStartedEvent
  | AgentRunStartedEvent
  | AgentRunCompletedEvent
  | AgentRunFailedEvent
  | ScanCompletedEvent
  | DocumentGeneratedEvent
  | ChatMessageSentEvent
  | WorkspaceMemberInvitedEvent;

export type DomainEventType = DomainEvent['type'];

export function nowIso(): string {
  return new Date().toISOString();
}
