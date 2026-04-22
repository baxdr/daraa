/**
 * Chat Agent — generates a one-sentence contextual bridge between questions.
 *
 * The scripted QUESTIONS list in chat-flow.ts is deterministic. Without any
 * LLM, the chat reads as a canned form. This agent adds one short Arabic
 * acknowledgment-line that references what the user just said, before the
 * next scripted question renders. e.g.:
 *
 *   User: "80000"
 *   Bridge: "٨٠ ألف ريال مبدأ معقول لكوفي شوب في الرياض."
 *   [scripted next question: "هل أحد الشركاء غير سعودي؟"]
 *
 * Falls back to a short deterministic string when the API key is missing —
 * the chat still feels responsive, just less personalised.
 */

import { callClaude, MODELS, MissingApiKeyError } from '@/lib/claude';
import { QUESTIONS, type Answers, type QuestionId } from './chat-flow';

/**
 * Produce the bridge line for the transition FROM `justAnswered` TO `nextQuestionId`.
 * Returns a short Arabic sentence, or null when nothing suitable fits.
 */
export async function generateBridge(params: {
  answers: Answers;
  justAnswered: QuestionId;
  nextQuestionId: QuestionId;
}): Promise<string | null> {
  const { answers, justAnswered, nextQuestionId } = params;

  // First-question bridge skipped — no prior context to reference.
  if (justAnswered === 'q0_mode') return null;

  try {
    return await generateWithClaude({ answers, justAnswered, nextQuestionId });
  } catch (err) {
    if (err instanceof MissingApiKeyError) {
      return localBridge(answers, justAnswered);
    }
    console.warn('[chat-agent] bridge generation failed, falling back:', err instanceof Error ? err.message : err);
    return localBridge(answers, justAnswered);
  }
}

/* ------------------------------------------------------------------------- */

