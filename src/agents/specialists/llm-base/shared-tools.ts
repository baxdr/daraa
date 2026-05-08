/**
 * Shared tool library for LLM specialists.
 *
 * Each tool is a thin, deterministic wrapper around existing knowledge —
 * facts about Saudi entities, vertical-specific requirements, and the
 * shop's own answers. The LLM picks which tools to call; the tools
 * never invent numbers.
 *
 * IMPORTANT: tools must be pure (no I/O, no side effects, no random).
 * The agent's correctness depends on tool determinism — the LLM is
 * the only non-deterministic element, and it's bounded by what the
 * tools return.
 */

import type { VerticalId } from '@/knowledge/entities';
import type { Answers } from '../../chat-flow';
import type { AgentTool } from './types';

/* ─── Vertical metadata ─────────────────────────────────────────────────── */

export interface VerticalMeta {
  id: VerticalId;
  labelAr: string;
  hasKitchen: boolean;
  handlesFood: boolean;
  isService: boolean;
}

export function verticalMeta(vertical: VerticalId): VerticalMeta {
  switch (vertical) {
    case 'coffee':
      return {
        id: 'coffee',
        labelAr: 'مقهى/كوفي',
        hasKitchen: true,
        handlesFood: true,
        isService: false,
      };
    case 'restaurant':
      return {
        id: 'restaurant',
        labelAr: 'مطعم',
        hasKitchen: true,
        handlesFood: true,
        isService: false,
      };
    case 'grocery':
      return {
        id: 'grocery',
        labelAr: 'بقالة',
        hasKitchen: false,
        handlesFood: true,
        isService: false,
      };
    case 'laundry':
      return {
        id: 'laundry',
        labelAr: 'مغسلة',
        hasKitchen: false,
        handlesFood: false,
        isService: true,
      };
    case 'salon':
      return {
        id: 'salon',
        labelAr: 'صالون/تجميل',
        hasKitchen: false,
        handlesFood: false,
        isService: true,
      };
  }
}

/* ─── Shop answer summary tool — every agent calls this first ───────────── */

export interface ShopSummary {
  vertical: VerticalMeta;
  city?: string;
  companyName?: string;
  crIssueDate?: string;
  municipalLastRenewed?: string;
  civilDefenseLast?: string;
  sfdaCertDate?: string;
  extinguishersCount?: number;
  extinguishersLastCheck?: string;
  emergencyExit?: string;
  ventilation?: string;
  refrigerationCheck?: string;
  hygieneCerts?: number;
  employeeCount?: number;
  leaseExpiry?: string;
  signageApproved?: string;
}

export function summariseAnswers(
  answers: Answers,
  vertical: VerticalId,
  cityLabel?: string,
): ShopSummary {
  return {
    vertical: verticalMeta(vertical),
    ...(cityLabel ? { city: cityLabel } : {}),
    ...(answers.q_company_name ? { companyName: answers.q_company_name } : {}),
    ...(answers.op3_cr_issue_date ? { crIssueDate: answers.op3_cr_issue_date } : {}),
    ...(answers.op4_municipal_last_renewed
      ? { municipalLastRenewed: answers.op4_municipal_last_renewed }
      : {}),
    ...(answers.op5_civil_defense_last ? { civilDefenseLast: answers.op5_civil_defense_last } : {}),
    ...(answers.op6_sfda_cert_date ? { sfdaCertDate: answers.op6_sfda_cert_date } : {}),
    ...(typeof answers.op5b_extinguishers_count === 'number'
      ? { extinguishersCount: answers.op5b_extinguishers_count }
      : {}),
    ...(answers.op5c_extinguishers_last_check
      ? { extinguishersLastCheck: answers.op5c_extinguishers_last_check }
      : {}),
    ...(answers.op5d_emergency_exit ? { emergencyExit: answers.op5d_emergency_exit } : {}),
    ...(answers.op6b_ventilation ? { ventilation: answers.op6b_ventilation } : {}),
    ...(answers.op6c_refrigeration_check
      ? { refrigerationCheck: answers.op6c_refrigeration_check }
      : {}),
    ...(typeof answers.op7_hygiene_certs === 'number'
      ? { hygieneCerts: answers.op7_hygiene_certs }
      : {}),
    ...(typeof answers.op8_employee_count === 'number'
      ? { employeeCount: answers.op8_employee_count }
      : {}),
    ...(answers.op9_lease_expiry ? { leaseExpiry: answers.op9_lease_expiry } : {}),
    ...(answers.op10_signage_approved ? { signageApproved: answers.op10_signage_approved } : {}),
  };
}

