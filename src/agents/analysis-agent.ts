/**
 * Analysis Agent — deterministic rule evaluator.
 *
 * Given chat answers + an optional scan result, evaluates every PDPL rule in
 * the knowledge base and produces: compliant items, gaps (plain-Arabic text +
 * legal reference + fine ceiling), a weighted compliance score, and the sum
 * of ceilings for failed rules.
 *
 * No LLM. Rule evaluation is mechanical by design.
 *
 * Fine amounts are STATUTORY CEILINGS, not predictions. The UI labels them
 * accordingly (see DESIGN.md §15.4).
 */

import { PDPL_RULES, type PdplRule, type ScanSignalMap } from '@/knowledge/pdpl';
import type { Answers } from './chat-flow';
import type { ScanResult } from './types';

export interface Gap {
  id: string;
  severity: 'critical' | 'medium' | 'low';
  ruleId: string;
  /** Plain-Arabic title — what the user sees first. */
  titleAr: string;
  /** Plain-Arabic "why is this a problem" — shown in expandable panel. */
  explanationAr: string;
  /** Legal reference label — "نظام PDPL — متطلب كذا". */
  legalRefAr: string;
  /** Statutory ceiling in SAR (NOT a predicted fine). */
  fineCeilingSar: number;
  /** Where the evidence came from: answer / scan / both. */
  evidenceSource: 'answer' | 'scan' | 'both' | 'unknown';
  /** Confidence in the gap assessment: high (direct), low (inferred / missing signal). */
  confidence: 'high' | 'low';
  /** True if درع can auto-generate a fix document (e.g. privacy policy). */
  canAutoGenerate: boolean;
}

export interface CompliantItem {
  ruleId: string;
  titleAr: string;
}

export interface AnalysisReport {
  complianceScore: number; // 0–100
  totalFineCeilingSar: number; // sum of ceilings for failed rules
  applicableRuleCount: number;
  gaps: Gap[];
  compliantItems: CompliantItem[];
  remediationPlan: RemediationWeek[];
  /** True when the URL step was skipped — flags that website-dependent rules are unknown. */
  scanSkipped: boolean;
  /** True when Claude analysis of the policy text failed (graceful degradation). */
  degradedMode: boolean;
}

export interface RemediationWeek {
  window: string; // "هذا الأسبوع" / "خلال أسبوعين" / "خلال شهر"
  tasks: string[]; // plain-Arabic action items
}

const SEVERITY_WEIGHT: Record<Gap['severity'], number> = {
  critical: 3,
  medium: 2,
  low: 1,
};

export interface AnalysisInput {
  answers: Answers;
  scan: ScanResult | null; // null when user skipped the URL
}

export function runAnalysis({ answers, scan }: AnalysisInput): AnalysisReport {
  const signals = buildSignals(answers, scan);
  const applicable = PDPL_RULES.filter((r) => isApplicable(r, answers));

  const gaps: Gap[] = [];
  const compliantItems: CompliantItem[] = [];

  let totalWeight = 0;
  let passedWeight = 0;

  for (const rule of applicable) {
    const weight = SEVERITY_WEIGHT[rule.severity];
    const verdict = evaluateRule(rule, signals);

    // Score denominator only counts rules we could actually verify. Unknowns
    // (no signal available — e.g. policy couldn't be analysed without an AI
    // key, or the URL step was skipped) are excluded rather than penalised,
    // so the score reads as "of what we could check, X% passes".
    if (verdict.state === 'pass' || verdict.state === 'fail') {
      totalWeight += weight;
    }

    if (verdict.state === 'pass') {
      passedWeight += weight;
      compliantItems.push({ ruleId: rule.id, titleAr: rule.titleAr });
    } else if (verdict.state === 'fail') {
      gaps.push(buildGap(rule, verdict.evidenceSource, verdict.confidence));
    }
  }

  const complianceScore = totalWeight > 0 ? Math.round((passedWeight / totalWeight) * 100) : 0;
  const totalFineCeilingSar = gaps
    .filter((g) => g.confidence === 'high')
    .reduce((acc, g) => acc + g.fineCeilingSar, 0);

  const scanSkipped = !scan;
  const degradedMode = Boolean(scan) && !scan?.privacyPolicy?.analysis;

  return {
    complianceScore,
    totalFineCeilingSar,
    applicableRuleCount: applicable.length,
    gaps: sortGapsBySeverity(gaps),
    compliantItems,
    remediationPlan: buildRemediationPlan(gaps),
    scanSkipped,
    degradedMode,
  };
}

/* ------------------------------------------------------------------------- */
/* Signal extraction                                                          */
/* ------------------------------------------------------------------------- */

