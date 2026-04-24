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
  kind: 'text' | 'number' | 'url_or_skip';
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const body = continueFrom ? { continueFromProjectId: continueFrom } : {};
        const res = await fetch('/api/chat/start', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error('تعذّر بدء المحادثة');
        const data = (await res.json()) as StartResponse;
        if (cancelled) return;
        setSessionId(data.sessionId);
        setTurns([{ role: 'agent', message: data.agentMessage }]);
        setSuggestions(data.suggestions ?? []);
        setInput(data.input);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [continueFrom]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, done]);

  async function submitAnswer(rawAnswer: string, displayText: string) {
    if (!sessionId || submitting) return;
    const trimmed = rawAnswer.trim();
    if (!trimmed) return;
    setError(null);
    setSubmitting(true);
    setTurns((t) => [...t, { role: 'user', text: displayText }]);
    setFreeText('');
    setSuggestions([]);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: trimmed }),
      });
      const data = (await res.json()) as MessageResponse;

      if (data.error) {
        setError(data.error);
        setTurns((t) => t.slice(0, -1));
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
        const body = (await res2.json()) as { projectId?: string; error?: string };
        if (body.projectId) {
          router.push(`/project/${body.projectId}/agents`);
        } else {
          // Project creation refused — surface the reason and re-enable the
          // chat input so the user can answer the still-missing field.
          setError(body.error ?? 'تعذّر بدء الخطوة التالية');
          setDone(false);
          setInput({ kind: 'text', placeholder: 'اكتب جوابك' });
        }
        return;
      }

      setSuggestions(data.suggestions ?? []);
      setInput(data.input ?? { kind: 'text', placeholder: 'اكتب جوابك' });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      setTurns((t) => t.slice(0, -1));
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
  function handleSkipUrl() {
    submitAnswer('__skip__', 'تخطى الفحص');
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
        <div className="flex items-center gap-3 text-xs text-muted">
          <span>استشارة مباشرة</span>
          <span>·</span>
          <span className="font-mono tabular-nums">{progress}٪</span>
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
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-3 flex items-start gap-2 border-s-2 border-danger bg-danger/5 px-3 py-2 text-sm text-danger"
          >
            <span>{error}</span>
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
            onSkip={input.kind === 'url_or_skip' ? handleSkipUrl : undefined}
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
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type={isUrl ? 'url' : isNumber ? 'text' : 'text'}
          inputMode={isNumber ? 'text' : 'text'}
          dir={isUrl ? 'ltr' : 'rtl'}
          aria-label="اكتب ردك"
          className={`flex-1 border border-ink bg-paper px-4 py-3 text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
            isUrl ? 'font-mono' : ''
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
          {input.skipLabel} ←
        </button>
      )}
    </form>
  );
}

function computeProgress(turns: Turn[]): number {
  const userTurns = turns.filter((t) => t.role === 'user').length;
  return Math.min(100, Math.round((userTurns / 8) * 100));
}
