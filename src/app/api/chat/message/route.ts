import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/chat-sessions';
import { advanceChat } from '@/agents/chat-agent';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BodySchema = z.object({
  sessionId: z.string().min(1),
  answer: z.string(),
});

/**
 * POST /api/chat/message
 *
 * Drives the Claude-backed conversational intake. Accepts either a button-
 * click value or free text; returns the agent's next message + optional
 * quick-reply suggestions + input affordance.
 *
 * When the flow is done, returns `{ done: true, answers, agentMessage }`.
 * The client then kicks off the unified pipeline via /api/project/start.
 */
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  const session = getSession(parsed.data.sessionId);
  if (!session) return NextResponse.json({ error: 'جلسة غير معروفة' }, { status: 404 });

  const turn = await advanceChat({ session, userInput: parsed.data.answer });
  if ('error' in turn) {
    return NextResponse.json({ error: turn.error }, { status: 400 });
  }

  if (turn.done) {
    return NextResponse.json({
      done: true,
      agentMessage: turn.agentMessage,
      extracted: turn.extracted,
      answers: session.answers,
    });
  }

  return NextResponse.json({
    done: false,
    agentMessage: turn.agentMessage,
    nextQuestionId: turn.nextQuestionId,
    suggestions: turn.suggestions ?? null,
    input: turn.input ?? null,
    extracted: turn.extracted,
  });
}
