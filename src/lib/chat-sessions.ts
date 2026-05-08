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

const QUESTION_ORDER: readonly QuestionId[] = [
  'q_company_name',
  'op1_vertical',
  'op2_city',
  'op3_cr_issue_date',
  'op4_municipal_last_renewed',
  'op5_civil_defense_last',
  'op5b_extinguishers_count',
  'op5c_extinguishers_last_check',
  'op5d_emergency_exit',
  'op6_sfda_cert_date',
  'op6b_ventilation',
  'op6c_refrigeration_check',
  'op7_hygiene_certs',
  'op8_employee_count',
  'op9_lease_expiry',
  'op10_signage_approved',
];

export interface ChatSession {
  id: string;
  createdAt: number;
  currentQuestion: QuestionId | null; // null => flow complete
  answers: Answers;
}

// Stash on globalThis so Next.js dev-mode HMR doesn't reset the store between
// route-handler compilations. In production (single process, no HMR) this has
// no observable effect — it's still a plain in-process Map.
const globalForSessions = globalThis as unknown as {
  __daraaChatSessions?: Map<string, ChatSession>;
};
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
):
  | { ok: true; session: ChatSession; nextQ: Question | null; justAnswered: QuestionId }
  | { ok: false; error: string } {
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

/**
 * Seed a fresh session with known answers (used by the establishment →
 * compliance handoff) and advance `currentQuestion` to the first unanswered
 * field in priority order. Silently drops any entry that fails validation.
 */
export function applyPrefill(session: ChatSession, prefill: Record<string, unknown>): void {
  for (const [rawKey, rawValue] of Object.entries(prefill)) {
    if (!QUESTION_ORDER.includes(rawKey as QuestionId)) continue;
    if (rawValue === undefined || rawValue === null) continue;
    const str = typeof rawValue === 'number' ? String(rawValue) : String(rawValue);
    const validated = validateAnswer(rawKey as QuestionId, str);
    if (!validated.ok) continue;
    (session.answers as Record<string, unknown>)[rawKey] = validated.value;
  }
  session.currentQuestion = firstUnanswered(session.answers);
}

function firstUnanswered(answers: Answers): QuestionId | null {
  // Walk the scripted flow — stop at the first unanswered required field.
  let current: QuestionId | null = FIRST_QUESTION;
  while (current) {
    if ((answers as Record<string, unknown>)[current] === undefined) return current;
    current = nextQuestion(current, answers);
  }
  return null;
}
