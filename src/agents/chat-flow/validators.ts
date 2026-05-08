/**
 * Answer validation + coercion for the chat flow.
 *
 * Each input kind (text, number, choice, url_or_skip, date_or_skip) has its
 * own normalisation rules. Returns an `Answers` field value on success
 * or an Arabic error message on failure.
 */

import type { Answers, QuestionId } from './types';
import { QUESTIONS } from './questions';

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
    const parsed = parseFlexibleDate(rawAnswer);
    if (!parsed) return { ok: false, error: 'التاريخ بصيغة YYYY-MM-DD (مثل 2024-03-15)' };
    return { ok: true, value: parsed as Answers[QuestionId] };
  }

  return { ok: false, error: 'سؤال غير معروف' };
}

/**
 * Parse a date typed by a human and return canonical YYYY-MM-DD.
 *
 * Accepts: ISO (2026-03-15), human Arabic order (15-3-2026, 15/3/2026,
 * 15.3.2026), and both single- and zero-padded month/day. Rejects ambiguous
 * or out-of-range values.
 */
function parseFlexibleDate(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const parts = trimmed.split(/[-/.\s]+/).filter(Boolean);
  if (parts.length !== 3) return null;
  const [a, b, c] = parts as [string, string, string];
  let year: number, month: number, day: number;
  if (a.length === 4) {
    year = Number(a);
    month = Number(b);
    day = Number(c);
  } else if (c.length === 4) {
    day = Number(a);
    month = Number(b);
    year = Number(c);
  } else {
    return null;
  }
  if (!Number.isFinite(year) || !Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (year < 2000 || year > 2100) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const dt = new Date(Date.UTC(year, month - 1, day));
  if (dt.getUTCFullYear() !== year || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) {
    return null;
  }
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}
