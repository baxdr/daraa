/**
 * Chat state machine — deterministic question flow in Gulf Arabic.
 *
 * The chat is NOT a free-form agentic conversation (see DESIGN.md §16.2).
 * It's a hardcoded branching flow; the LLM's only job is on-demand term
 * explanations. This file is the source of truth for:
 *   - the list of questions
 *   - their Arabic text + quick-answer buttons
 *   - which terms to surface per question
 *   - how the next question is chosen given prior answers
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
  // Operational-compliance branch (physical businesses: restaurants, salons,
  // construction, retail). License-renewal-first rather than PDPL-scan.
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

export type AnswerValue = string; // label as shown to the user

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

/* ------------------------------------------------------------------------- */
/* Question definitions                                                       */
/* ------------------------------------------------------------------------- */

export const QUESTIONS: Record<QuestionId, Question> = {
  q0_mode: {
    id: 'q0_mode',
    text: 'أهلاً! أنا درع — مستشار ذكي للتأسيس والامتثال في السعودية. وش تبي تسوي اليوم؟',
    hint: 'اختر الأنسب لوضعك — تقدر تغيّر لاحقاً إذا احتجت.',
    options: [
      { value: 'establishment', label: '🏢 أبدأ مشروع جديد — تأسيس وتسجيل الشركة' },
      { value: 'compliance', label: '🔍 عندي شركة شغّالة — أفحص امتثالها الرقمي (PDPL, NCA)' },
      { value: 'operational_compliance', label: '📋 عندي محل أو مطعم — أتابع رخصي وتجديداتي' },
    ],
  },

  q_company_name: {
    id: 'q_company_name',
    text: 'تمام. وش اسم المشروع أو الشركة اللي في بالك؟',
    hint: 'الاسم بيطلع في عقد التأسيس، التقرير، والمستندات اللي بنجهّزها لك — خلّيه الاسم التجاري اللي تبغى يُسجَّل به. مثال: شركة النخيل للتجارة أو كوفي الأصالة.',
    input: { kind: 'text', placeholder: 'اكتب اسم الشركة — مثال: شركة النخيل' },
  },

  /* ---------------- Establishment branch ---------------- */

  est1_vertical: {
    id: 'est1_vertical',
    text: 'ممتاز! وش نوع المشروع اللي تفكّر فيه؟',
    hint: 'مثال: مطعم، تطبيق، متجر إلكتروني، صالون تجميل، أو مقاولات.',
    options: [
      { value: 'restaurant', label: 'مطعم / كوفي شوب' },
      { value: 'tech', label: 'شركة تقنية / تطبيق' },
      { value: 'services', label: 'متجر إلكتروني' },
      { value: 'salon', label: 'صالون / مركز تجميل' },
      { value: 'construction', label: 'مقاولات / بناء' },
    ],
  },
  est2_city: {
    id: 'est2_city',
    text: 'في أي مدينة؟',
    hint: 'مثال: الرياض، جدة، الدمام، مكة المكرمة، أبها أو مدينة أخرى.',
    options: [
      { value: 'riyadh', label: 'الرياض' },
      { value: 'jeddah', label: 'جدة' },
      { value: 'mecca', label: 'مكة المكرمة' },
      { value: 'medina', label: 'المدينة المنورة' },
      { value: 'dammam', label: 'الدمام' },
      { value: 'khobar', label: 'الخُبَر' },
      { value: 'other', label: 'مدينة ثانية' },
    ],
  },
  est3_partner_count: {
    id: 'est3_partner_count',
    text: 'كم عدد الشركاء المؤسسين؟ (عدّ نفسك ضمنهم)',
    hint: 'مثال: ١ إذا أنت لوحدك، ٢ إذا أنت وشريك واحد.',
    input: { kind: 'number', placeholder: 'اكتب الرقم فقط — مثال: 2' },
  },
  est4_capital_sar: {
    id: 'est4_capital_sar',
    text: 'كم رأس المال التقريبي اللي ناويين تبدأون فيه (بالريال)؟',
    hint: 'رقم تقريبي يكفي — مثال: ٥٠،٠٠٠ ريال أو اكتب الرقم فقط مثل 50000. نبي نحدد نوع الكيان المناسب (مؤسسة فردية، شركة ذات مسؤولية محدودة، إلخ).',
    input: { kind: 'number', placeholder: 'اكتب الرقم فقط — مثال: 50000' },
  },
  est5_foreign_partner: {
    id: 'est5_foreign_partner',
    text: 'هل أحد الشركاء غير سعودي؟',
    hint: 'وجود شريك أجنبي يغيّر بعض المتطلبات (ترخيص استثمار أجنبي).',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا — كلنا سعوديين' },
    ],
  },
  est6_lease_status: {
    id: 'est6_lease_status',
    text: 'وضع الموقع الحالي؟',
    hint: 'هذا السؤال مهم — فيه تنبيه مهم نشاركه معك بعد ما نعرف الإجابة.',
    options: [
      { value: 'not_signed', label: 'لقينا محل ولم نوقّع العقد' },
      { value: 'signed', label: 'وقّعنا عقد الإيجار' },
      { value: 'no_location_yet', label: 'لسا ندوّر' },
    ],
  },

  /* ---------------- Compliance branch (unchanged) ---------------- */

  q1_company_type: {
    id: 'q1_company_type',
    text: 'ممتاز. وش نوع شركتك؟',
    options: [
      { value: 'saas', label: 'SaaS' },
      { value: 'ecommerce', label: 'متجر إلكتروني' },
      { value: 'fintech', label: 'Fintech' },
      { value: 'services', label: 'خدمات' },
      { value: 'other', label: 'أخرى' },
    ],
  },

  q2_employee_count: {
    id: 'q2_employee_count',
    text: 'ممتاز. كم عدد موظفينكم تقريباً؟',
    hint: 'اكتب الرقم فقط — تقريبي يكفي.',
    input: { kind: 'number', placeholder: 'مثال: 25' },
  },

  q3_processes_personal_data: {
    id: 'q3_processes_personal_data',
    text: 'هل تطبيقكم أو خدمتكم تجمع بيانات شخصية من عملاء سعوديين؟',
    hint: 'يعني أشياء مثل: أسماء، أرقام جوال، إيميلات، عناوين، أو أي معلومات تعرّف الشخص. السؤال هذا مهم لأنه يحدد هل يطبّق عليك نظام حماية البيانات الشخصية (PDPL) أو لا.',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا' },
    ],
    terms: ['PDPL'],
  },

  q4_user_count: {
    id: 'q4_user_count',
    text: 'كم عدد المستخدمين أو العملاء اللي عندكم بياناتهم تقريباً؟',
    options: [
      { value: 'under_10k', label: 'أقل من ١٠ آلاف' },
      { value: '10k_100k', label: 'بين ١٠ آلاف و ١٠٠ ألف' },
      { value: 'over_100k', label: 'أكثر من ١٠٠ ألف' },
    ],
  },

  q5_dpo_appointed: {
    id: 'q5_dpo_appointed',
    text: 'هذا عدد كبير — وهذا يعني إن شركتك ملزمة بتعيين مسؤول حماية بيانات (DPO). هل عيّنتم شخص لهذا الدور؟',
    hint: 'المادة ٣٢ من اللائحة التنفيذية تلزم الشركات اللي تعالج بيانات عدد كبير من الناس بتعيين DPO موثّق. ما يحتاج يكون توظيف جديد — يقدر يكون أحد موظفينك الحاليين.',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا' },
      { value: 'unknown', label: 'وش هذا؟' },
    ],
    terms: ['DPO'],
  },

  q6_data_location: {
    id: 'q6_data_location',
    text: 'بياناتكم وين مستضافة؟ يعني السيرفرات اللي عليها بيانات عملائكم.',
    hint: 'إذا السيرفرات خارج السعودية (مثل AWS إيرلندا أو GCP فرانكفورت) — يصير نقل بيانات عبر الحدود ويحتاج مبرّر قانوني واضح قبل أي تدقيق.',
    options: [
      { value: 'saudi', label: 'داخل السعودية' },
      { value: 'outside', label: 'خارج السعودية (AWS/Azure/GCP)' },
      { value: 'unknown', label: 'ما أدري' },
    ],
    terms: ['cross_border_transfer'],
  },

  q7_government_clients: {
    id: 'q7_government_clients',
    text: 'هل شركتكم تتعامل مع أي جهة حكومية سعودية؟',
    hint: 'التعامل مع جهات حكومية يضيف طبقة أمن سيبراني إضافية — ضوابط NCA ECC الأساسية مطلوبة قبل أي عقد، وتشمل HTTPS وسجلات المراجعة وضبط صلاحيات الوصول.',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no', label: 'لا' },
    ],
    terms: ['NCA_ECC'],
  },

  q8_website_url: {
    id: 'q8_website_url',
    text: 'ممتاز — جمعت صورة واضحة عن شركتك. لو عطيتني رابط موقعكم بقدر أفحصه وأعطيك تقرير أدق. تقدر تتخطى لو ما عندك موقع جاهز.',
    hint: 'إذا ما عندك موقع الحين، اضغط "تخطى" — تقدر تضيفه لاحقاً.',
    input: {
      kind: 'url_or_skip',
      placeholder: 'https://yourcompany.sa',
      skipLabel: 'تخطى — ما عندي موقع حالياً',
    },
  },

  /* ---------------- Operational-compliance branch (physical) ---------------- */

  op1_vertical: {
    id: 'op1_vertical',
    text: 'ممتاز. وش نوع نشاطكم؟',
    hint: 'مثال: مطعم، صالون تجميل، مقاولات أو محل تجزئة.',
    options: [
      { value: 'restaurant', label: 'مطعم / كوفي شوب' },
      { value: 'salon', label: 'صالون / مركز تجميل' },
      { value: 'construction', label: 'مقاولات / مكتب بناء' },
      { value: 'retail', label: 'محل تجزئة' },
    ],
  },
  op2_city: {
    id: 'op2_city',
    text: 'في أي مدينة؟',
    hint: 'مثال: الرياض، جدة، الدمام، مكة المكرمة أو أبها.',
    options: [
      { value: 'riyadh', label: 'الرياض' },
      { value: 'jeddah', label: 'جدة' },
      { value: 'mecca', label: 'مكة المكرمة' },
      { value: 'medina', label: 'المدينة المنورة' },
      { value: 'dammam', label: 'الدمام' },
      { value: 'khobar', label: 'الخُبَر' },
      { value: 'other', label: 'مدينة ثانية' },
    ],
  },
  op3_cr_issue_date: {
    id: 'op3_cr_issue_date',
    text: 'متى أصدرتم السجل التجاري؟',
    hint: 'صيغة: YYYY-MM-DD مثال: 2024-03-15. نحتاج التاريخ عشان نحسب موعد التجديد القادم — السجل التجاري يُجدَّد سنوياً.',
    input: { kind: 'date', placeholder: 'مثال: 2024-03-15' },
  },
  op4_municipal_last_renewed: {
    id: 'op4_municipal_last_renewed',
    text: 'متى آخر تجديد لرخصة البلدية؟',
    hint: 'لو ما عندك تاريخ بالضبط، تقدر تتخطى وراح نفترض أنها جديدة مع السجل التجاري.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى — ما أدري بالضبط',
    },
  },
  op5_civil_defense_last: {
    id: 'op5_civil_defense_last',
    text: 'متى آخر شهادة سلامة من الدفاع المدني؟',
    hint: 'شهادة السلامة (الطفايات، مخارج الطوارئ، كواشف الدخان) تُجدَّد سنوياً. لو عندك تاريخ قريب عطنا إياه.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى — ما عندنا تاريخ',
    },
  },
  op6_sfda_cert_date: {
    id: 'op6_sfda_cert_date',
    text: 'متى آخر ترخيص من هيئة الغذاء والدواء (SFDA)؟',
    hint: 'فقط للمطاعم والكوفي شوب — يُجدَّد سنوياً وإلا تُوقف الخدمة.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى',
    },
  },
  op7_employee_count: {
    id: 'op7_employee_count',
    text: 'كم عدد موظفينكم الحالي؟',
    hint: 'اكتب الرقم فقط. نحتاج الرقم لتقدير وضعكم في نطاقات — ١٠ موظفين فأكثر تستوجب نسبة توطين معيّنة.',
    input: { kind: 'number', placeholder: 'مثال: 6' },
  },
  op8_lease_expiry: {
    id: 'op8_lease_expiry',
    text: 'متى ينتهي عقد الإيجار؟',
    hint: 'لو الإيجار قارب الانتهاء بنذكّرك قبل ما تصير أزمة — تقدر تتخطى لو ما عندك التاريخ.',
    input: {
      kind: 'date_or_skip',
      placeholder: 'مثال: 2024-03-15 (يوم-شهر-سنة بصيغة ISO)',
      skipLabel: 'تخطى',
    },
  },
  op9_has_website: {
    id: 'op9_has_website',
    text: 'هل عندكم موقع إلكتروني أو متجر أونلاين؟',
    hint: 'لو نعم، بنضيف طبقة فحص رقمي (PDPL + رؤوس الأمان) فوق الامتثال التشغيلي.',
    options: [
      { value: 'yes', label: 'نعم، عندنا موقع' },
      { value: 'no', label: 'لا — فقط محل فعلي' },
    ],
  },
  op10_website_url: {
    id: 'op10_website_url',
    text: 'ممتاز — عطنا رابط موقعكم عشان نفحصه.',
    input: {
      kind: 'url_or_skip',
      placeholder: 'https://yourbrand.sa',
      skipLabel: 'تخطى — ابقَ على الامتثال التشغيلي فقط',
    },
  },
};

