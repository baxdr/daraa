/**
 * Fast path — exact button-value or button-label match against the current
 * question's options. Lets a button click skip the LLM entirely for
 * deterministic inputs.
 */

import { QUESTIONS, nextQuestion, validateAnswer } from '../chat-flow';
import type { ChatSession } from '@/lib/chat-sessions';
import { compilationMessage, inputAffordanceFor } from './helpers';
import type { ChatAgentTurn } from './types';

export function tryFastPath(session: ChatSession, rawAnswer: string): ChatAgentTurn | null {
  const current = session.currentQuestion;
  if (!current) return null;
  const q = QUESTIONS[current];
  if (!q.options) return null;
  const match = q.options.find((o) => o.value === rawAnswer || o.label.trim() === rawAnswer.trim());
  if (!match) return null;

  const validated = validateAnswer(current, match.value);
  if (!validated.ok) return null;
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
