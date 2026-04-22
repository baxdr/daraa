/**
 * In-memory chat session store.
 *
 * Each POST handler in a serverless runtime can get a fresh module instance,
 * so this Map is lost between cold starts. Fine for local dev and a
 * warm-function demo; persistence (Supabase) is a separate concern.
 *
 * State-machine logic lives in chat-flow.ts. This store just remembers
 * where each session is in that machine.
 */

import { nanoid } from 'nanoid';
import {
  FIRST_QUESTION,
  QUESTIONS,
  nextQuestion,
  validateAnswer,
  type Answers,
  type Question,
  type QuestionId,
} from '@/agents/chat-flow';

export interface ChatSession {
  id: string;
  createdAt: number;
  currentQuestion: QuestionId | null; // null => flow complete
  answers: Answers;
}

// Stash on globalThis so Next.js dev-mode HMR doesn't reset the store between
// route-handler compilations. In production (single process, no HMR) this has
// no observable effect — it's still a plain in-process Map.
const globalForSessions = globalThis as unknown as { __daraaChatSessions?: Map<string, ChatSession> };
const SESSIONS: Map<string, ChatSession> =
  globalForSessions.__daraaChatSessions ?? (globalForSessions.__daraaChatSessions = new Map());
const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hour

function prune() {
  const cutoff = Date.now() - SESSION_TTL_MS;
  for (const [id, s] of SESSIONS) if (s.createdAt < cutoff) SESSIONS.delete(id);
}

export function createSession(): ChatSession {
  prune();
  const session: ChatSession = {
    id: nanoid(),
    createdAt: Date.now(),
    currentQuestion: FIRST_QUESTION,
    answers: {},
  };
  SESSIONS.set(session.id, session);
  return session;
}

export function getSession(id: string): ChatSession | null {
  return SESSIONS.get(id) ?? null;
}

/**
 * Record an answer for the session's current question and advance to the next.
 * Returns the updated session + the new current question (or null if done).
 */
export function recordAnswer(
  sessionId: string,
  rawAnswer: string,
): { ok: true; session: ChatSession; nextQ: Question | null; justAnswered: QuestionId } | { ok: false; error: string } {
  const session = SESSIONS.get(sessionId);
  if (!session) return { ok: false, error: 'جلسة غير معروفة' };
  if (!session.currentQuestion) return { ok: false, error: 'الجلسة منتهية' };

  const justAnswered = session.currentQuestion;
  const validated = validateAnswer(justAnswered, rawAnswer);
  if (!validated.ok) return { ok: false, error: validated.error };

  (session.answers as Record<string, unknown>)[justAnswered] = validated.value;
  const next = nextQuestion(justAnswered, session.answers);
  session.currentQuestion = next;

  return { ok: true, session, nextQ: next ? QUESTIONS[next] : null, justAnswered };
}
