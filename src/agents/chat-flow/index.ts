/**
 * Chat flow — public barrel.
 *
 * Consumers import from `@/agents/chat-flow` (no path change required by
 * Phase 5d split — the original file became this directory).
 */

export type {
  Answers,
  AnswerValue,
  InputKind,
  Mode,
  QuestionId,
  Question,
  QuickOption,
} from './types';
export { FIRST_QUESTION, QUESTIONS } from './questions';
export { nextQuestion } from './flow';
export { validateAnswer } from './validators';
