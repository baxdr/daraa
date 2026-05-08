/**
 * Scripted fallback — validates a raw answer against the current question and
 * advances one step. Used when Claude is unavailable or the user clicks the
 * `__skip__` sentinel that the LLM doesn't understand.
 */

import { QUESTIONS, nextQuestion, validateAnswer } from '../chat-flow';
import type { ChatSession } from '@/lib/chat-sessions';
import { compilationMessage, inputAffordanceFor } from './helpers';
import type { ChatAgentError, ChatAgentTurn } from './types';

export function scriptedFallback(
  session: ChatSession,
  rawAnswer: string,
): ChatAgentTurn | ChatAgentError {
  const current = session.currentQuestion;
  if (!current) return { error: 'الجلسة منتهية' };
  const validated = validateAnswer(current, rawAnswer);
  if (!validated.ok) return { error: validated.error };

  (session.answers as Record<string, unknown>)[current] = validated.value;
  const next = nextQuestion(current, session.answers);
  session.currentQuestion = next;

  if (!next) {
    return {
      session,
      done: true,
      nextQuestionId: null,
      agentMessage: compilationMessage(session.answers),
      extracted: [current],
    };
  }
  const nextQ = QUESTIONS[next];
  const nextQOptions = nextQ.options
    ? nextQ.options.map((o) => ({ label: o.label, value: o.value }))
    : undefined;
  const nextQInput = inputAffordanceFor(nextQ);
  return {
    session,
    done: false,
    nextQuestionId: next,
    agentMessage: nextQ.text + (nextQ.hint ? `\n\n${nextQ.hint}` : ''),
    ...(nextQOptions ? { suggestions: nextQOptions } : {}),
    ...(nextQInput ? { input: nextQInput } : {}),
    extracted: [current],
  };
}
