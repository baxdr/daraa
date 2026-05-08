import type { DocumentKind } from '@/agents/document-agent';
import type { Gap } from '@/agents/analysis-agent';
import type { Answers } from '@/agents/chat-flow';

export interface DocumentRecommendation {
  kind: DocumentKind;
  priorityAr: string;
  whyAr: string;
}

const PDPL_POLICY_RULE_IDS = [
  'pdpl_privacy_policy_published',
  'pdpl_arabic_available',
  'pdpl_purpose_stated',
  'pdpl_retention_stated',
  'pdpl_cross_border_disclosed',
  'pdpl_third_party_disclosed',
  'pdpl_trackers_disclosed',
  'pdpl_form_consent_present',
];

export function buildRecommendations(answers: Answers, gaps: Gap[]): DocumentRecommendation[] {
  const recs: DocumentRecommendation[] = [];

  const hasPolicyGap = gaps.some((g) => PDPL_POLICY_RULE_IDS.includes(g.ruleId));
  const hasDpoGap = gaps.some((g) => g.ruleId === 'pdpl_dpo_required');
  const processesData = answers.q3_processes_personal_data === 'yes';

  if (hasPolicyGap || processesData) {
    recs.push({
      kind: 'privacy_policy',
      priorityAr: hasPolicyGap ? 'ضروري' : 'موصى به',
      whyAr: hasPolicyGap
        ? 'سياسة الخصوصية الحالية ناقصة أو مفقودة — نولّد نسخة جديدة مخصّصة لشركتك.'
        : 'راجع سياستك الحالية ضد القالب — أو ولّد نسخة مخصّصة.',
    });
  }
  if (hasDpoGap) {
    recs.push({
      kind: 'dpo_appointment',
      priorityAr: 'ضروري',
      whyAr: 'لأن قاعدة المستخدمين كبيرة، النظام يتطلب تعيين رسمي لمسؤول حماية بيانات.',
    });
  }
  if (processesData) {
    recs.push({
      kind: 'processing_register',
      priorityAr: 'مطلوب',
      whyAr: 'سجل إلزامي يُقدَّم لـ SDAIA عند التفتيش.',
    });
    recs.push({
      kind: 'incident_response',
      priorityAr: 'موصى به',
      whyAr: 'إجراء جاهز يحدد وش تسوي لو حدث اختراق.',
    });
  }
  return recs;
}