async function generateWithClaude(params: {
  answers: Answers;
  justAnswered: QuestionId;
  nextQuestionId: QuestionId;
}): Promise<string> {
  const { answers, justAnswered, nextQuestionId } = params;

  const system = `أنت مستشار تأسيس وامتثال سعودي اسمك "درع". أنت في منتصف محادثة مع صاحب مشروع.

مهمتك: كتابة جملة واحدة قصيرة (أقل من ٣٠ كلمة) بالعربي السعودي تعلّق على الإجابة الأخيرة وتمهّد للسؤال اللي بعدها.

قواعد صارمة:
- جملة واحدة فقط. بدون تكرار السؤال السابق أو التالي.
- عربي سعودي مبسّط ("تمام"، "ممتاز"، "بالنسبة لـ"، "طيب"). ليس فصحى رسمية.
- لو الإجابة تكشف شي مميز، علّق عليه (٨٠ ألف رأس مال = معقول لكوفي شوب؛ ١٥٠ألف مستخدم = رقم كبير يستدعي متطلبات إضافية).
- لا تعطي نصائح قانونية ولا تذكر مصطلحات تقنية — فقط تعليق ودّي يعترف بالمعلومة.
- لا تستخدم علامات تنصيص ولا نقاط، فقط نص عادي.
- ممنوع الإيموجي.

أخرج النص فقط بدون أي مقدمة.`;

  const userPrompt = buildContextPrompt({ answers, justAnswered, nextQuestionId });
  const raw = await callClaude({ model: MODELS.sonnet, system, user: userPrompt, maxTokens: 120 });
  // Strip surrounding quotes or any "assistant-like" prefix.
  return raw.trim().replace(/^["'«»]|["'«»]$/g, '').trim();
}

function buildContextPrompt(params: {
  answers: Answers;
  justAnswered: QuestionId;
  nextQuestionId: QuestionId;
}): string {
  const { answers, justAnswered, nextQuestionId } = params;
  const lastQ = QUESTIONS[justAnswered];
  const nextQ = QUESTIONS[nextQuestionId];
  const answerLabel = describeAnswer(answers, justAnswered);

  const contextLines: string[] = [];
  // Include a compact summary of known answers so the bridge can reference earlier context.
  if (answers.q0_mode) contextLines.push(`المسار: ${answers.q0_mode === 'establishment' ? 'تأسيس مشروع جديد' : 'فحص امتثال'}`);
  if (answers.est1_vertical) contextLines.push(`القطاع: ${verticalLabel(answers.est1_vertical)}`);
  if (answers.q1_company_type) contextLines.push(`نوع الشركة: ${companyTypeLabel(answers.q1_company_type)}`);
  if (answers.est2_city) contextLines.push(`المدينة: ${answers.est2_city}`);
  if (answers.est3_partner_count) contextLines.push(`عدد الشركاء: ${answers.est3_partner_count}`);
  if (answers.est4_capital_sar) contextLines.push(`رأس المال: ${answers.est4_capital_sar.toLocaleString('en-US')} ريال`);

  return [
    'السؤال اللي سأله وكيلك قبل شوي:',
    `  ${lastQ.text}`,
    '',
    'إجابة المستخدم:',
    `  ${answerLabel}`,
    '',
    'السياق المتراكم:',
    ...contextLines.map((l) => `  ${l}`),
    '',
    'السؤال التالي اللي الوكيل راح يسأله (لا تكرره):',
    `  ${nextQ.text}`,
    '',
    'الآن اكتب جملة واحدة قصيرة تعلّق على الإجابة الأخيرة وتمهّد للسؤال التالي.',
  ].join('\n');
}

function describeAnswer(answers: Answers, qid: QuestionId): string {
  // Map typed enum values back to the UI label so Claude sees what the user saw.
  const q = QUESTIONS[qid];
  const rawValue = (answers as Record<string, unknown>)[qid];
  if (rawValue === undefined || rawValue === null) return '(بدون)';
  if (q.options) {
    const match = q.options.find((o) => o.value === rawValue);
    if (match) return match.label;
  }
  if (q.input?.kind === 'number') return String(rawValue);
  if (q.input?.kind === 'url_or_skip') return String(rawValue || 'تخطى رابط الموقع');
  return String(rawValue);
}

function verticalLabel(v: NonNullable<Answers['est1_vertical']>): string {
  switch (v) {
    case 'restaurant':  return 'مطعم / كوفي شوب';
    case 'tech':        return 'شركة تقنية';
    case 'services':    return 'متجر إلكتروني';
    case 'salon':       return 'صالون';
    case 'construction':return 'مقاولات';
  }
}

function companyTypeLabel(v: NonNullable<Answers['q1_company_type']>): string {
  switch (v) {
    case 'saas':      return 'SaaS';
    case 'ecommerce': return 'متجر إلكتروني';
    case 'fintech':   return 'فينتك';
    case 'services':  return 'خدمات';
    case 'other':     return 'أخرى';
  }
}

/* ------------------------------------------------------------------------- */
/* Deterministic fallback — used when the API key is missing. Each branch     */
/* returns a short, context-aware acknowledgment so the chat doesn't look     */
/* broken in no-key mode.                                                     */
/* ------------------------------------------------------------------------- */

function localBridge(answers: Answers, justAnswered: QuestionId): string | null {
  switch (justAnswered) {
    case 'est1_vertical': {
      const v = answers.est1_vertical;
      if (v === 'restaurant') return 'تمام — الكوفي والمطاعم لها مسار مميز.';
      if (v === 'salon')      return 'تمام — الصالونات عليها ترخيص صحي إضافي.';
      if (v === 'tech')       return 'تمام — الشركات التقنية يطبّق عليها نظام حماية البيانات غالباً.';
      if (v === 'services')   return 'تمام — المتاجر الإلكترونية يطبّق عليها نظام حماية البيانات.';
      if (v === 'construction') return 'تمام — المقاولات محتاجة تصنيف لو ودّك تشتغل مع القطاع الحكومي.';
      return 'تمام.';
    }
    case 'est2_city': return 'ممتاز، خلنا نعرف عن الشركاء.';
    case 'est3_partner_count': {
      const n = answers.est3_partner_count;
      if (n === 1) return 'لوحدك — هذا يفتح خيار مؤسسة فردية لو رأس المال صغير.';
      if (n && n >= 2) return `${n} شركاء — ذ.م.م عادة الخيار الأنسب.`;
      return 'تمام.';
    }
    case 'est4_capital_sar': {
      const c = answers.est4_capital_sar ?? 0;
      if (c < 100_000) return `${c.toLocaleString('en-US')} ريال — رأس مال متواضع، نقدر نبدأ بكيان مبسّط.`;
      if (c < 500_000) return `${c.toLocaleString('en-US')} ريال — مبدأ مناسب.`;
      return `${c.toLocaleString('en-US')} ريال — رأس مال محترم.`;
    }
    case 'est5_foreign_partner':
      return answers.est5_foreign_partner === 'yes'
        ? 'وجود شريك أجنبي يضيف خطوة ترخيص استثمار، بس نتعامل معاها.'
        : 'تمام، كلكم سعوديين — الإجراءات أبسط.';
    case 'est6_lease_status': return null; // last q — no next bridge

    case 'q1_company_type': return 'تمام — خلنا نعرف حجم الفريق.';
    case 'q2_employee_count': {
      const n = answers.q2_employee_count ?? 0;
      if (n < 10) return `${n} موظف — شركة صغيرة، إجراءات الامتثال أخف.`;
      if (n < 50) return `${n} موظف — حجم متوسط.`;
      return `${n} موظف — حجم محترم، الامتثال هنا صار عليه نظرة أوسع.`;
    }
    case 'q3_processes_personal_data':
      return answers.q3_processes_personal_data === 'yes'
        ? 'تمام — لأنكم تجمعون بيانات، PDPL يطبّق عليكم.'
        : 'فهمت — بما إنكم ما تجمعون بيانات، نركّز على الأنظمة الثانية.';
    case 'q4_user_count': {
      const v = answers.q4_user_count;
      if (v === 'over_100k') return 'عدد كبير — PDPL يتطلب تعيين مسؤول حماية بيانات عندكم.';
      if (v === '10k_100k')  return 'عدد متوسط — في متطلبات نظامية لازم نشيك عليها.';
      return 'عدد محدود — المتطلبات أخف بس موجودة.';
    }
    case 'q5_dpo_appointed':
      return answers.q5_dpo_appointed === 'yes'
        ? 'ممتاز — عندكم DPO، هذا يوفّر نقاط في الامتثال.'
        : 'أوكي — هذي نقطة بنشوفها في التقرير.';
    case 'q6_data_location':
      return answers.q6_data_location === 'outside'
        ? 'بيانات خارج المملكة — هذي ينطبق عليها الإفصاح عن نقل البيانات.'
        : answers.q6_data_location === 'saudi'
          ? 'داخل المملكة — نقطة إيجابية.'
          : 'تمام، نتحقق في الفحص.';
    case 'q7_government_clients':
      return answers.q7_government_clients === 'yes'
        ? 'بما إنكم مع جهات حكومية — ضوابط الأمن السيبراني (NCA) تطبّق عليكم.'
        : 'أوكي، NCA مو ضروري في حالتكم.';
    case 'q8_website_url': return null;
    default: return null;
  }
}
