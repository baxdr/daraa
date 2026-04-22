import { NextResponse } from 'next/server';
import { z } from 'zod';
import { recordAnswer } from '@/lib/chat-sessions';
import { generateBridge } from '@/agents/chat-agent';

export const runtime = 'nodejs';
export const maxDuration = 30;

const BodySchema = z.object({
  sessionId: z.string().min(1),
  answer: z.string(),
});

/**
 * POST /api/chat/message
 *
 * Records the user's answer, advances the state machine, and returns the
 * next scripted question — optionally preceded by an LLM-generated bridge
 * sentence that acknowledges the answer in context. The bridge is the one
 * moment where the chat feels agent-driven rather than form-driven.
 *
 * When the flow is done, returns `{ done: true, answers }`. The client then
 * kicks off the scan/plan pipeline via /api/scan/start or /api/establishment/resolve.
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

  const result = recordAnswer(parsed.data.sessionId, parsed.data.answer);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });

  if (!result.nextQ) {
    return NextResponse.json({
      done: true,
      answers: result.session.answers,
    });
  }

  // Bridge — short LLM-generated (or locally templated) acknowledgment.
  // Non-blocking for correctness: if it fails, we just omit it.
  let bridge: string | null = null;
  try {
    bridge = await generateBridge({
      answers: result.session.answers,
      justAnswered: result.justAnswered,
      nextQuestionId: result.nextQ.id,
    });
  } catch {
    bridge = null;
  }

  return NextResponse.json({ done: false, bridge, question: result.nextQ });
}
