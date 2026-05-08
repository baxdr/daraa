/**
 * Chat state machine — type exports.
 *
 * The chat is NOT a free-form agentic conversation (see DESIGN.md §16.2).
 * It's a hardcoded branching flow; the LLM's only job is on-demand term
 * explanations. These types describe the question shape, the typed answer
 * dictionary, and the input/option structure.
 */

import type { TermId } from '@/knowledge/terms';
import type { VerticalId } from '@/knowledge/entities';

export type Mode = 'establishment' | 'compliance' | 'operational_compliance';

export type QuestionId =
  // Mode selector (always first).
  | 'q0_mode'
  // Company/project name — shared across both modes, asked right after mode.
  | 'q_company_name'
  // Establishment branch.
  | 'est1_vertical'
  | 'est2_city'
  | 'est3_partner_count'
  | 'est4_capital_sar'
  | 'est5_foreign_partner'
  | 'est6_lease_status'
  // Compliance branch (v2 questions).
  | 'q1_company_type'
  | 'q2_employee_count'
  | 'q3_processes_personal_data'
  | 'q4_user_count'
  | 'q5_dpo_appointed'
  | 'q6_data_location'
  | 'q7_government_clients'
  | 'q8_website_url'
  // Operational-compliance branch (physical businesses).
  | 'op1_vertical'
  | 'op2_city'
  | 'op3_cr_issue_date'
  | 'op4_municipal_last_renewed'
  | 'op5_civil_defense_last'
  | 'op6_sfda_cert_date'
  | 'op7_employee_count'
  | 'op8_lease_expiry'
  | 'op9_has_website'
  | 'op10_website_url';

export type AnswerValue = string;

export interface Answers {
  // Mode selector.
  q0_mode?: Mode;

  // Company/project name — mandatory for both branches.
  q_company_name?: string;

  // Establishment branch.
  est1_vertical?: VerticalId;
  est2_city?: string;
  est3_partner_count?: number;
  est4_capital_sar?: number;
  est5_foreign_partner?: 'yes' | 'no';
  est6_lease_status?: 'not_signed' | 'signed' | 'no_location_yet';

  // Compliance branch.
  q1_company_type?: 'saas' | 'ecommerce' | 'fintech' | 'services' | 'other';
  q2_employee_count?: number;
  q3_processes_personal_data?: 'yes' | 'no';
  q4_user_count?: 'under_10k' | '10k_100k' | 'over_100k';
  q5_dpo_appointed?: 'yes' | 'no' | 'unknown';
  q6_data_location?: 'saudi' | 'outside' | 'unknown';
  q7_government_clients?: 'yes' | 'no';
  q8_website_url?: string | null;

  // Operational-compliance branch.
  op1_vertical?: 'restaurant' | 'salon' | 'construction' | 'retail';
  op2_city?: string;
  op3_cr_issue_date?: string; // ISO YYYY-MM-DD
  op4_municipal_last_renewed?: string | null;
  op5_civil_defense_last?: string | null;
  op6_sfda_cert_date?: string | null;
  op7_employee_count?: number;
  op8_lease_expiry?: string | null;
  op9_has_website?: 'yes' | 'no';
  op10_website_url?: string | null;
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