export function getShopSummaryTool(summary: ShopSummary): AgentTool {
  return {
    name: 'get_shop_summary',
    description:
      'يعطي ملخّص بيانات المحل من إجابات المستخدم: النوع، المدينة، تواريخ الرخص، البنية التحتية للسلامة، عدد الموظفين. استدعِها أولاً قبل أي قرار.',
    input_schema: { type: 'object', properties: {} },
    handler: async () => summary,
  };
}

/* ─── Renewal urgency tool — used by every specialist ───────────────────── */

import { urgencyOf, daysUntil } from '@/lib/renewals';

export function checkRenewalUrgencyTool(today: Date = new Date()): AgentTool {
  const todayIso = today.toISOString().slice(0, 10);
  return {
    name: 'check_renewal_urgency',
    description:
      'يحسب مستوى استعجال تجديد رخصة بناءً على تاريخ انتهائها (ok / soon / urgent / overdue) وعدد الأيام المتبقية. مرّر التاريخ بصيغة YYYY-MM-DD.',
    input_schema: {
      type: 'object',
      properties: {
        due_date: {
          type: 'string',
          description: 'تاريخ انتهاء الرخصة بصيغة YYYY-MM-DD',
        },
      },
      required: ['due_date'],
    },
    handler: async (input) => {
      const due = String(input.due_date);
      return {
        urgency: urgencyOf(due, today),
        days_until: daysUntil(due, today),
        today: todayIso,
      };
    },
  };
}

/* ─── Date math tool — common across most specialists ───────────────────── */

export const ADD_MONTHS_TOOL: AgentTool = {
  name: 'add_months_to_date',
  description: 'يضيف عدد من الأشهر إلى تاريخ ويرجع التاريخ الجديد بصيغة YYYY-MM-DD.',
  input_schema: {
    type: 'object',
    properties: {
      base_date: { type: 'string', description: 'YYYY-MM-DD' },
      months: { type: 'number' },
    },
    required: ['base_date', 'months'],
  },
  handler: async (input) => {
    const baseDate = String(input.base_date);
    const months = Number(input.months);
    const [y, m, d] = baseDate.split('-').map(Number);
    const year = y ?? 1970;
    const date = new Date(Date.UTC(year, (m ?? 1) - 1 + months, d ?? 1));
    return { date: date.toISOString().slice(0, 10) };
  },
};

/* ─── Vertical bundle tool ──────────────────────────────────────────────── */

export const VERTICAL_REQUIREMENTS_TOOL: AgentTool = {
  name: 'lookup_vertical_requirements',
  description:
    'يرجع قائمة الجهات الحكومية اللي يحتاجها هذا النوع من المحلات (مثلاً مطعم يحتاج SFDA + MoH، صالون يحتاج MoH فقط، مغسلة ما تحتاج لا SFDA ولا MoH).',
  input_schema: {
    type: 'object',
    properties: {
      vertical: {
        type: 'string',
        enum: ['coffee', 'restaurant', 'grocery', 'laundry', 'salon'],
      },
    },
    required: ['vertical'],
  },
  handler: async (input) => {
    const vertical = String(input.vertical) as VerticalId;
    const base = ['mci', 'zatca', 'mohr_gosi', 'civil_defense', 'municipality'];
    switch (vertical) {
      case 'coffee':
      case 'grocery':
        return { entities: [...base, 'sfda'] };
      case 'restaurant':
        return { entities: [...base, 'sfda', 'moh'] };
      case 'laundry':
        return { entities: base };
      case 'salon':
        return { entities: [...base, 'moh'] };
      default:
        return { entities: base };
    }
  },
};
