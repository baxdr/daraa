/**
 * Chat Agent — Claude-driven conversational intake.
 *
 * This is the single brain behind the /chat experience. Given the session's
 * accumulated answers and the user's latest message (free text OR a
 * button-click value), it:
 *
 *   1. Calls Claude with a strict schema of fields we still need,
 *   2. Claude extracts any info present in the user's text — even if buried
 *      in a Gulf-Arabic colloquial sentence ("ودي أفتح كوفي بجدة أنا وشريك
 *      رأس مال ٨٠ ألف"),
 *   3. Claude picks the next single field to ask about and writes a natural
 *      message — including any term explanation (PDPL, DPO, ذ.م.م…) inline,
 *   4. Claude suggests quick-reply buttons when the field has a closed set
 *      of options.
 *
 * Validation stays deterministic: every extraction Claude returns goes
 * through the existing `validateAnswer` before being stored. Invalid /
 * unrecognised values are dropped — the loop then re-asks for that field.
 *
 * Fallback: if the API key is missing or Claude errors out, we revert to
 * the scripted flow (validate → next-question → local bridge sentence) so
 * the chat still works in degraded mode.
 */

import { callClaude, MODELS, parseJsonResponse, MissingApiKeyError, hasApiKey } from '@/lib/claude';
import {
  QUESTIONS,
  FIRST_QUESTION,
  nextQuestion,
  validateAnswer,
  type Answers,
  type Question,
  type QuestionId,
} from './chat-flow';
import type { ChatSession } from '@/lib/chat-sessions';

/* ------------------------------------------------------------------------- */
/* Public API                                                                 */
/* ------------------------------------------------------------------------- */

export interface QuickReply {
  label: string;
  value: string;
}

export interface InputAffordance {
  kind: 'text' | 'number' | 'url_or_skip' | 'date' | 'date_or_skip';
  placeholder: string;
  skipLabel?: string;
}

export interface ChatAgentTurn {
  /** The session with updated `answers` + `currentQuestion`. (Mutated in place.) */
  session: ChatSession;
  /** Agent's message to render. */
  agentMessage: string;
  /** True when all required fields are collected. */
  done: boolean;
  /** What we're about to ask — null when done. */
  nextQuestionId: QuestionId | null;
  /** Optional quick-reply suggestions the UI renders as clickable chips. */
  suggestions?: QuickReply[];
  /** Optional affordance — free text / number / URL box. */
  input?: InputAffordance;
  /** IDs of fields extracted this turn (for UI feedback / debug). */
  extracted: QuestionId[];
}

export interface ChatAgentError {
  error: string;
}

/**
 * Advance the chat by one user turn. Mutates session in place.
 */
export async function advanceChat(params: {
  session: ChatSession;
  userInput: string;
}): Promise<ChatAgentTurn | ChatAgentError> {
  const { session, userInput } = params;
  const trimmed = userInput.trim();
  if (!trimmed) return { error: 'اكتب شي أو اختر من الاقتراحات' };

  // Fast path — exact match on the CURRENT question's options. Typical
  // button click. Short-circuits the LLM for deterministic inputs.
  const fastPath = tryFastPath(session, trimmed);
  if (fastPath) return fastPath;

  // Claude path — extract + compose.
  if (hasApiKey()) {
    try {
      return await claudeTurn(session, trimmed);
    } catch (err) {
      if (!(err instanceof MissingApiKeyError)) {
        console.warn(
          '[chat-agent] Claude turn failed, falling back to scripted path:',
          err instanceof Error ? err.message : err,
        );
      }
      // Fall through to scripted path.
    }
  }

  return scriptedFallback(session, trimmed);
}

/* ------------------------------------------------------------------------- */
/* Fast path — exact button-value or button-label match                       */
/* ------------------------------------------------------------------------- */