type PartialSignals = Partial<
  Record<keyof ScanSignalMap, { value: boolean; source: 'answer' | 'scan' }>
>;

function buildSignals(answers: Answers, scan: ScanResult | null): PartialSignals {
  const s: PartialSignals = {};

  // Answer-only signals — available even when the URL step was skipped.
  if (answers.q5_dpo_appointed) {
    s.dpo_appointed = { value: answers.q5_dpo_appointed === 'yes', source: 'answer' };
  }

  if (scan?.privacyPolicy) {
    const pp = scan.privacyPolicy;
    s.privacy_policy_found = { value: Boolean(pp.found), source: 'scan' };
    s.privacy_policy_arabic = { value: Boolean(pp.hasArabicVersion), source: 'scan' };
    if (pp.analysis) {
      s.mentions_pdpl = { value: pp.analysis.mentionsPdpl, source: 'scan' };
      s.purpose_stated = { value: pp.analysis.purposeStated, source: 'scan' };
      s.legal_basis_stated = { value: pp.analysis.legalBasis, source: 'scan' };
      s.retention_stated = { value: pp.analysis.retentionPeriod, source: 'scan' };
      s.dpo_contact_listed = { value: pp.analysis.dpoContact, source: 'scan' };
      s.cross_border_disclosed = { value: pp.analysis.crossBorder, source: 'scan' };
      s.third_party_disclosed = { value: pp.analysis.thirdParty, source: 'scan' };
    }
  }

  // Security-headers signals.
  if (scan?.securityHeaders) {
    const sh = scan.securityHeaders;
    s.https_enforced = { value: sh.httpsEnforced, source: 'scan' };
    s.hsts_present = { value: sh.hsts, source: 'scan' };
    s.csp_present = { value: sh.contentSecurityPolicy, source: 'scan' };
    s.x_frame_options_present = { value: sh.xFrameOptions, source: 'scan' };
    s.referrer_policy_present = { value: sh.referrerPolicy, source: 'scan' };
  }

  // Forms signal — pass if no sensitive-data forms exist, or if every
  // sensitive-data form has both consent and a privacy link. Fail otherwise.
  if (scan?.dataForms) {
    const sensitiveForms = scan.dataForms.results;
    if (sensitiveForms.length === 0) {
      s.forms_consent_present = { value: true, source: 'scan' };
    } else {
      const allOk = sensitiveForms.every((f) => f.hasConsent && f.hasPrivacyLink);
      s.forms_consent_present = { value: allOk, source: 'scan' };
    }
  }

  // Trackers-disclosed composite signal: pass if NO trackers detected,
  // or if trackers detected AND the policy declares third-party sharing.
  // Unknown if the scan found trackers but we couldn't analyse the policy.
  if (scan?.thirdParty) {
    const trackersPresent = scan.thirdParty.detected.length > 0;
    if (!trackersPresent) {
      s.trackers_disclosed_when_present = { value: true, source: 'scan' };
    } else {
      const policyDiscloses = scan.privacyPolicy.analysis?.thirdParty;
      if (policyDiscloses === true) {
        s.trackers_disclosed_when_present = { value: true, source: 'scan' };
      } else if (policyDiscloses === false) {
        s.trackers_disclosed_when_present = { value: false, source: 'scan' };
      }
      // If policyDiscloses is undefined (Claude unavailable), leave signal
      // unset — the Analysis Agent treats missing signals as "unknown".
    }
  }

  return s;
}

/* ------------------------------------------------------------------------- */
/* Per-rule evaluation                                                        */
/* ------------------------------------------------------------------------- */

type Verdict =
  | { state: 'pass'; evidenceSource: 'answer' | 'scan' | 'both' }
  | { state: 'fail'; evidenceSource: 'answer' | 'scan' | 'both'; confidence: 'high' | 'low' }
  | { state: 'unknown' };

function evaluateRule(rule: PdplRule, signals: PartialSignals): Verdict {
  const signalKey = rule.signal;
  if (!signalKey) return { state: 'unknown' };

  const s = signals[signalKey];
  if (!s) {
    // No signal available (e.g. URL skipped). Report as unknown — we don't
    // want to flag a false gap when we simply didn't look.
    return { state: 'unknown' };
  }
  if (s.value) return { state: 'pass', evidenceSource: s.source };
  return { state: 'fail', evidenceSource: s.source, confidence: 'high' };
}

