/**
 * Public types for the chat agent.
 *
 * Kept separate from the orchestrator so consumers (API routes, tests) can
 * import the shape without pulling in Claude-prompt heavy modules.
 */

import type { QuestionId } from '../chat-flow';
import type { ChatSession } from '@/lib/chat-sessions';

export interface QuickReply {
  label: string;
  value: string;
}

export interface InputAffordance {
  kind: 'text' | 'number' | 'url_or_skip' | 'date' | 'date_or_skip';
  placeholder: string;
  skipLabel?: string;
}

export interface ChatAgentTurn {
  /** The session with updated `answers` + `currentQuestion`. (Mutated in place.) */
  session: ChatSession;
  /** Agent's message to render. */
  agentMessage: string;
  /** True when all required fields are collected. */
  done: boolean;
  /** What we're about to ask — null when done. */
  nextQuestionId: QuestionId | null;
  /** Optional quick-reply suggestions the UI renders as clickable chips. */
  suggestions?: QuickReply[];
  /** Optional affordance — free text / number / URL box. */
  input?: InputAffordance;
  /** IDs of fields extracted this turn (for UI feedback / debug). */
  extracted: QuestionId[];
}

export interface ChatAgentError {
  error: string;
}