function tryFastPath(session: ChatSession, rawAnswer: string): ChatAgentTurn | null {
  const current = session.currentQuestion;
  if (!current) return null;
  const q = QUESTIONS[current];
  if (!q.options) return null;
  const match = q.options.find(
    (o) => o.value === rawAnswer || o.label.trim() === rawAnswer.trim(),
  );
  if (!match) return null;

  // Apply + advance via the scripted flow.
  const validated = validateAnswer(current, match.value);
  if (!validated.ok) return null;
  (session.answers as Record<string, unknown>)[current] = validated.value;
  const next = nextQuestion(current, session.answers);
  session.currentQuestion = next;

  if (!next) {
    return {
      session,
      done: true,
      nextQuestionId: null,
      agentMessage: compilationMessage(session.answers),
      extracted: [current],
    };
  }
  const nextQ = QUESTIONS[next];
  return {
    session,
    done: false,
    nextQuestionId: next,
    agentMessage: nextQ.text + (nextQ.hint ? `\n\n${nextQ.hint}` : ''),
    suggestions: nextQ.options ? nextQ.options.map((o) => ({ label: o.label, value: o.value })) : undefined,
    input: inputAffordanceFor(nextQ),
    extracted: [current],
  };
}

/* ------------------------------------------------------------------------- */
/* Scripted fallback — validate raw input against current question            */
/* ------------------------------------------------------------------------- */

function scriptedFallback(session: ChatSession, rawAnswer: string): ChatAgentTurn | ChatAgentError {
  const current = session.currentQuestion;
  if (!current) return { error: 'الجلسة منتهية' };
  const validated = validateAnswer(current, rawAnswer);
  if (!validated.ok) return { error: validated.error };

  (session.answers as Record<string, unknown>)[current] = validated.value;
  const next = nextQuestion(current, session.answers);
  session.currentQuestion = next;

  if (!next) {
    return {
      session,
      done: true,
      nextQuestionId: null,
      agentMessage: compilationMessage(session.answers),
      extracted: [current],
    };
  }
  const nextQ = QUESTIONS[next];
  return {
    session,
    done: false,
    nextQuestionId: next,
    agentMessage: nextQ.text + (nextQ.hint ? `\n\n${nextQ.hint}` : ''),
    suggestions: nextQ.options ? nextQ.options.map((o) => ({ label: o.label, value: o.value })) : undefined,
    input: inputAffordanceFor(nextQ),
    extracted: [current],
  };
}

/* ------------------------------------------------------------------------- */
/* Claude path                                                                */
/* ------------------------------------------------------------------------- */

async function claudeTurn(session: ChatSession, userInput: string): Promise<ChatAgentTurn> {
  const prompt = buildUserPrompt(session, userInput);
  const raw = await callClaude({
    model: MODELS.sonnet,
    system: SYSTEM_PROMPT,
    user: prompt,
    maxTokens: 900,
  });

  const parsed = parseJsonResponse<ClaudeResponse>(raw);
  const extracted: QuestionId[] = [];

  // Validate + apply each extraction.
  if (parsed.extractions && typeof parsed.extractions === 'object') {
    for (const [rawKey, rawValue] of Object.entries(parsed.extractions)) {
      if (!isQuestionId(rawKey)) continue;
      if (rawValue === undefined || rawValue === null) continue;
      const str = typeof rawValue === 'number' ? String(rawValue) : String(rawValue);
      const validated = validateAnswer(rawKey, str);
      if (!validated.ok) continue;
      (session.answers as Record<string, unknown>)[rawKey] = validated.value;
      extracted.push(rawKey);
    }
  }

  // Decide next question ourselves — walk the scripted flow from the
  // beginning and stop at the first UNANSWERED field. This is essential
  // because Claude may fill a late field (e.g. est6_lease_status) while
  // leaving an earlier one blank (e.g. q_company_name) — if we walked
  // forward from the last-answered field we'd miss the gap and end the
  // chat prematurely.
  let nextId: QuestionId | null = FIRST_QUESTION;
  while (nextId && session.answers[nextId] !== undefined) {
    nextId = nextQuestion(nextId, session.answers);
  }
  session.currentQuestion = nextId;

  if (!nextId) {
    return {
      session,
      done: true,
      nextQuestionId: null,
      agentMessage: parsed.message?.trim() || compilationMessage(session.answers),
      extracted,
    };
  }

  const nextQ = QUESTIONS[nextId];
  const suggestions = computeSuggestions(nextId, parsed.suggestions);
  return {
    session,
    done: false,
    nextQuestionId: nextId,
    agentMessage: parsed.message?.trim() || nextQ.text,
    suggestions: suggestions.length ? suggestions : undefined,
    input: inputAffordanceFor(nextQ),
    extracted,
  };
}