function isApplicable(rule: PdplRule, answers: Answers): boolean {
  // NCA ECC / security-header rules apply to any public website, regardless
  // of whether it processes personal data — they protect the infrastructure.
  const isSecurityRule = rule.id.startsWith('nca_');
  if (!isSecurityRule && answers.q3_processes_personal_data === 'no') return false;

  switch (rule.appliesTo) {
    case 'all':
      return true;
    case 'large_processors':
      return answers.q4_user_count === 'over_100k';
    case 'cross_border':
      return answers.q6_data_location === 'outside';
  }
}

/* ------------------------------------------------------------------------- */
/* Gap construction                                                           */
/* ------------------------------------------------------------------------- */

const PLAIN_LANGUAGE: Record<
  string,
  { titleAr: string; explanationAr: string; canAutoGenerate?: boolean }
> = {
  pdpl_privacy_policy_published: {
    titleAr: 'موقعكم ما فيه صفحة تشرح للعملاء كيف تتعاملون مع بياناتهم',
    explanationAr:
      'النظام يقول كل شركة تجمع بيانات لازم يكون عندها صفحة سياسة خصوصية واضحة تشرح للناس وش البيانات اللي تجمعها وليش وكيف تحميها. فحصنا موقعكم وما لقينا هالصفحة.',
    canAutoGenerate: true,
  },
  pdpl_arabic_available: {
    titleAr: 'سياسة الخصوصية مو متاحة بالعربي',
    explanationAr:
      'العملاء السعوديين لازم يقدروا يقرأون سياسة الخصوصية بلغتهم. سياستكم الحالية بالإنجليزي فقط — وهذا يخلّيها صعبة الفهم لأغلب العملاء.',
    canAutoGenerate: true,
  },
  pdpl_purpose_stated: {
    titleAr: 'ما ذكرتوا بوضوح ليش تجمعون البيانات',
    explanationAr:
      'النظام يتطلب إنك تقول للعميل بوضوح: ليش تجمع هالبيانات؟ هل لتوصيل الطلب؟ للتسويق؟ لتحسين الخدمة؟ كل غرض لازم يكون مذكور.',
    canAutoGenerate: true,
  },
  pdpl_retention_stated: {
    titleAr: 'ما حددتوا كم مدة بتحتفظون بالبيانات',
    explanationAr:
      'لو عميل ألغى حسابه — كم تحتفظون ببياناته؟ شهر؟ سنة؟ النظام يقول لازم يكون عندكم جواب واضح ومكتوب في سياسة الخصوصية.',
    canAutoGenerate: true,
  },
  pdpl_cross_border_disclosed: {
    titleAr: 'ما أفصحتم إن البيانات تنتقل خارج المملكة',
    explanationAr:
      'بياناتكم مستضافة خارج السعودية — وهذا يتطلب إفصاح واضح في سياسة الخصوصية. العميل له الحق يعرف إن بياناته تنتقل لدولة ثانية.',
    canAutoGenerate: true,
  },
  pdpl_third_party_disclosed: {
    titleAr: 'ما ذكرتوا الأدوات الخارجية اللي تشاركون معها البيانات',
    explanationAr:
      'أي أداة خارجية تشارك معها بيانات العملاء (Google Analytics، Intercom، Mailchimp…) لازم تكون مذكورة في سياسة الخصوصية.',
    canAutoGenerate: true,
  },
  pdpl_consent_before_processing: {
    titleAr: 'موقعكم يجمع بيانات قبل ما يطلب موافقة العميل',
    explanationAr:
      'النظام يتطلب إنك تاخذ موافقة واضحة من العميل قبل ما تجمع بياناته. الرسالة اللي تطلب الموافقة على الكوكيز — هذي متطلب قانوني مو تجميل.',
    canAutoGenerate: false,
  },
  pdpl_dpo_required: {
    titleAr: 'ما عيّنتم مسؤول حماية بيانات (DPO)',
    explanationAr:
      'لأنكم تعالجون بيانات أكثر من ١٠٠ ألف مستخدم، النظام يتطلب تعيين مسؤول لحماية البيانات. مو ضروري توظفون شخص جديد — ممكن يكون من موظفينكم الحاليين، بس لازم يكون عنده تدريب وصلاحية، ويكون اسمه مذكور في سياسة الخصوصية.',
    canAutoGenerate: true,
  },
  pdpl_trackers_disclosed: {
    titleAr: 'موقعكم يحمّل أدوات تتبع بدون إفصاح واضح',
    explanationAr:
      'اكتشفنا أدوات تتبع على موقعكم (مثل Google Analytics أو Facebook Pixel) لكن سياسة الخصوصية ما تذكرها بشكل صريح. لازم كل أداة خارجية تشارك معها البيانات تكون مذكورة بالاسم في السياسة، مع إمكانية للمستخدم يرفضها.',
    canAutoGenerate: true,
  },
  pdpl_form_consent_present: {
    titleAr: 'نماذج الموقع تجمع بيانات بدون موافقة صريحة',
    explanationAr:
      'لقينا نماذج (فورمز) على موقعكم تجمع بيانات شخصية — مثل بريد إلكتروني وجوال واسم — لكن بعضها بدون مربع موافقة أو بدون رابط واضح لسياسة الخصوصية قريب من النموذج. النظام يتطلب موافقة صريحة من المستخدم قبل جمع أي بيانات شخصية.',
    canAutoGenerate: false,
  },
  nca_https_enforced: {
    titleAr: 'موقعكم لا يستخدم HTTPS بشكل كامل',
    explanationAr:
      "HTTPS يحمي البيانات أثناء انتقالها بين المتصفح وسيرفركم من الاعتراض. أي موقع يجمع بيانات من المستخدمين بدون HTTPS يعتبر خرقاً للحد الأدنى من الحماية. الحل: فعّلوا شهادة SSL (متوفرة مجاناً عبر Let's Encrypt).",
    canAutoGenerate: false,
  },
  nca_hsts_header: {
    titleAr: 'رأس HSTS غير مُفعّل',
    explanationAr:
      'HSTS يُخبر المتصفح يستخدم HTTPS دائماً حتى لو المستخدم كتب الرابط بدون https. هذا يمنع هجمات تخفيض البروتوكول. التفعيل عبارة عن سطر واحد في إعدادات السيرفر.',
    canAutoGenerate: false,
  },
  nca_csp_header: {
    titleAr: 'رأس Content-Security-Policy غير مُفعّل',
    explanationAr:
      'CSP يحمي موقعكم من هجمات XSS (تضمين سكربت خبيث) عبر تحديد مصادر السكربتات المسموح بها. مطلوب من ضوابط الأمن السيبراني الأساسية (NCA ECC) للشركات اللي تتعامل مع جهات حكومية.',
    canAutoGenerate: false,
  },
  nca_xframe_header: {
    titleAr: 'حماية التضمين (X-Frame-Options) غير مُفعّلة',
    explanationAr:
      'من دون هذا الرأس، ممكن يتم تضمين موقعكم في iframe بموقع خبيث ويستخدمه لخداع المستخدمين (Clickjacking). التفعيل: إضافة `X-Frame-Options: DENY` لاستجابات السيرفر.',
    canAutoGenerate: false,
  },
};