/* ------------------------------------------------------------------------- */
/* Flow resolver                                                              */
/* ------------------------------------------------------------------------- */

export const FIRST_QUESTION: QuestionId = 'q0_mode';

/**
 * Given the current question's answer (plus all prior answers), return the
 * next question id — or `null` if the flow is done.
 *
 * Dispatches on mode: establishment → est1..est6, compliance → q1..q8.
 */
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

/**
 * Validate and coerce a raw answer string into the typed value stored in `Answers`.
 * Returns { ok: true, value } on success or { ok: false, error } on failure.
 */
export function validateAnswer(
  questionId: QuestionId,
  rawAnswer: string,
): { ok: true; value: Answers[QuestionId] } | { ok: false; error: string } {
  const q = QUESTIONS[questionId];

  if (q.options) {
    const opt = q.options.find((o) => o.value === rawAnswer || o.label === rawAnswer);
    if (!opt) return { ok: false, error: 'اختر من الخيارات المعروضة' };
    return { ok: true, value: opt.value as Answers[QuestionId] };
  }

  if (q.input?.kind === 'text') {
    const trimmed = rawAnswer.trim();
    if (trimmed.length < 2) return { ok: false, error: 'الاسم قصير جداً — اكتب اسم المشروع' };
    if (trimmed.length > 80) return { ok: false, error: 'الاسم طويل — اختصره' };
    return { ok: true, value: trimmed as Answers[QuestionId] };
  }

  if (q.input?.kind === 'number') {
    const n = Number(rawAnswer.replace(/[^\d]/g, ''));
    // 100M cap covers capital figures without letting typos through.
    if (!Number.isFinite(n) || n < 1 || n > 100_000_000) {
      return { ok: false, error: 'اكتب رقم صحيح' };
    }
    return { ok: true, value: n as Answers[QuestionId] };
  }

  if (q.input?.kind === 'url_or_skip') {
    if (rawAnswer === '__skip__' || rawAnswer === '') {
      return { ok: true, value: null as Answers[QuestionId] };
    }
    try {
      const parsed = new URL(rawAnswer);
      if (!/^https?:$/.test(parsed.protocol)) throw new Error('bad protocol');
      return { ok: true, value: parsed.toString() as Answers[QuestionId] };
    } catch {
      return { ok: false, error: 'رابط غير صالح — ابدأ بـ https://' };
    }
  }

  if (q.input?.kind === 'date' || q.input?.kind === 'date_or_skip') {
    if (q.input.kind === 'date_or_skip' && (rawAnswer === '__skip__' || rawAnswer === '')) {
      return { ok: true, value: null as Answers[QuestionId] };
    }
    // Accept YYYY-MM-DD strictly. Reject obviously bad dates (year out of range,
    // non-existent calendar days).
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(rawAnswer.trim());
    if (!match) return { ok: false, error: 'التاريخ بصيغة YYYY-MM-DD (مثل 2024-03-15)' };
    const [, y, m, d] = match;
    const year = Number(y);
    const month = Number(m);
    const day = Number(d);
    if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
      return { ok: false, error: 'التاريخ خارج النطاق المسموح' };
    }
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
      return { ok: false, error: 'تاريخ غير صالح' };
    }
    return { ok: true, value: rawAnswer.trim() as Answers[QuestionId] };
  }

  return { ok: false, error: 'سؤال غير معروف' };
}