/* ------------------------------------------------------------------------- */
/* Claude prompt                                                              */
/* ------------------------------------------------------------------------- */

const SYSTEM_PROMPT = `أنت "درع" — مستشار سعودي ذكي للتأسيس والامتثال. تتكلم عربي سعودي دافئ وطبيعي ("تمام"، "ممتاز"، "خلنا"، "طيب"). لا فصحى متصلّبة ولا إنجليزي بلا ضرورة.

وظيفتك إدارة محادثة لجمع معلومات محدّدة من صاحب المشروع، ثم تسليمها لفريق الوكلاء.

══════════ الحقول المطلوبة ══════════

كل حقل له "معرّف" و"قيم مسموح بها فقط". لا تخترع حقلاً ولا قيمة خارج القائمة.

مشتركة (مطلوبة في كل المسارات):
• q0_mode:           "establishment" (مشروع جديد) أو "compliance" (مشروع شغّال)
• q_company_name:    نص حر — اسم المشروع/الشركة. من حرفين إلى ٨٠ حرف.

للتأسيس فقط (إذا q0_mode = establishment):
• est1_vertical:     "restaurant" (مطعم/كوفي) | "tech" (تطبيق/شركة تقنية) | "services" (متجر إلكتروني) | "salon" (صالون/تجميل) | "construction" (مقاولات)
• est2_city:         "riyadh" | "jeddah" | "mecca" | "medina" | "dammam" | "khobar" | "other"
• est3_partner_count: رقم صحيح موجب (عدد المؤسسين بما فيهم المستخدم)
• est4_capital_sar:  رقم صحيح موجب بالريال
• est5_foreign_partner: "yes" | "no"
• est6_lease_status: "not_signed" | "signed" | "no_location_yet"  ← فقط للمطاعم والصالونات والمقاولات (الأنشطة اللي تحتاج موقع فعلي)

للامتثال الرقمي فقط (إذا q0_mode = compliance):
• q1_company_type:   "saas" | "ecommerce" | "fintech" | "services" | "other"
• q2_employee_count: رقم صحيح موجب
• q3_processes_personal_data: "yes" | "no"
• q4_user_count:     "under_10k" | "10k_100k" | "over_100k"   ← فقط إذا q3=yes
• q5_dpo_appointed:  "yes" | "no" | "unknown"                ← فقط إذا q4 != under_10k
• q6_data_location:  "saudi" | "outside" | "unknown"          ← فقط إذا q3=yes
• q7_government_clients: "yes" | "no"
• q8_website_url:    رابط يبدأ بـ https أو null (لو تخطّى)

للامتثال التشغيلي فقط (إذا q0_mode = operational_compliance):
• op1_vertical:              "restaurant" | "salon" | "construction" | "retail"
• op2_city:                  مثل est2_city
• op3_cr_issue_date:         تاريخ ISO "YYYY-MM-DD" لتاريخ إصدار السجل التجاري
• op4_municipal_last_renewed: "YYYY-MM-DD" أو null
• op5_civil_defense_last:    "YYYY-MM-DD" أو null
• op6_sfda_cert_date:        "YYYY-MM-DD" أو null  ← فقط للمطاعم (op1=restaurant)
• op7_employee_count:        رقم صحيح موجب
• op8_lease_expiry:          "YYYY-MM-DD" أو null
• op9_has_website:           "yes" | "no"
• op10_website_url:          رابط https  ← فقط إذا op9=yes

ملاحظات التواريخ: التعرّف على "فبراير ٢٠٢٤" → "2024-02-01". "قبل شهرين" → احسب من اليوم. "ما أدري" → null. لا تخترع تواريخ.

══════════ قواعد الاستخراج ══════════

1. استخرج كل معلومة واضحة من رسالة المستخدم. مثال: "ودي أفتح كوفي بجدة أنا وشريك ٨٠ ألف" →
   { q0_mode: "establishment", est1_vertical: "restaurant", est2_city: "jeddah", est3_partner_count: 2, est4_capital_sar: 80000 }

2. لا تخترع معلومة. لو غامض ← لا تستخرج، اسأل.
3. "اثنين" → 2. "ألفين" → 2000. "١٠٠ ألف" → 100000. "ربع مليون" → 250000.
4. المدينة: "الرياض"/"رياض" → riyadh. "جدة"/"بجده"/"بجدة" → jeddah. "الدمام" → dammam. "الخبر"/"خبر" → khobar. غير الرئيسية → "other".
5. النشاط: "كوفي/قهوة/مطعم" → restaurant. "تطبيق/ساس/سوفت" → tech. "متجر/إلكتروني/أونلاين" → services. "صالون/مركز تجميل" → salon. "مقاولات/عمارة/بناء" → construction.
6. "شريك/شريكين" = 2. "أنا لوحدي" = 1.
7. "سعوديين كلنا/كلّنا سعوديين" → est5_foreign_partner = "no". "شريك أجنبي/فيه أجنبي" → "yes".

══════════ اختيار السؤال التالي ══════════

بعد تحديث الحقول، اختر السؤال التالي حسب هذا الترتيب:
q0_mode → q_company_name → (فرع التأسيس أو الامتثال بترتيبه أعلاه) → null عند اكتمال الحقول المطلوبة.

تخطّ الحقول المجمّعة مسبقاً. لا تسأل عن est6_lease_status إلا للمطاعم/الصالونات/المقاولات. لا تسأل عن q4/q5/q6 إلا لو q3=yes.

══════════ رسالتك للمستخدم ══════════

اكتب رسالة واحدة فقط. لا تسأل سؤالين. اتبع هذا الهيكل بالضبط:

١. **إذا استخرجت حقلين أو أكثر في هذه الجولة**: ابدأ بتلخيص مُرقّم يُعلن كل حقل ✓ مثلاً:
   "ممتاز، وصلتني كل هذي:
   ✓ النشاط: كوفي/مطعم
   ✓ المدينة: جدة
   ✓ الشركاء: اثنين سعوديين
   ✓ رأس المال: ٨٠ ألف ريال"
   ثم جملة ربط قصيرة تبرر السؤال التالي ("بقي شي واحد:").

٢. **إذا استخرجت حقلاً واحداً فقط أو لا شيء**: اعتراف ودّي قصير جداً ("تمام —" أو "ممتاز —") جملة واحدة، ثم السؤال.

٣. **شرح المصطلح** (إن وجد): إذا السؤال التالي فيه DPO/PDPL/نقل البيانات/NCA/ذ.م.م/نطاقات، اشرحه داخل نفس الرسالة (جملة واحدة بسيطة). لا تكرر شرحاً قُدِّم سابقاً.

٤. **السؤال التالي** بوضوح، في سطر مستقل.

قواعد صارمة:
- لا تسأل أكثر من سؤال واحد في نفس الرسالة.
- لا تكرر سؤالاً سبق الإجابة عنه — حتى لو كان الاستخراج من جولة سابقة.
- استخدم العربي السعودي الدافئ، لا الفصحى.
- استخدم ✓ حرفياً (U+2713) لعرض الحقول المستخرجة، لا علامات أخرى.

إذا خلصت كل الحقول المطلوبة: أخرج done=true مع رسالة ختامية دافئة تذكر اسم المشروع.

══════════ اقتراحات الضغط السريع ══════════

إذا السؤال التالي له خيارات محددة، أرجع قائمة suggestions بنفس الـ value/label من المخطّط أعلاه (مو بصياغتك).

══════════ صيغة الإخراج ══════════

JSON صارم، بدون أي نص خارجه:
{
  "extractions": { "fieldId": value, ... },   // الحقول اللي استخرجتها هالجولة
  "done": false,
  "nextQuestionId": "...",                     // معرّف السؤال التالي
  "message": "رسالتك الكاملة بالعربي السعودي",
  "suggestions": [ { "label": "...", "value": "..." }, ... ]   // اختياري
}

أو عند الاكتمال:
{
  "extractions": { ... },
  "done": true,
  "message": "تمام، جمعت كل اللي أحتاجه. الحين أسلّم الوكلاء…"
}`;

