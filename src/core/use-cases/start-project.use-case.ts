/**
 * StartProjectUseCase — creates a project from a completed chat session.
 *
 * Unifies the three modes (establishment / digital compliance / operational
 * compliance) into a single flow. The HTTP layer is responsible for parsing
 * the request body and rate-limiting; this use-case takes a validated
 * sessionId and produces a `ProjectRecord` (or throws a domain error).
 *
 * The orchestrator is invoked separately by the caller (fire-and-forget)
 * so this use-case stays synchronous and easy to test.
 */

import { ValidationError, NotFoundError } from '@/core/errors';
import type { ChatSessionRepository, ProjectRepository } from '@/core/repositories';
import type { ProjectMode, ProjectRecord } from '@/core/domain/project.entity';
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
  q0_mode?: ProjectMode;
  q_company_name?: string;
  q1_company_type?: 'saas' | 'ecommerce' | 'fintech' | 'services' | 'other';
  q8_website_url?: string;
  est1_vertical?: VerticalId;
  est2_city?: string;
  op1_vertical?: 'restaurant' | 'salon' | 'construction' | 'retail';
  op2_city?: string;
  op10_website_url?: string;
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
  const mode = answers.q0_mode;
  if (!mode) throw new ValidationError('Missing project mode in session answers');

  const vertical = resolveVertical(answers);
  if (!VERTICALS[vertical]) {
    throw new ValidationError(`Unknown vertical: ${vertical}`, { vertical });
  }

  const companyName = (answers.q_company_name ?? '').trim();
  if (!companyName) throw new ValidationError('Missing company name');

  const url =
    mode === 'operational_compliance'
      ? (answers.op10_website_url ?? null)
      : (answers.q8_website_url ?? null);
  const cityId = answers.est2_city ?? answers.op2_city;

  const ownerUserId = input.principal?.userId;

  return deps.projects.create({
    mode,
    vertical,
    companyName,
    ...(cityId !== undefined ? { cityId } : {}),
    url,
    answers: session.answers,
    ...(ownerUserId !== undefined ? { ownerUserId } : {}),
  });
}

export function resolveVertical(answers: AnswerMap): VerticalId {
  if (answers.q0_mode === 'establishment') {
    return (answers.est1_vertical ?? 'tech') as VerticalId;
  }
  if (answers.q0_mode === 'operational_compliance') {
    switch (answers.op1_vertical) {
      case 'restaurant':
        return 'restaurant';
      case 'salon':
        return 'salon';
      case 'construction':
        return 'construction';
      case 'retail':
        return 'services';
      default:
        return 'services';
    }
  }
  switch (answers.q1_company_type) {
    case 'saas':
      return 'tech';
    case 'fintech':
      return 'tech';
    case 'ecommerce':
      return 'services';
    case 'services':
      return 'tech';
    case 'other':
      return 'tech';
    default:
      return 'tech';
  }
}
