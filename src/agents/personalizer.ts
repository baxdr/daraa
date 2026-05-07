/**
 * Gap / warning personalizer.
 *
 * The base gap/warning text comes from static templates in analysis-agent.ts
 * and knowledge/entities.ts. That's predictable but feels canned. This
 * personalizer runs once per scan (or plan) and rewrites each explanation
 * referencing the user's actual answers — their sector, user count, hosting
 * location, capital, city, etc.
 *
 * One LLM call per run. On any failure (missing key, network, parse), the
 * originals are returned unchanged — the product is fully usable without it.
 */

import { callClaude, hasApiKey, MODELS, parseJsonResponse } from '@/lib/claude';
import type { Gap } from './analysis-agent';
import type { Answers } from './chat-flow';

interface RewriteRequest {
  id: string;
  originalAr: string;
}
interface RewriteResponse {
  id: string;
  rewrittenAr: string;
}

/**
 * Rewrite every gap's explanation to reference the user's specifics.
 * Returns a new gap array (original order preserved) with `explanationAr`
 * replaced where the LLM produced a result; untouched otherwise.
 */
export async function personalizeGaps(answers: Answers, gaps: Gap[]): Promise<Gap[]> {
  if (gaps.length === 0) return gaps;
  if (!hasApiKey()) return gaps;

  const requests: RewriteRequest[] = gaps.map((g) => ({ id: g.id, originalAr: g.explanationAr }));

  try {
    const rewrites = await askClaudeToRewrite(requests, companyContextLines(answers));
    const byId = new Map(rewrites.map((r) => [r.id, r.rewrittenAr] as const));
    return gaps.map((g) => {
      const rewritten = byId.get(g.id);
      return rewritten && rewritten.trim().length > 20
        ? { ...g, explanationAr: rewritten.trim() }
        : g;
    });
  } catch (err) {
    console.warn(
      '[personalizer] gap rewrite failed, keeping templates:',
      err instanceof Error ? err.message : err,
    );
    return gaps;
  }
}

/**
 * Rewrite establishment-path top-warnings with the same context approach.
 * Input is an array of warning strings; output is the same length.
 */
export async function personalizeWarnings(answers: Answers, warnings: string[]): Promise<string[]> {
  if (warnings.length === 0) return warnings;
  if (!hasApiKey()) return warnings;

  const requests: RewriteRequest[] = warnings.map((w, i) => ({ id: `w${i}`, originalAr: w }));
  try {
    const rewrites = await askClaudeToRewrite(requests, companyContextLines(answers));
    const byId = new Map(rewrites.map((r) => [r.id, r.rewrittenAr] as const));
    return warnings.map((w, i) => {
      const rewritten = byId.get(`w${i}`);
      return rewritten && rewritten.trim().length > 20 ? rewritten.trim() : w;
    });
  } catch (err) {
    console.warn(
      '[personalizer] warning rewrite failed, keeping originals:',
      err instanceof Error ? err.message : err,
    );
    return warnings;
  }
}

/* ------------------------------------------------------------------------- */

async function askClaudeToRewrite(
  items: RewriteRequest[],
  contextLines: string[],
): Promise<RewriteResponse[]> {
  const system = `أنت مستشار امتثال وتأسيس سعودي. مهمتك: تُعيد كتابة شرح كل فقرة أدناه بحيث تشير لبيانات المستخدم الفعلية، بدل النصوص العامة.

قواعد صارمة:
- كل فقرة منفصلة، لها id ثابت — حافظ على نفس id في المخرجات.
- الأسلوب: عربي سعودي بسيط ودّي (مثل "موقعكم"، "بما إنكم"، "بالنسبة لـ")، ليس فصحى رسمية.
- كل فقرة: جملتين إلى ثلاث جمل قصيرة — بدون إطالة أو تكرار.
- اذكر ضمنياً على الأقل معلومة واحدة من سياق المستخدم (القطاع / العدد / المدينة / الموقع / راس المال / استضافة البيانات) في كل فقرة.
- لا تكرر العنوان. لا تضيف توصيات لم تكن في الأصل. لا تذكر مواد قانونية محددة لم تذكر بالأصل.
- لا تستخدم إيموجي أو علامات markdown.

أخرج JSON فقط بهذه الصيغة بالضبط، بدون نص تمهيدي:
[
  { "id": "...", "rewrittenAr": "..." },
  ...
]`;

  const userPrompt =
    'سياق المستخدم:\n' +
    contextLines.map((l) => `  - ${l}`).join('\n') +
    '\n\nالفقرات المراد إعادة كتابتها:\n' +
    items.map((it) => `[${it.id}]\n${it.originalAr}`).join('\n\n---\n\n');

  const raw = await callClaude({
    model: MODELS.sonnet,
    system,
    user: userPrompt,
    maxTokens: 1800,
  });

  const parsed = parseJsonResponse<unknown>(raw);
  if (!Array.isArray(parsed)) throw new Error('personalizer payload is not an array');

  const out: RewriteResponse[] = [];
  for (const raw of parsed) {
    if (typeof raw !== 'object' || raw === null) continue;
    const r = raw as Record<string, unknown>;
    if (typeof r.id !== 'string' || typeof r.rewrittenAr !== 'string') continue;
    out.push({ id: r.id, rewrittenAr: r.rewrittenAr });
  }
  return out;
}