interface ClaudeResponse {
  extractions?: Record<string, string | number | null | boolean>;
  done?: boolean;
  nextQuestionId?: string | null;
  message?: string;
  suggestions?: QuickReply[];
}

function buildUserPrompt(session: ChatSession, userInput: string): string {
  const known = Object.entries(session.answers)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `  ${k}: ${JSON.stringify(v)}`)
    .join('\n');
  const askedAbout = session.currentQuestion ?? '(بداية المحادثة)';
  return [
    'الإجابات اللي انجمعت حتى الآن:',
    known || '  (لا شيء بعد)',
    '',
    `السؤال اللي سألته في الجولة السابقة: ${askedAbout}`,
    '',
    'رسالة المستخدم الحالية:',
    `  "${userInput}"`,
    '',
    'استخرج ما تستطيع، اختر السؤال التالي، اكتب رسالة واحدة ترحب + تشرح + تسأل. أخرج JSON.',
  ].join('\n');
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

const QUESTION_IDS: readonly QuestionId[] = [
  'q0_mode', 'q_company_name',
  'est1_vertical', 'est2_city', 'est3_partner_count', 'est4_capital_sar',
  'est5_foreign_partner', 'est6_lease_status',
  'q1_company_type', 'q2_employee_count', 'q3_processes_personal_data',
  'q4_user_count', 'q5_dpo_appointed', 'q6_data_location',
  'q7_government_clients', 'q8_website_url',
  'op1_vertical', 'op2_city', 'op3_cr_issue_date', 'op4_municipal_last_renewed',
  'op5_civil_defense_last', 'op6_sfda_cert_date', 'op7_employee_count',
  'op8_lease_expiry', 'op9_has_website', 'op10_website_url',
];