function buildGap(
  rule: PdplRule,
  evidenceSource: 'answer' | 'scan' | 'both',
  confidence: 'high' | 'low',
): Gap {
  const copy = PLAIN_LANGUAGE[rule.id] ?? {
    titleAr: rule.titleAr,
    explanationAr: rule.requirementAr,
    canAutoGenerate: false,
  };
  const regulationLabelAr = rule.id.startsWith('nca_')
    ? 'ضوابط الأمن السيبراني الأساسية (NCA ECC)'
    : 'نظام حماية البيانات الشخصية (PDPL)';
  return {
    id: `gap_${rule.id}`,
    severity: rule.severity,
    ruleId: rule.id,
    titleAr: copy.titleAr,
    explanationAr: copy.explanationAr,
    legalRefAr: `${regulationLabelAr} — ${rule.titleAr}`,
    fineCeilingSar: rule.fineCapSar,
    evidenceSource,
    confidence,
    canAutoGenerate: Boolean(copy.canAutoGenerate),
  };
}

function sortGapsBySeverity(gaps: Gap[]): Gap[] {
  return [...gaps].sort(
    (a, b) =>
      SEVERITY_WEIGHT[b.severity] - SEVERITY_WEIGHT[a.severity] ||
      b.fineCeilingSar - a.fineCeilingSar,
  );
}

/* ------------------------------------------------------------------------- */
/* Remediation plan                                                           */
/* ------------------------------------------------------------------------- */

function buildRemediationPlan(gaps: Gap[]): RemediationWeek[] {
  const critical = gaps.filter((g) => g.severity === 'critical').map((g) => plainTask(g));
  const medium = gaps.filter((g) => g.severity === 'medium').map((g) => plainTask(g));

  const plan: RemediationWeek[] = [];
  if (critical.length) plan.push({ window: 'هذا الأسبوع', tasks: critical.slice(0, 4) });
  if (critical.length > 4) plan.push({ window: 'خلال أسبوعين', tasks: critical.slice(4) });
  if (medium.length) plan.push({ window: 'خلال شهر', tasks: medium });
  return plan;
}

function plainTask(gap: Gap): string {
  if (gap.canAutoGenerate) return `${gap.titleAr} — درع يقدر يولّد لك الحل`;
  return gap.titleAr;
}
