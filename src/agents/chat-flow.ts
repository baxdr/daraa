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

export type Mode = 'establishment' | 'compliance';

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
  | 'q8_website_url';

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
}

export interface QuickOption {
  value: string;       // stored value (internal key)
  label: string;       // Arabic label shown on the button
}

export type InputKind = 'choice' | 'text' | 'number' | 'url' | 'url_or_skip';

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
    skipLabel?: string;      // only for url_or_skip
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
    options: [
      { value: 'establishment', label: 'أبي أفتح مشروع جديد' },
      { value: 'compliance',    label: 'عندي مشروع شغّال وأبي أتأكد من الامتثال' },
    ],
  },

  q_company_name: {
    id: 'q_company_name',
    text: 'تمام. وش اسم المشروع أو الشركة اللي في بالك؟',
    hint: 'الاسم بيطلع في عقد التأسيس، التقرير، والمستندات اللي بنجهّزها لك — خلّيه الاسم التجاري اللي تبغى يُسجَّل به.',
    input: { kind: 'text', placeholder: 'مثال: كوفي الأصالة' },
  },

  /* ---------------- Establishment branch ---------------- */

  est1_vertical: {
    id: 'est1_vertical',
    text: 'ممتاز! وش نوع المشروع اللي تفكّر فيه؟',
    options: [
      { value: 'restaurant',   label: 'مطعم / كوفي شوب' },
      { value: 'tech',         label: 'شركة تقنية / تطبيق' },
      { value: 'services',     label: 'متجر إلكتروني' },
      { value: 'salon',        label: 'صالون / مركز تجميل' },
      { value: 'construction', label: 'مقاولات / بناء' },
    ],
  },
  est2_city: {
    id: 'est2_city',
    text: 'في أي مدينة؟',
    options: [
      { value: 'riyadh',  label: 'الرياض' },
      { value: 'jeddah',  label: 'جدة' },
      { value: 'mecca',   label: 'مكة المكرمة' },
      { value: 'medina',  label: 'المدينة المنورة' },
      { value: 'dammam',  label: 'الدمام' },
      { value: 'khobar',  label: 'الخُبَر' },
      { value: 'other',   label: 'مدينة ثانية' },
    ],
  },
  est3_partner_count: {
    id: 'est3_partner_count',
    text: 'كم عدد الشركاء المؤسسين؟ (عدّ نفسك ضمنهم)',
    input: { kind: 'number', placeholder: 'مثال: 2' },
  },
  est4_capital_sar: {
    id: 'est4_capital_sar',
    text: 'كم رأس المال التقريبي اللي ناويين تبدأون فيه (بالريال)؟',
    hint: 'رقم تقريبي يكفي — نبي نحدد نوع الكيان المناسب (مؤسسة فردية، شركة ذات مسؤولية محدودة، إلخ).',
    input: { kind: 'number', placeholder: 'مثال: 80000' },
  },
  est5_foreign_partner: {
    id: 'est5_foreign_partner',
    text: 'هل أحد الشركاء غير سعودي؟',
    hint: 'وجود شريك أجنبي يغيّر بعض المتطلبات (ترخيص استثمار أجنبي).',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no',  label: 'لا — كلنا سعوديين' },
    ],
  },
  est6_lease_status: {
    id: 'est6_lease_status',
    text: 'وضع الموقع الحالي؟',
    hint: 'هذا السؤال مهم — فيه تنبيه مهم نشاركه معك بعد ما نعرف الإجابة.',
    options: [
      { value: 'not_signed',       label: 'لقينا محل ولم نوقّع العقد' },
      { value: 'signed',           label: 'وقّعنا عقد الإيجار' },
      { value: 'no_location_yet',  label: 'لسا ندوّر' },
    ],
  },

  /* ---------------- Compliance branch (unchanged) ---------------- */

  q1_company_type: {
    id: 'q1_company_type',
    text: 'ممتاز. وش نوع شركتك؟',
    options: [
      { value: 'saas',       label: 'SaaS' },
      { value: 'ecommerce',  label: 'متجر إلكتروني' },
      { value: 'fintech',    label: 'Fintech' },
      { value: 'services',   label: 'خدمات' },
      { value: 'other',      label: 'أخرى' },
    ],
  },

  q2_employee_count: {
    id: 'q2_employee_count',
    text: 'ممتاز. كم عدد موظفينكم تقريباً؟',
    input: { kind: 'number', placeholder: 'مثال: 25' },
  },

  q3_processes_personal_data: {
    id: 'q3_processes_personal_data',
    text: 'هل تطبيقكم أو خدمتكم تجمع بيانات شخصية من عملاء سعوديين؟',
    hint: 'يعني أشياء مثل: أسماء، أرقام جوال، إيميلات، عناوين، أو أي معلومات تعرّف الشخص. السؤال هذا مهم لأنه يحدد هل يطبّق عليك نظام حماية البيانات الشخصية (PDPL) أو لا.',
    options: [
      { value: 'yes', label: 'نعم' },
      { value: 'no',  label: 'لا' },
    ],
    terms: ['PDPL'],
  },

  q4_user_count: {
    id: 'q4_user_count',
    text: 'كم عدد المستخدمين أو العملاء اللي عندكم بياناتهم تقريباً؟',
    options: [
      { value: 'under_10k',  label: 'أقل من ١٠ آلاف' },
      { value: '10k_100k',   label: 'بين ١٠ آلاف و ١٠٠ ألف' },
      { value: 'over_100k',  label: 'أكثر من ١٠٠ ألف' },
    ],
  },

  q5_dpo_appointed: {
    id: 'q5_dpo_appointed',
    text: 'هذا عدد كبير — وهذا يعني إن شركتك ملزمة بتعيين مسؤول حماية بيانات (DPO). هل عيّنتم شخص لهذا الدور؟',
    hint: 'المادة ٣٢ من اللائحة التنفيذية تلزم الشركات اللي تعالج بيانات عدد كبير من الناس بتعيين DPO موثّق. ما يحتاج يكون توظيف جديد — يقدر يكون أحد موظفينك الحاليين.',
    options: [
      { value: 'yes',     label: 'نعم' },
      { value: 'no',      label: 'لا' },
      { value: 'unknown', label: 'وش هذا؟' },
    ],
    terms: ['DPO'],
  },

  q6_data_location: {
    id: 'q6_data_location',
    text: 'بياناتكم وين مستضافة؟ يعني السيرفرات اللي عليها بيانات عملائكم.',
    hint: 'إذا السيرفرات خارج السعودية (مثل AWS إيرلندا أو GCP فرانكفورت) — يصير نقل بيانات عبر الحدود ويحتاج مبرّر قانوني واضح قبل أي تدقيق.',
    options: [
      { value: 'saudi',   label: 'داخل السعودية' },
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
      { value: 'no',  label: 'لا' },
    ],
    terms: ['NCA_ECC'],
  },

  q8_website_url: {
    id: 'q8_website_url',
    text: 'ممتاز — جمعت صورة واضحة عن شركتك. لو عطيتني رابط موقعكم بقدر أفحصه وأعطيك تقرير أدق. تقدر تتخطى لو ما عندك موقع جاهز.',
    input: {
      kind: 'url_or_skip',
      placeholder: 'https://yourcompany.sa',
      skipLabel: 'تخطى — أبي التقرير بدون فحص الموقع',
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
      return answers.q0_mode === 'establishment' ? 'est1_vertical' : 'q1_company_type';

    /* ---- establishment branch ---- */
    case 'est1_vertical':    return 'est2_city';
    case 'est2_city':        return 'est3_partner_count';
    case 'est3_partner_count': return 'est4_capital_sar';
    case 'est4_capital_sar': return 'est5_foreign_partner';
    case 'est5_foreign_partner': return 'est6_lease_status';
    case 'est6_lease_status':
      return null; // establishment flow ends here; resolver produces the roadmap

    /* ---- compliance branch ---- */
    case 'q1_company_type':  return 'q2_employee_count';
    case 'q2_employee_count': return 'q3_processes_personal_data';
    case 'q3_processes_personal_data':
      return answers.q3_processes_personal_data === 'no'
        ? 'q7_government_clients'
        : 'q4_user_count';
    case 'q4_user_count':
      return answers.q4_user_count === 'over_100k'
        ? 'q5_dpo_appointed'
        : 'q6_data_location';
    case 'q5_dpo_appointed': return 'q6_data_location';
    case 'q6_data_location': return 'q7_government_clients';
    case 'q7_government_clients': return 'q8_website_url';
    case 'q8_website_url':   return null;
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

  return { ok: false, error: 'سؤال غير معروف' };
}
