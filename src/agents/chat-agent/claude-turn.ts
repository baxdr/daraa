/**
 * Claude turn — calls the LLM, validates extractions deterministically,
 * walks the scripted flow forward to find the first unanswered field, and
 * composes the response payload for the API.
 */

import { callClaude, MODELS, parseJsonResponse } from '@/lib/claude';
import {
  FIRST_QUESTION,
  QUESTIONS,
  nextQuestion,
  validateAnswer,
  type QuestionId,
} from '../chat-flow';
import type { ChatSession } from '@/lib/chat-sessions';
import {
  compilationMessage,
  computeSuggestions,
  inputAffordanceFor,
  isQuestionId,
} from './helpers';
import { SYSTEM_PROMPT, buildUserPrompt, type ClaudeResponse } from './prompt';
import type { ChatAgentTurn } from './types';

export async function claudeTurn(session: ChatSession, userInput: string): Promise<ChatAgentTurn> {
  const prompt = buildUserPrompt(session, userInput);
  const raw = await callClaude({
    model: MODELS.sonnet,
    system: SYSTEM_PROMPT,
    user: prompt,
    maxTokens: 900,
  });

  const parsed = parseJsonResponse<ClaudeResponse>(raw);
  const extracted: QuestionId[] = [];

  // Validate + apply each extraction. CRITICAL: never overwrite a field
  // that's already been answered. Without this guard, Claude can re-extract
  // q_company_name from some later sentence ("...عندنا ثاوي جاهزين...")
  // and silently rewrite the user's original name mid-flow. Fields are
  // one-shot-write only.
  if (parsed.extractions && typeof parsed.extractions === 'object') {
    for (const [rawKey, rawValue] of Object.entries(parsed.extractions)) {
      if (!isQuestionId(rawKey)) continue;
      if (rawValue === undefined || rawValue === null) continue;
      if ((session.answers as Record<string, unknown>)[rawKey] !== undefined) continue;
      const str = typeof rawValue === 'number' ? String(rawValue) : String(rawValue);
      const validated = validateAnswer(rawKey, str);
      if (!validated.ok) continue;
      (session.answers as Record<string, unknown>)[rawKey] = validated.value;
      extracted.push(rawKey);
    }
  }

  // Decide next question ourselves — walk the scripted flow from the
  // beginning and stop at the first UNANSWERED field. This is essential
  // because Claude may fill a late field (e.g. est6_lease_status) while
  // leaving an earlier one blank (e.g. q_company_name) — if we walked
  // forward from the last-answered field we'd miss the gap and end the
  // chat prematurely.
  let nextId: QuestionId | null = FIRST_QUESTION;
  while (nextId && session.answers[nextId] !== undefined) {
    nextId = nextQuestion(nextId, session.answers);
  }
  session.currentQuestion = nextId;

  if (!nextId) {
    return {
      session,
      done: true,
      nextQuestionId: null,
      agentMessage: parsed.message?.trim() || compilationMessage(session.answers),
      extracted,
    };
  }

  const nextQ = QUESTIONS[nextId];
  const suggestions = computeSuggestions(nextId, parsed.suggestions);
  const nextQInput = inputAffordanceFor(nextQ);
  return {
    session,
    done: false,
    nextQuestionId: nextId,
    agentMessage: parsed.message?.trim() || nextQ.text,
    ...(suggestions.length ? { suggestions } : {}),
    ...(nextQInput ? { input: nextQInput } : {}),
    extracted,
  };
}
