/**
 * Flow resolver — given the current question and prior answers, picks the
 * next question id. Returns `null` when the flow is done; the caller
 * (orchestrator) then produces the project record.
 *
 * Single linear branch with vertical-conditional skips:
 *   - SFDA / ventilation / refrigeration → only relevant for food verticals
 *   - Hygiene certs → coffee, restaurant, grocery, salon (skip for laundry)
 */

import type { Answers, QuestionId } from './types';

type FoodVertical = 'coffee' | 'restaurant' | 'grocery';

function isFood(vertical: Answers['op1_vertical']): vertical is FoodVertical {
  return vertical === 'coffee' || vertical === 'restaurant' || vertical === 'grocery';
}

function hasHotKitchen(vertical: Answers['op1_vertical']): boolean {
  return vertical === 'coffee' || vertical === 'restaurant';
}

function hasRefrigeration(vertical: Answers['op1_vertical']): boolean {
  return vertical === 'restaurant' || vertical === 'grocery';
}

function needsHygieneCerts(vertical: Answers['op1_vertical']): boolean {
  return (
    vertical === 'coffee' ||
    vertical === 'restaurant' ||
    vertical === 'grocery' ||
    vertical === 'salon'
  );
}

export function nextQuestion(current: QuestionId, answers: Answers): QuestionId | null {
  switch (current) {
    case 'q_company_name':
      return 'op1_vertical';
    case 'op1_vertical':
      return 'op2_city';
    case 'op2_city':
      return 'op3_cr_issue_date';
    case 'op3_cr_issue_date':
      return 'op4_municipal_last_renewed';
    case 'op4_municipal_last_renewed':
      return 'op5_civil_defense_last';
    case 'op5_civil_defense_last':
      return 'op5b_extinguishers_count';
    case 'op5b_extinguishers_count':
      return 'op5c_extinguishers_last_check';
    case 'op5c_extinguishers_last_check':
      return 'op5d_emergency_exit';
    case 'op5d_emergency_exit':
      return isFood(answers.op1_vertical) ? 'op6_sfda_cert_date' : nextAfterSfda(answers);
    case 'op6_sfda_cert_date':
      return nextAfterSfda(answers);
    case 'op6b_ventilation':
      return hasRefrigeration(answers.op1_vertical)
        ? 'op6c_refrigeration_check'
        : nextAfterRefrigeration(answers);
    case 'op6c_refrigeration_check':
      return nextAfterRefrigeration(answers);
    case 'op7_hygiene_certs':
      return 'op8_employee_count';
    case 'op8_employee_count':
      return 'op9_lease_expiry';
    case 'op9_lease_expiry':
      return 'op10_signage_approved';
    case 'op10_signage_approved':
      return null;
  }
}

function nextAfterSfda(answers: Answers): QuestionId {
  if (hasHotKitchen(answers.op1_vertical)) return 'op6b_ventilation';
  if (hasRefrigeration(answers.op1_vertical)) return 'op6c_refrigeration_check';
  return nextAfterRefrigeration(answers);
}

function nextAfterRefrigeration(answers: Answers): QuestionId {
  if (needsHygieneCerts(answers.op1_vertical)) return 'op7_hygiene_certs';
  return 'op8_employee_count';
}