function companyContextLines(answers: Answers): string[] {
  const lines: string[] = [];

  // Compliance-path fields
  if (answers.q1_company_type) {
    lines.push(`القطاع: ${companyTypeLabel(answers.q1_company_type)}`);
  }
  if (answers.q2_employee_count) lines.push(`عدد الموظفين: ${answers.q2_employee_count}`);
  if (answers.q4_user_count) {
    lines.push(`قاعدة المستخدمين: ${userScaleLabel(answers.q4_user_count)}`);
  }
  if (answers.q5_dpo_appointed) {
    lines.push(
      `حالة DPO: ${answers.q5_dpo_appointed === 'yes' ? 'مُعيَّن' : answers.q5_dpo_appointed === 'no' ? 'غير مُعيَّن' : 'غير معروف'}`,
    );
  }
  if (answers.q6_data_location) {
    lines.push(
      `استضافة البيانات: ${
        answers.q6_data_location === 'saudi'
          ? 'داخل المملكة'
          : answers.q6_data_location === 'outside'
            ? 'خارج المملكة'
            : 'غير محدد'
      }`,
    );
  }
  if (answers.q7_government_clients === 'yes') lines.push('تتعامل مع جهات حكومية');

  // Establishment-path fields
  if (answers.est1_vertical) lines.push(`نوع المشروع: ${verticalLabel(answers.est1_vertical)}`);
  if (answers.est2_city) lines.push(`المدينة: ${cityLabel(answers.est2_city)}`);
  if (answers.est3_partner_count) lines.push(`عدد الشركاء: ${answers.est3_partner_count}`);
  if (answers.est4_capital_sar) {
    lines.push(`رأس المال: ${answers.est4_capital_sar.toLocaleString('en-US')} ريال`);
  }
  if (answers.est5_foreign_partner === 'yes') lines.push('يوجد شريك أجنبي');

  return lines;
}

function companyTypeLabel(v: NonNullable<Answers['q1_company_type']>): string {
  switch (v) {
    case 'saas':
      return 'شركة SaaS';
    case 'ecommerce':
      return 'متجر إلكتروني';
    case 'fintech':
      return 'فينتك';
    case 'services':
      return 'خدمات';
    case 'other':
      return 'أخرى';
  }
}

function userScaleLabel(v: NonNullable<Answers['q4_user_count']>): string {
  switch (v) {
    case 'under_10k':
      return 'أقل من ١٠ آلاف';
    case '10k_100k':
      return 'بين ١٠ آلاف و ١٠٠ ألف';
    case 'over_100k':
      return 'أكثر من ١٠٠ ألف';
  }
}

function verticalLabel(v: NonNullable<Answers['est1_vertical']>): string {
  switch (v) {
    case 'restaurant':
      return 'مطعم / كوفي شوب';
    case 'tech':
      return 'شركة تقنية';
    case 'services':
      return 'متجر إلكتروني';
    case 'salon':
      return 'صالون';
    case 'construction':
      return 'مقاولات';
  }
}

function cityLabel(v: string): string {
  const map: Record<string, string> = {
    riyadh: 'الرياض',
    jeddah: 'جدة',
    mecca: 'مكة المكرمة',
    medina: 'المدينة المنورة',
    dammam: 'الدمام',
    khobar: 'الخُبَر',
    other: 'مدينة أخرى',
  };
  return map[v] ?? v;
}
