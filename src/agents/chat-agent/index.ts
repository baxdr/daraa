/**
 * Chat agent — public barrel + `advanceChat` orchestrator.
 *
 * Given the session's accumulated answers and the user's latest message
 * (free text OR a button click), this:
 *
 *   1. Calls Claude with the strict question schema (see ./prompt.ts),
 *   2. Claude extracts any info present in the user's text — even buried in
 *      Gulf-Arabic colloquial sentences,
 *   3. Claude picks the next single field to ask about and writes a natural
 *      reply,
 *   4. Claude suggests quick-reply chips when the field has closed options.
 *
 * Validation stays deterministic — every extraction Claude returns goes
 * through `validateAnswer` before being stored. Invalid values are dropped
 * and the loop re-asks for that field.
 *
 * Fallback: when the API key is missing or Claude errors, we revert to the
 * scripted flow (validate → next-question → local bridge sentence) so the
 * chat still works in degraded mode.
 */

import { MissingApiKeyError, hasApiKey } from '@/lib/claude';
import type { ChatSession } from '@/lib/chat-sessions';
import { tryFastPath } from './fast-path';
import { scriptedFallback } from './scripted';
import { claudeTurn } from './claude-turn';
import type { ChatAgentError, ChatAgentTurn } from './types';

export type { QuickReply, InputAffordance, ChatAgentTurn, ChatAgentError } from './types';

/**
 * Advance the chat by one user turn. Mutates session in place.
 */
export async function advanceChat(params: {
  session: ChatSession;
  userInput: string;
}): Promise<ChatAgentTurn | ChatAgentError> {
  const { session, userInput } = params;
  const trimmed = userInput.trim();
  if (!trimmed) return { error: 'اكتب شي أو اختر من الاقتراحات' };

  // Short-circuit: the explicit "__skip__" sentinel (only sent by the skip
  // button on url_or_skip / date_or_skip questions). Claude doesn't know
  // this token and would write a completion message without actually
  // clearing the field — leaving the flow stuck. Route straight to the
  // scripted validator which maps __skip__ → null correctly.
  if (trimmed === '__skip__') {
    return scriptedFallback(session, trimmed);
  }

  // Fast path — exact match on the CURRENT question's options. Typical
  // button click. Short-circuits the LLM for deterministic inputs.
  const fastPath = tryFastPath(session, trimmed);
  if (fastPath) return fastPath;

  // Claude path — extract + compose.
  if (hasApiKey()) {
    try {
      return await claudeTurn(session, trimmed);
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) {
        console.warn(
          '[chat-agent] Claude turn failed, falling back to scripted path:',
          err instanceof Error ? err.message : err,
        );
      }
      // Fall through to scripted path.
    }
  }

  return scriptedFallback(session, trimmed);
}
