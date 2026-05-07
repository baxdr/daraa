'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { AgentMessage, UserMessage } from './chat-message';

interface QuickReply {
  label: string;
  value: string;
}
interface InputAffordance {
  kind: 'text' | 'number' | 'url_or_skip' | 'date' | 'date_or_skip';
  placeholder: string;
  skipLabel?: string;
}

interface StartResponse {
  sessionId: string;
  agentMessage: string;
  nextQuestionId: string | null;
  suggestions: QuickReply[] | null;
  input: InputAffordance | null;
}

interface MessageResponse {
  done: boolean;
  agentMessage: string;
  nextQuestionId?: string | null;
  suggestions?: QuickReply[] | null;
  input?: InputAffordance | null;
  extracted?: string[];
  error?: string;
}

interface AgentTurn {
  role: 'agent';
  message: string;
}
interface UserTurn {
  role: 'user';
  text: string;
}
type Turn = AgentTurn | UserTurn;

/**
 * Claude-driven chat UI. Every turn accepts free text OR a quick-reply tap.
 * The server's chat agent extracts structured fields from whatever the user
 * said; the UI just renders the agent's next message and the suggestions
 * it wants to offer.
 */
export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const continueFrom = searchParams.get('continueFrom');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [suggestions, setSuggestions] = useState<QuickReply[]>([]);
  const [input, setInput] = useState<InputAffordance | null>(null);
  const [freeText, setFreeText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  const [startRetry, setStartRetry] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15_000);
      try {
        const body = continueFrom ? { continueFromProjectId: continueFrom } : {};
        const res = await fetch('/api/chat/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);
        if (!res.ok) throw new Error('تعذّر بدء المحادثة — تحقّق من الخادم');
        const data = (await res.json()) as StartResponse;
        if (cancelled) return;
        setSessionId(data.sessionId);
        setTurns([{ role: 'agent', message: data.agentMessage }]);
        setSuggestions(data.suggestions ?? []);
        setInput(data.input);
        setError(null);
      } catch (e) {
        clearTimeout(timeoutId);
        if (cancelled) return;
        const msg = e instanceof Error && e.name === 'AbortError'
          ? 'انتهت المهلة — الخادم بطيء، حاول مجدداً'
          : e instanceof Error ? e.message : 'خطأ غير متوقع';
        setError(msg);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [continueFrom, startRetry]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, done]);

  async function submitAnswer(rawAnswer: string, displayText: string) {
    if (!sessionId || submitting) return;
    const trimmed = rawAnswer.trim();
    if (!trimmed) return;
    const snapshotSuggestions = suggestions;
    const snapshotInput = input;
    setError(null);
    setSubmitting(true);
    setTurns((t) => [...t, { role: 'user', text: displayText }]);
    setFreeText('');
    setSuggestions([]);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30_000);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: trimmed }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        // Server error (500, 429, etc.) — surface a friendly message AND
        // restore the user's turn + typed text so they can retry without
        // retyping. The server's own error JSON (if any) takes priority.
        let serverMsg: string | undefined;
        try {
          const body = await res.json() as { error?: string };
          serverMsg = body.error;
        } catch { /* non-JSON body */ }
        setError(serverMsg ?? `تعذّر الاتصال (${res.status}) — حاول مرة أخرى`);
        setTurns((t) => t.slice(0, -1));
        setFreeText(displayText);
        setSuggestions(snapshotSuggestions);
        setInput(snapshotInput);
        return;
      }

      const data = (await res.json()) as MessageResponse;

      if (data.error) {
        setError(data.error);
        setTurns((t) => t.slice(0, -1));
        setFreeText(displayText);
        setSuggestions(snapshotSuggestions);
        setInput(snapshotInput);
        return;
      }

      setTurns((t) => [...t, { role: 'agent', message: data.agentMessage }]);

      if (data.done) {
        setDone(true);
        setSuggestions([]);
        setInput(null);

        const res2 = await fetch('/api/project/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        if (!res2.ok) {
          const msg = res2.status === 429
            ? 'تجاوزت الحد المسموح — انتظر دقيقة وحاول.'
            : `تعذّر بدء المشروع (${res2.status})`;
          setError(msg);
          setDone(false);
          setInput({ kind: 'text', placeholder: 'اكتب جوابك' });
          return;
        }
        const body = (await res2.json()) as { projectId?: string; error?: string };
        if (body.projectId) {
          router.push(`/project/${body.projectId}/agents`);
        } else {
          setError(body.error ?? 'تعذّر بدء الخطوة التالية');
          setDone(false);
          setInput({ kind: 'text', placeholder: 'اكتب جوابك' });
        }
        return;
      }

      setSuggestions(data.suggestions ?? []);
      setInput(data.input ?? { kind: 'text', placeholder: 'اكتب جوابك' });
    } catch (e) {
      clearTimeout(timeoutId);
      const msg = e instanceof Error && e.name === 'AbortError'
        ? 'انتهت المهلة — الخادم بطيء. حاول مجدداً.'
        : e instanceof Error ? e.message : 'خطأ غير متوقع';
      setError(msg);
      setTurns((t) => t.slice(0, -1));
      setFreeText(displayText);
      setSuggestions(snapshotSuggestions);
      setInput(snapshotInput);
    } finally {
      setSubmitting(false);
    }
  }

  function handleQuickReply(opt: QuickReply) {
    submitAnswer(opt.value, opt.label);
  }
  function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!freeText.trim()) return;
    submitAnswer(freeText, freeText);
  }
  function handleSkipInput() {
    // Show the same label the user actually clicked — not a generic "تخطى".
    // Makes the chat log match their action instead of showing a short "تخطى"
    // bubble after clicking "تخطى — أبي التقرير بدون فحص الموقع".
    const label = input?.skipLabel?.trim() || 'تخطى';
    submitAnswer('__skip__', label);
  }

  const progress = computeProgress(turns);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-3xl flex-col">
      {/* Masthead */}
      <header className="flex items-center justify-between border-b border-rule px-5 py-4 md:px-8">
        <Link href="/" className="flex items-center gap-2.5 group" aria-label="درع — العودة للرئيسية">
          <svg width="22" height="22" viewBox="0 0 34 34" aria-hidden="true" className="text-accent">
            <path d="M17 3 L29 9 L29 19 Q29 27 17 31 Q5 27 5 19 L5 9 Z"
              fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M11 17 L15 21 L23 13"
              fill="none" stroke="currentColor" strokeWidth="2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className="font-display text-lg font-extrabold tracking-tight group-hover:text-accent">
            درع
          </span>
        </Link>
        <div className="flex flex-col items-end gap-0.5 text-xs text-muted">
          <span>استشارة مباشرة</span>
          <span className="font-mono tabular-nums">السؤال {computeQuestionCount(turns)}/{expectedTurnsForMode(turns)}</span>
        </div>
      </header>

      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="تقدّم المحادثة"
        className="h-0.5 w-full bg-rule/40"
      >
        <div
          className="h-full bg-accent transition-[width] duration-500"
          style={{ width: `${progress}%`, marginInlineStart: 'auto' }}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
        <div
          className="space-y-5"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="المحادثة"
        >
          {turns.map((turn, i) =>
            turn.role === 'agent'
              ? <AgentMessage key={i} text={turn.message} />
              : <UserMessage key={i} text={turn.text} />,
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      <footer className="border-t border-rule px-5 py-4 md:px-8">
        {turns.length > 1 && (
          <div className="mb-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="text-xs text-muted hover:text-ink transition-colors underline decoration-rule decoration-1 underline-offset-2 hover:decoration-ink"
              title="ابدأ محادثة جديدة"
            >
              ← ابدأ محادثة جديدة
            </button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-3 flex flex-col gap-2 border-s-2 border-danger bg-danger/5 px-3 py-2"
          >
            <span className="text-sm text-danger">{error}</span>
            <div className="flex gap-2">
              {!sessionId && (
                <button
                  type="button"
                  onClick={() => { setError(null); setStartRetry((n) => n + 1); }}
                  className="shrink-0 border border-danger px-2 py-1 text-xs font-semibold text-danger hover:bg-danger hover:text-paper transition-colors"
                >
                  أعد المحاولة
                </button>
              )}
              {sessionId && (
                <button
                  type="button"
                  onClick={() => setError(null)}
                  className="shrink-0 border border-danger px-2 py-1 text-xs font-semibold text-danger hover:bg-danger hover:text-paper transition-colors"
                >
                  تجاهل التنبيه
                </button>
              )}
            </div>
          </div>
        )}

        {!done && suggestions.length > 0 && (
          <div role="group" aria-label="اقتراحات سريعة" className="mb-3 flex flex-wrap gap-2">
            {suggestions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                disabled={submitting}
                onClick={() => handleQuickReply(opt)}
                className="min-h-[40px] border border-rule bg-paper-2 px-3.5 py-2 text-[13px] font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}

        {!done && input && (
          <FreeInput
            input={input}
            value={freeText}
            onChange={setFreeText}
            onSubmit={handleFreeSubmit}
            onSkip={input.kind === 'url_or_skip' || input.kind === 'date_or_skip' ? handleSkipInput : undefined}
            submitting={submitting}
          />
        )}

        {done && (
          <div className="flex items-center gap-3 border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-strong">
            <span className="h-2 w-2 animate-pulse-subtle rounded-full bg-accent" aria-hidden />
            <span className="font-medium">جاري تحضير تقريرك…</span>
          </div>
        )}

        <p className="mt-3 text-xs text-muted">
          أداة استرشادية — لا تغني عن الاستشارة القانونية.
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function FreeInput({
  input,
  value,
  onChange,
  onSubmit,
  onSkip,
  submitting,
}: {
  input: InputAffordance;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSkip?: () => void;
  submitting: boolean;
}) {
  const isUrl = input.kind === 'url_or_skip';
  const isNumber = input.kind === 'number';
  const isDate = input.kind === 'date' || input.kind === 'date_or_skip';
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          // type=text for dates — native type=date would force a
          // browser-locale dd/mm/yyyy picker that contradicts our ISO
          // validator. Keep the user typing the format we actually accept.
          type={isUrl ? 'url' : 'text'}
          inputMode={isNumber ? 'numeric' : isDate ? 'numeric' : 'text'}
          pattern={isDate ? '\\d{4}-\\d{2}-\\d{2}' : undefined}
          dir={isUrl || isDate || isNumber ? 'ltr' : 'rtl'}
          aria-label="اكتب ردك"
          className={`flex-1 border border-ink bg-paper px-4 py-3 text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
            isUrl || isDate ? 'font-mono' : ''
          }`}
          placeholder={input.placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !value.trim()}
          className="btn-ink px-6 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? '…' : 'إرسال'}
        </button>
      </div>
      {onSkip && input.skipLabel && (
        <button
          type="button"
          onClick={onSkip}
          disabled={submitting}
          className="self-start text-xs text-muted underline decoration-rule decoration-2 underline-offset-4 hover:text-ink hover:decoration-accent disabled:opacity-40"
        >
          {input.skipLabel ?? 'تخطى'} ←
        </button>
      )}
    </form>
  );
}

/** Expected question count per mode — used for a mode-aware progress bar.
 *  Establishment: q0 + q_company_name + est1..est6 = 8
 *  Digital compliance: q0 + q_company_name + q1..q8 (conditional) = up to 10
 *  Operational: q0 + q_company_name + op1..op10 (conditional) = up to 12
 *  We take the max for the branch the user is on; fallback = 8 before mode
 *  is selected. */
function expectedTurnsForMode(turns: Turn[]): number {
  // Inspect the earliest user turn — whichever mode button they picked.
  const first = turns.find((t) => t.role === 'user' && typeof (t as { text: string }).text === 'string');
  const label = first && 'text' in first ? first.text : '';
  if (label.includes('شغّال رقمي') || label.includes('PDPL')) return 10;
  if (label.includes('محل') || label.includes('مطعم') || label.includes('رخصي')) return 12;
  if (label.includes('مشروع جديد')) return 8;
  return 8;
}

function computeProgress(turns: Turn[]): number {
  const userTurns = turns.filter((t) => t.role === 'user').length;
  const expected = expectedTurnsForMode(turns);
  return Math.min(100, Math.round((userTurns / expected) * 100));
}

function computeQuestionCount(turns: Turn[]): number {
  return turns.filter((t) => t.role === 'user').length;
}
