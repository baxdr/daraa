/**
 * Chat state machine — type exports.
 *
 * Single mode post-pivot: small physical shop tracking. The chat is a
 * hardcoded branching flow (NOT a free-form agentic conversation —
 * see DESIGN.md §16.2). The LLM's only job is on-demand term
 * explanations.
 */

import type { TermId } from '@/knowledge/terms';
import type { VerticalId } from '@/knowledge/entities';

export type Mode = 'operational_compliance';

export type QuestionId =
  // Company/project name — first question.
  | 'q_company_name'
  // Operational-compliance branch (small physical shop).
  | 'op1_vertical'
  | 'op2_city'
  | 'op3_cr_issue_date'
  | 'op4_municipal_last_renewed'
  | 'op5_civil_defense_last'
  | 'op5b_extinguishers_count'
  | 'op5c_extinguishers_last_check'
  | 'op5d_emergency_exit'
  | 'op6_sfda_cert_date'
  | 'op6b_ventilation'
  | 'op6c_refrigeration_check'
  | 'op7_hygiene_certs'
  | 'op8_employee_count'
  | 'op9_lease_expiry'
  | 'op10_signage_approved';

export type AnswerValue = string;

export interface Answers {
  // Company/project name — mandatory.
  q_company_name?: string;

  // Operational-compliance branch.
  op1_vertical?: VerticalId;
  op2_city?: string;
  op3_cr_issue_date?: string; // ISO YYYY-MM-DD
  op4_municipal_last_renewed?: string | null;
  op5_civil_defense_last?: string | null;
  op5b_extinguishers_count?: number;
  op5c_extinguishers_last_check?: string | null;
  op5d_emergency_exit?: 'yes' | 'no';
  op6_sfda_cert_date?: string | null;
  op6b_ventilation?: 'yes' | 'no' | 'unknown';
  op6c_refrigeration_check?: string | null;
  op7_hygiene_certs?: number;
  op8_employee_count?: number;
  op9_lease_expiry?: string | null;
  op10_signage_approved?: 'yes' | 'no' | 'unknown';
}

export interface QuickOption {
  value: string; // stored value (internal key)
  label: string; // Arabic label shown on the button
}

export type InputKind =
  | 'choice'
  | 'text'
  | 'number'
  | 'url'
  | 'url_or_skip'
  | 'date'
  | 'date_or_skip';

export interface Question {
  id: QuestionId;
  /** Main Arabic text spoken by the agent. */
  text: string;
  /** Secondary explanatory line, shown in lighter weight below `text`. */
  hint?: string;
  /** Quick-answer buttons (for choice questions). */
  options?: QuickOption[];
  /** Placeholder + validation for free-input questions. */
  input?: {
    kind: Exclude<InputKind, 'choice'>;
    placeholder: string;
    skipLabel?: string; // only for url_or_skip
  };
  /** Term chips surfaced with this question — clickable to expand. */
  terms?: TermId[];
}
