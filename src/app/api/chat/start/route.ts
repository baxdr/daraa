import { NextResponse } from 'next/server';
import { QUESTIONS, FIRST_QUESTION } from '@/agents/chat-flow';
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
 *   { prefill?: Partial<Answers> }  — direct seed of known answers
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'chat-start', max: 30, windowMs: 60_000 });
  if (limited) return limited;

  let prefill: Record<string, unknown> | undefined;
  try {
    const body = await req.json().catch(() => null);
    if (body && typeof body === 'object' && body !== null) {
      const typed = body as { prefill?: unknown };
      if (typed.prefill && typeof typed.prefill === 'object') {
        prefill = typed.prefill as Record<string, unknown>;
      }
    }
  } catch {
    // no body — fine
  }

  const repos = getRepositories();
  const session = await repos.chatSessions.create();

  if (prefill) {
    applyPrefill(session, prefill);
    await repos.chatSessions.update(session.id, session);
  }

  const opener = QUESTIONS[session.currentQuestion ?? FIRST_QUESTION];
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
