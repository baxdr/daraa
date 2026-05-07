/**
 * Trade-name availability check.
 *
 * Honest architecture note: mc.gov.sa (منصة الأعمال) and maroof.sa do NOT
 * expose a public name-availability API. The real definitive check still
 * happens when the user submits the CR application on the official portal.
 *
 * What this module does instead:
 *   1. Runs a Claude-powered web search across Saudi business contexts —
 *      commercial registries, Maroof listings, social media mentions,
 *      domain presence — and asks Claude to classify the finding as
 *      likely_available / likely_taken / inconclusive.
 *   2. Falls back gracefully (no key, search failure, parse failure) to
 *      an inconclusive result that steers the user to the official portal.
 *
 * The output is advisory and is labelled as such in the UI.
 */

import { anthropic, hasApiKey, MODELS, parseJsonResponse } from '@/lib/claude';
import type { NameCheckResult } from './runtime/types';

const SEARCH_TIMEOUT_MS = 15_000;

export async function checkTradeName(name: string): Promise<NameCheckResult> {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return {
      status: 'skipped',
      summaryAr: 'اسم قصير جداً للفحص.',
      checkedAt: new Date().toISOString(),
      source: 'fallback',
    };
  }

  if (!hasApiKey()) return fallback(trimmed);

  try {
    return await withTimeout(claudeSearch(trimmed), SEARCH_TIMEOUT_MS);
  } catch (err) {
    console.warn(
      '[name-check] search failed — using fallback:',
      err instanceof Error ? err.message : err,
    );
    return fallback(trimmed);
  }
}

/* ------------------------------------------------------------------------- */
/* Claude web-search path                                                     */
/* ------------------------------------------------------------------------- */

interface ClaudeVerdict {
  status: 'likely_available' | 'likely_taken' | 'inconclusive';
  summary: string;
  evidence?: string[];
  alternatives?: string[];
}

async function claudeSearch(name: string): Promise<NameCheckResult> {
  const system = `أنت باحث عن توفّر الأسماء التجارية السعودية. مهمتك استخدام أداة web_search بشكل حازم لتقدير هل الاسم التجاري "${name}" متاح أو محجوز — بدون ادعاء قاطع.

خطوات البحث:
1. ابحث عن: site:mc.gov.sa "${name}"
2. ابحث عن: site:maroof.sa "${name}"
3. ابحث عن: "${name}" السعودية (للتأكّد من الاستخدام في سياق تجاري سعودي)
4. ابحث عن الاسم بالصياغة الإنجليزية المعقولة (transliteration).
5. ابحث عن الدومينات المرتبطة (${name}.sa، .com.sa).

التصنيف:
- likely_available: لا توجد سجلات تجارية أو صفحات معروف أو دومين نشط بنفس الاسم.
- likely_taken: لقيت سجل تجاري أو صفحة معروف أو دومين نشط مطابق.
- inconclusive: الأدلة متضاربة أو ما قدرت تصل لنتائج ذات دلالة.

أخرج JSON فقط بهذه الصيغة:
{
  "status": "likely_available" | "likely_taken" | "inconclusive",
  "summary": "جملة عربية واحدة تلخّص النتيجة للمستخدم غير المتخصّص.",
  "evidence": ["اقتباس مختصر أو رابط 1", "..."],   // ≤ 3 بنود
  "alternatives": ["اقتراح اسم بديل 1", "..."]       // ≤ 3، فقط لو status = likely_taken
}

ملاحظات صارمة:
- لا تجزم إطلاقاً — استخدم "غالباً"، "يحتمل"، "لا نرى مؤشراً".
- لا تذكر أرقام سجلات ما لقيتها فعلاً.
- لا تقترح بدائل إلا لو status = likely_taken.
- كل نص بالعربي السعودي الودّي.`;

  const userContent = `الاسم المقترح: ${name}\n\nأجرِ البحث كما وصفته وأرجع JSON.`;

  const tools = [{ type: 'web_search_20250305', name: 'web_search' }] as unknown as Parameters<
    typeof anthropic.messages.create
  >[0]['tools'];

  const res = await anthropic.messages.create({
    model: MODELS.sonnet,
    max_tokens: 1500,
    system,
    ...(tools ? { tools } : {}),
    messages: [{ role: 'user', content: userContent }],
  });

  // Extract the last text block — that's where Claude places the JSON after
  // any tool-use rounds.
  const textBlock = [...res.content].reverse().find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('no text block in claude response');
  }
  const verdict = parseJsonResponse<ClaudeVerdict>(textBlock.text);

  const evidence = sanitizeList(verdict.evidence, 3);
  const alternatives =
    verdict.status === 'likely_taken' ? sanitizeList(verdict.alternatives, 3) : undefined;

  return {
    status: verdict.status,
    summaryAr: verdict.summary.trim(),
    ...(evidence ? { evidence } : {}),
    ...(alternatives ? { alternatives } : {}),
    checkedAt: new Date().toISOString(),
    source: 'claude_web_search',
  };
}

/* ------------------------------------------------------------------------- */
/* Fallback                                                                   */
/* ------------------------------------------------------------------------- */

function fallback(name: string): NameCheckResult {
  return {
    status: 'inconclusive',
    summaryAr:
      `ما قدرنا نفحص توفّر اسم "${name}" تلقائياً — منصة الأعمال (mc.gov.sa) ` +
      'ما تعرض فحص أسماء عام عبر الويب. راجع الاسم يدوياً في منصة الأعمال قبل التقديم.',
    checkedAt: new Date().toISOString(),
    source: 'fallback',
  };
}

/* ------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* ------------------------------------------------------------------------- */

function sanitizeList(list: unknown, max: number): string[] | undefined {
  if (!Array.isArray(list)) return undefined;
  const cleaned = list
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .map((s) => s.trim().slice(0, 200))
    .slice(0, max);
  return cleaned.length > 0 ? cleaned : undefined;
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`name-check timed out after ${ms}ms`)), ms);
    p.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e) => {
        clearTimeout(t);
        reject(e);
      },
    );
  });
}
