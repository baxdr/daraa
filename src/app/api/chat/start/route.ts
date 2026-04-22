import { NextResponse } from 'next/server';
import { QUESTIONS } from '@/agents/chat-flow';
import { createSession } from '@/lib/chat-sessions';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

/**
 * POST /api/chat/start — initialise a chat session, return the first question.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'chat-start', max: 30, windowMs: 60_000 });
  if (limited) return limited;

  const session = createSession();
  const question = session.currentQuestion ? QUESTIONS[session.currentQuestion] : null;
  return NextResponse.json({ sessionId: session.id, question });
}