function isQuestionId(s: string): s is QuestionId {
  return (QUESTION_IDS as readonly string[]).includes(s);
}

function inputAffordanceFor(q: Question): InputAffordance | undefined {
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
    return { kind: 'url_or_skip', placeholder: q.input.placeholder, skipLabel: q.input.skipLabel };
  }
  if (q.input.kind === 'date' || q.input.kind === 'date_or_skip') {
    return { kind: q.input.kind, placeholder: q.input.placeholder, skipLabel: q.input.skipLabel };
  }
  return { kind: 'text', placeholder: 'اكتب جوابك' };
}

/**
 * If Claude returns suggestions, prefer them — but fall back to the scripted
 * options for the next question when Claude omitted them.
 */
function computeSuggestions(
  nextId: QuestionId,
  fromClaude?: QuickReply[],
): QuickReply[] {
  const q = QUESTIONS[nextId];
  if (fromClaude && Array.isArray(fromClaude) && fromClaude.length > 0) {
    // Filter to valid values when the question has a fixed option set.
    if (q.options) {
      const validValues = new Set(q.options.map((o) => o.value));
      const filtered = fromClaude.filter((s) => s && s.value && validValues.has(s.value));
      if (filtered.length > 0) return filtered;
    } else {
      return fromClaude.filter((s) => s && s.label && s.value);
    }
  }
  if (q.options) return q.options.map((o) => ({ label: o.label, value: o.value }));
  return [];
}

function compilationMessage(answers: Answers): string {
  const name = answers.q_company_name?.trim();
  return name
    ? `تمام يا بطل. جمعت كل اللي نحتاجه عن ${name}. الوكلاء الحين يشتغلون ويجهّزون لك التقرير…`
    : 'تمام. جمعت كل اللي نحتاجه. الوكلاء الحين يشتغلون ويجهّزون لك التقرير…';
}
