import { NextResponse } from 'next/server';
import { QUESTIONS } from '@/agents/chat-flow';
import { applyPrefill } from '@/lib/chat-sessions';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { enforceRateLimit } from '@/infrastructure/rate-limit/rate-limit';

export const runtime = 'nodejs';

/**
 * POST /api/chat/start — initialise a chat session, return the opening
 * message in the same shape as /api/chat/message so the client has one
 * renderer path.
 *
 * Optional body:
 *   { prefill?: Partial<Answers> }           — direct seed of known answers
 *   { continueFromProjectId?: string }       — seed from an existing
 *                                              establishment project's
 *                                              answers, flipping mode to
 *                                              compliance
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'chat-start', max: 30, windowMs: 60_000 });
  if (limited) return limited;

  let prefill: Record<string, unknown> | undefined;
  try {
    const body = await req.json().catch(() => null);
    if (body && typeof body === 'object' && body !== null) {
      const typed = body as {
        prefill?: unknown;
        continueFromProjectId?: unknown;
      };
      if (typed.prefill && typeof typed.prefill === 'object') {
        prefill = typed.prefill as Record<string, unknown>;
      } else if (typeof typed.continueFromProjectId === 'string' && typed.continueFromProjectId) {
        prefill = await buildComplianceHandoff(typed.continueFromProjectId);
      }
    }
  } catch {
    // no body — fine
  }

  const repos = getRepositories();
  const session = await repos.chatSessions.create();

  // Apply prefill if provided, then jump currentQuestion to the first
  // unanswered field.
  if (prefill) {
    applyPrefill(session, prefill);
    await repos.chatSessions.update(session.id, session);
  }

  const opener = QUESTIONS[session.currentQuestion ?? 'q0_mode'];
  const agentMessage = session.currentQuestion
    ? opener.text + (opener.hint ? `\n\n${opener.hint}` : '')
    : 'تمام — كل المعلومات الأساسية موجودة.';
  const suggestions = opener.options
    ? opener.options.map((o) => ({ label: o.label, value: o.value }))
    : null;
  const input = opener.input
    ? {
        kind: opener.input.kind === 'url' ? 'url_or_skip' : opener.input.kind,
        placeholder: opener.input.placeholder,
        skipLabel: opener.input.kind === 'url_or_skip' ? opener.input.skipLabel : undefined,
      }
    : { kind: 'text' as const, placeholder: 'اكتب جوابك أو اختر من الاقتراحات' };

  return NextResponse.json({
    sessionId: session.id,
    agentMessage,
    nextQuestionId: session.currentQuestion,
    suggestions,
    input,
  });
}

/**
 * Pull known answers from an establishment project and flip them into a
 * compliance-mode seed. We carry name, vertical→company_type, and city.
 * Everything else (employees, personal-data handling, DPO, hosting, URL) is
 * business-specific and must be asked fresh.
 */
async function buildComplianceHandoff(
  projectId: string,
): Promise<Record<string, unknown> | undefined> {
  const repos = getRepositories();
  const project = await repos.projects.findById(projectId);
  if (!project) return undefined;

  const seed: Record<string, unknown> = {
    q0_mode: 'compliance',
  };
  if (project.companyName) seed.q_company_name = project.companyName;
  if (project.cityId) seed.est2_city = project.cityId;

  // Map establishment vertical → compliance company_type.
  switch (project.vertical) {
    case 'tech':
      seed.q1_company_type = 'saas';
      break;
    case 'services':
      seed.q1_company_type = 'ecommerce';
      break;
    case 'restaurant':
      seed.q1_company_type = 'services';
      break;
    case 'salon':
      seed.q1_company_type = 'services';
      break;
    case 'construction':
      seed.q1_company_type = 'services';
      break;
  }
  return seed;
}
