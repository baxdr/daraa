/**
 * Company-context derivation from chat answers — internal helper used by
 * each document generator to format the LLM prompt + drive fallback branches.
 */

import type { Answers } from '../chat-flow';

export interface CompanyContext {
  companyTypeAr: string;
  employeeCount: number | null;
  processesPersonalData: boolean;
  userScale: string | null;
  dataHostedOutside: boolean;
  hasGovernmentClients: boolean;
  hasDpo: boolean;
}

export function buildCompanyContext(a: Answers): CompanyContext {
  return {
    companyTypeAr: companyTypeLabel(a.q1_company_type),
    employeeCount: a.q2_employee_count ?? null,
    processesPersonalData: a.q3_processes_personal_data === 'yes',
    userScale: userScaleLabel(a.q4_user_count),
    dataHostedOutside: a.q6_data_location === 'outside',
    hasGovernmentClients: a.q7_government_clients === 'yes',
    hasDpo: a.q5_dpo_appointed === 'yes',
  };
}

function companyTypeLabel(v: Answers['q1_company_type']): string {
  switch (v) {
    case 'saas':
      return 'شركة تقنية (SaaS)';
    case 'ecommerce':
      return 'متجر إلكتروني';
    case 'fintech':
      return 'شركة تقنية مالية';
    case 'services':
      return 'شركة خدمات';
    default:
      return 'شركة';
  }
}

function userScaleLabel(v: Answers['q4_user_count']): string | null {
  switch (v) {
    case 'under_10k':
      return 'أقل من ١٠ آلاف مستخدم';
    case '10k_100k':
      return 'بين ١٠ آلاف و ١٠٠ ألف مستخدم';
    case 'over_100k':
      return 'أكثر من ١٠٠ ألف مستخدم';
    default:
      return null;
  }
}

export function companyContextPrompt(ctx: CompanyContext): string {
  return (
    `الشركة: ${ctx.companyTypeAr}.\n` +
    `عدد الموظفين: ${ctx.employeeCount ?? 'غير محدد'}.\n` +
    `تعالج بيانات شخصية: ${ctx.processesPersonalData ? 'نعم' : 'لا'}.\n` +
    `حجم قاعدة المستخدمين: ${ctx.userScale ?? 'غير محدد'}.\n` +
    `استضافة البيانات: ${ctx.dataHostedOutside ? 'خارج المملكة' : 'داخل المملكة (أو غير محدد)'}.\n` +
    `تتعامل مع جهات حكومية: ${ctx.hasGovernmentClients ? 'نعم' : 'لا'}.\n` +
    `لديها DPO معيّن: ${ctx.hasDpo ? 'نعم' : 'لا'}.`
  );
}
