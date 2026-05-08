/**
 * Flow resolver — given the current question and prior answers, picks the next question id.
 *
 * Returns `null` when the flow is done; the caller (orchestrator) then
 * produces the project record.
 */

import type { Answers, QuestionId } from './types';

export function nextQuestion(current: QuestionId, answers: Answers): QuestionId | null {
  switch (current) {
    /* ---- mode selector ---- */
    case 'q0_mode':
      return 'q_company_name';
    case 'q_company_name':
      if (answers.q0_mode === 'establishment') return 'est1_vertical';
      if (answers.q0_mode === 'operational_compliance') return 'op1_vertical';
      return 'q1_company_type';

    /* ---- establishment branch ---- */
    case 'est1_vertical':
      return 'est2_city';
    case 'est2_city':
      return 'est3_partner_count';
    case 'est3_partner_count':
      return 'est4_capital_sar';
    case 'est4_capital_sar':
      return 'est5_foreign_partner';
    case 'est5_foreign_partner':
      return 'est6_lease_status';
    case 'est6_lease_status':
      return null; // establishment flow ends here; resolver produces the roadmap

    /* ---- compliance branch ---- */
    case 'q1_company_type':
      return 'q2_employee_count';
    case 'q2_employee_count':
      return 'q3_processes_personal_data';
    case 'q3_processes_personal_data':
      return answers.q3_processes_personal_data === 'no'
        ? 'q7_government_clients'
        : 'q4_user_count';
    case 'q4_user_count':
      return answers.q4_user_count === 'over_100k' ? 'q5_dpo_appointed' : 'q6_data_location';
    case 'q5_dpo_appointed':
      return 'q6_data_location';
    case 'q6_data_location':
      return 'q7_government_clients';
    case 'q7_government_clients':
      return 'q8_website_url';
    case 'q8_website_url':
      return null;

    /* ---- operational-compliance branch ---- */
    case 'op1_vertical':
      return 'op2_city';
    case 'op2_city':
      return 'op3_cr_issue_date';
    case 'op3_cr_issue_date':
      return 'op4_municipal_last_renewed';
    case 'op4_municipal_last_renewed':
      return 'op5_civil_defense_last';
    case 'op5_civil_defense_last':
      // SFDA only applies to restaurants.
      return answers.op1_vertical === 'restaurant' ? 'op6_sfda_cert_date' : 'op7_employee_count';
    case 'op6_sfda_cert_date':
      return 'op7_employee_count';
    case 'op7_employee_count':
      return 'op8_lease_expiry';
    case 'op8_lease_expiry':
      return 'op9_has_website';
    case 'op9_has_website':
      return answers.op9_has_website === 'yes' ? 'op10_website_url' : null;
    case 'op10_website_url':
      return null;
  }
}
