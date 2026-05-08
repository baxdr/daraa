/**
 * Chat-agent helpers — pure utilities used by all turn paths
 * (fast-path, scripted fallback, and the Claude turn).
 */

import { QUESTIONS, type Answers, type Question, type QuestionId } from '../chat-flow';
import type { InputAffordance, QuickReply } from './types';

/**
 * Authoritative QuestionId list, used for `isQuestionId` runtime guards on
 * Claude's untyped JSON output. The compiler enforces exhaustiveness through
 * the `Question` indexed access — adding a new id without updating this list
 * makes the type guard wrong but does not type-check; treat as a registry.
 */
const QUESTION_IDS: readonly QuestionId[] = [
  'q0_mode',
  'q_company_name',
  'est1_vertical',
  'est2_city',
  'est3_partner_count',
  'est4_capital_sar',
  'est5_foreign_partner',
  'est6_lease_status',
  'q1_company_type',
  'q2_employee_count',
  'q3_processes_personal_data',
  'q4_user_count',
  'q5_dpo_appointed',
  'q6_data_location',
  'q7_government_clients',
  'q8_website_url',
  'op1_vertical',
  'op2_city',
  'op3_cr_issue_date',
  'op4_municipal_last_renewed',
  'op5_civil_defense_last',
  'op6_sfda_cert_date',
  'op7_employee_count',
  'op8_lease_expiry',
  'op9_has_website',
  'op10_website_url',
];

export function isQuestionId(s: string): s is QuestionId {
  return (QUESTION_IDS as readonly string[]).includes(s);
}

export function inputAffordanceFor(q: Question): InputAffordance | undefined {
  if (!q.input) {
    // For choice questions we still offer a free-text input so the user
    // can type an answer like "الرياض" instead of clicking.
    return { kind: 'text', placeholder: 'اكتب جوابك أو اختر من الاقتراحات' };
  }
  if (q.input.kind === 'text') {
    return { kind: 'text', placeholder: q.input.placeholder };
  }
  if (q.input.kind === 'number') {
    return { kind: 'number', placeholder: q.input.placeholder };
  }
  if (q.input.kind === 'url_or_skip') {
    return {
      kind: 'url_or_skip',
      placeholder: q.input.placeholder,
      ...(q.input.skipLabel ? { skipLabel: q.input.skipLabel } : {}),
    };
  }
  if (q.input.kind === 'date' || q.input.kind === 'date_or_skip') {
    return {
      kind: q.input.kind,
      placeholder: q.input.placeholder,
      ...(q.input.skipLabel ? { skipLabel: q.input.skipLabel } : {}),
    };
  }
  return { kind: 'text', placeholder: 'اكتب جوابك' };
}

/**
 * If Claude returns suggestions, prefer them — but fall back to the scripted
 * options for the next question when Claude omitted them.
 */
export function computeSuggestions(nextId: QuestionId, fromClaude?: QuickReply[]): QuickReply[] {
  const q = QUESTIONS[nextId];
  // For free-input questions (text/number/url/date), never accept Claude's
  // invented suggestion chips — they produced a stray "ما أتذكر / ما عندي"
  // button for a date field in an earlier bug. The only clickable option
  // on input-kind questions is the scripted skip button handled separately.
  if (!q.options) return [];

  if (fromClaude && Array.isArray(fromClaude) && fromClaude.length > 0) {
    const validValues = new Set(q.options.map((o) => o.value));
    const filtered = fromClaude.filter((s) => s && s.value && validValues.has(s.value));
    if (filtered.length > 0) return filtered;
  }
  return q.options.map((o) => ({ label: o.label, value: o.value }));
}

export function compilationMessage(answers: Answers): string {
  const name = answers.q_company_name?.trim();
  return name
    ? `تمام يا بطل. جمعت كل اللي نحتاجه عن ${name}. الوكلاء الحين يشتغلون ويجهّزون لك التقرير…`
    : 'تمام. جمعت كل اللي نحتاجه. الوكلاء الحين يشتغلون ويجهّزون لك التقرير…';
}
