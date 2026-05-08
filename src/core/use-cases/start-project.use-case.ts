/**
 * StartProjectUseCase — creates a project from a completed chat session.
 *
 * Single mode (operational_compliance) post-pivot. The HTTP layer is
 * responsible for parsing the request body and rate-limiting; this use-case
 * takes a validated sessionId and produces a `ProjectRecord` (or throws a
 * domain error).
 *
 * The orchestrator is invoked separately by the caller (fire-and-forget)
 * so this use-case stays synchronous and easy to test.
 */

import { ValidationError, NotFoundError } from '@/core/errors';
import type { ChatSessionRepository, ProjectRepository } from '@/core/repositories';
import type { ProjectRecord } from '@/core/domain/project.entity';
import type { Principal } from '@/core/policies';
import { VERTICALS, type VerticalId } from '@/knowledge/entities';

export interface StartProjectInput {
  readonly sessionId: string;
  /** Authenticated user starting this project. If present, the new project
   *  is created as owned (private). If null, project is anonymous and
   *  link-shareable until the user signs in to claim it. */
  readonly principal?: Principal | null;
}

export interface StartProjectDeps {
  readonly chatSessions: ChatSessionRepository;
  readonly projects: ProjectRepository;
}

type AnswerMap = {
  q_company_name?: string;
  op1_vertical?: VerticalId;
  op2_city?: string;
};

export async function startProject(
  deps: StartProjectDeps,
  input: StartProjectInput,
): Promise<ProjectRecord> {
  const session = await deps.chatSessions.findById(input.sessionId);
  if (!session) throw new NotFoundError('ChatSession', input.sessionId);
  if (session.currentQuestion !== null) {
    throw new ValidationError('Chat session is not complete', { sessionId: input.sessionId });
  }

  const answers = session.answers as AnswerMap;
  const vertical = resolveVertical(answers);
  if (!VERTICALS[vertical]) {
    throw new ValidationError(`Unknown vertical: ${vertical}`, { vertical });
  }

  const companyName = (answers.q_company_name ?? '').trim();
  if (!companyName) throw new ValidationError('Missing company name');

  const cityId = answers.op2_city;
  const ownerUserId = input.principal?.userId;

  return deps.projects.create({
    mode: 'operational_compliance',
    vertical,
    companyName,
    ...(cityId !== undefined ? { cityId } : {}),
    answers: session.answers,
    ...(ownerUserId !== undefined ? { ownerUserId } : {}),
  });
}

export function resolveVertical(answers: AnswerMap): VerticalId {
  return answers.op1_vertical ?? 'coffee';
}
