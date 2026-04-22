'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AgentMessage, UserMessage } from './chat-message';
import type { Answers, Question, QuickOption } from '@/agents/chat-flow';
import type { TermId } from '@/knowledge/terms';

interface AgentTurn {
  role: 'agent';
  question: Question;
}
interface UserTurn {
  role: 'user';
  text: string;
}
/** Agent-spoken status line that isn't tied to a scripted question — used for
 *  the "تمام، الوكلاء يشتغلون" hand-off after the flow completes. */
interface StatusTurn {
  role: 'status';
  text: string;
}
type Turn = AgentTurn | UserTurn | StatusTurn;

export function ChatInterface() {
  const router = useRouter();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [freeInput, setFreeInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/chat/start', { method: 'POST' });
        if (!res.ok) throw new Error('تعذّر بدء المحادثة');
        const data = (await res.json()) as { sessionId: string; question: Question | null };
        if (cancelled) return;
        setSessionId(data.sessionId);
        if (data.question) {
          setTurns([{ role: 'agent', question: data.question }]);
          setCurrentQuestion(data.question);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, done]);

  async function submitAnswer(rawAnswer: string, displayText: string) {
    if (!sessionId || submitting) return;
    setError(null);
    setSubmitting(true);
    setTurns((t) => [...t, { role: 'user', text: displayText }]);

    try {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, answer: rawAnswer }),
      });
      const data = (await res.json()) as
        | { done: true; answers: Record<string, unknown> }
        | { done: false; bridge: string | null; question: Question }
        | { error: string };

      if ('error' in data) {
        setError(data.error);
        setTurns((t) => t.slice(0, -1));
        return;
      }

      if (data.done) {
        setDone(true);
        setCurrentQuestion(null);
        setTurns((t) => [
          ...t,
          {
            role: 'status',
            text: 'تمام. الوكلاء الحين يجمعون بياناتك ويحضّرون التقرير…',
          },
        ]);

        try {
          const answers = data.answers as Partial<Answers>;
          const endpoint =
            answers.q0_mode === 'establishment'
              ? '/api/establishment/resolve'
              : '/api/scan/start';
          const res2 = await fetch(endpoint, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ sessionId }),
          });
          const body = (await res2.json()) as { planId?: string; scanId?: string; error?: string };
          if (body.planId) router.push(`/establishment/${body.planId}`);
          else if (body.scanId) router.push(`/scan/${body.scanId}`);
          else setError(body.error ?? 'تعذّر بدء الخطوة التالية');
        } catch (e) {
          setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
        }
      } else {
        setCurrentQuestion(data.question);
        // If the server attached a bridge sentence, render it as a status
        // turn first — this is the "agent thinks and comments" moment.
        const newTurns: Turn[] = [];
        if (data.bridge && data.bridge.trim()) {
          newTurns.push({ role: 'status', text: data.bridge.trim() });
        }
        newTurns.push({ role: 'agent', question: data.question });
        setTurns((t) => [...t, ...newTurns]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      setTurns((t) => t.slice(0, -1));
    } finally {
      setSubmitting(false);
      setFreeInput('');
    }
  }

  function handleQuickAnswer(opt: QuickOption) {
    submitAnswer(opt.value, opt.label);
  }
  function handleFreeSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!freeInput.trim()) return;
    submitAnswer(freeInput, freeInput);
  }
  function handleSkipUrl() {
    submitAnswer('__skip__', 'تخطى الفحص');
  }

  const progress = computeProgress(turns);

  return (
    <div className="mx-auto flex h-[100dvh] max-w-3xl flex-col">
      {/* Masthead — thin, editorial */}
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

      {/* Progress bar — RTL-aware: fills from right to left. */}
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

      {/* Conversation canvas — assistive live region so new agent questions are announced. */}
      <div className="flex-1 overflow-y-auto px-5 py-8 md:px-8">
        <div
          className="space-y-5"
          role="log"
          aria-live="polite"
          aria-relevant="additions text"
          aria-label="المحادثة"
        >
          {turns.map((turn, i) => {
            if (turn.role === 'agent') {
              return (
                <AgentMessage
                  key={i}
                  text={turn.question.text}
                  hint={turn.question.hint}
                  terms={turn.question.terms as TermId[] | undefined}
                />
              );
            }
            if (turn.role === 'status') {
              return <AgentMessage key={i} text={turn.text} />;
            }
            return <UserMessage key={i} text={turn.text} />;
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Footer dock: error → input → micro-disclaimer */}
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

        <InputArea
          question={currentQuestion}
          submitting={submitting}
          done={done}
          freeInput={freeInput}
          setFreeInput={setFreeInput}
          onQuick={handleQuickAnswer}
          onFreeSubmit={handleFreeSubmit}
          onSkipUrl={handleSkipUrl}
        />

        <p className="mt-3 text-xs text-muted">
          أداة استرشادية — لا تغني عن الاستشارة القانونية.
        </p>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function computeProgress(turns: Turn[]): number {
  // Rough completion indicator: number of user answers so far / expected total.
  // Total depends on the branch; we approximate between 5 and 8 answers.
  const userAnswers = turns.filter((t) => t.role === 'user').length;
  const rough = Math.min(100, Math.round((userAnswers / 8) * 100));
  return rough;
}

interface InputAreaProps {
  question: Question | null;
  submitting: boolean;
  done: boolean;
  freeInput: string;
  setFreeInput: (v: string) => void;
  onQuick: (opt: QuickOption) => void;
  onFreeSubmit: (e: React.FormEvent) => void;
  onSkipUrl: () => void;
}

function InputArea({
  question,
  submitting,
  done,
  freeInput,
  setFreeInput,
  onQuick,
  onFreeSubmit,
  onSkipUrl,
}: InputAreaProps) {
  if (done) {
    return (
      <div className="flex items-center gap-3 border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-strong">
        <span className="h-2 w-2 animate-pulse-subtle rounded-full bg-accent" aria-hidden />
        <span className="font-medium">جاري تحضير تقريرك…</span>
      </div>
    );
  }
  if (!question) {
    return <div className="h-12" />;
  }

  if (question.options) {
    return (
      <div role="group" aria-label="الخيارات المتاحة" className="flex flex-wrap gap-2">
        {question.options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            disabled={submitting}
            onClick={() => onQuick(opt)}
            className="min-h-[44px] border border-ink bg-paper px-4 py-2.5 text-sm font-semibold text-ink transition-all hover:bg-ink hover:text-paper focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:border-rule disabled:bg-paper-2 disabled:text-muted"
          >
            {opt.label}
          </button>
        ))}
      </div>
    );
  }

  const input = question.input;
  if (!input) return null;

  const isUrl = input.kind === 'url_or_skip';

  return (
    <form onSubmit={onFreeSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          type={isUrl ? 'url' : input.kind === 'number' ? 'number' : 'text'}
          inputMode={input.kind === 'number' ? 'numeric' : 'text'}
          dir={isUrl ? 'ltr' : 'rtl'}
          aria-label={question.text}
          className={`flex-1 border border-ink bg-paper px-4 py-3 text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent ${
            isUrl || input.kind === 'number' ? 'font-mono tabular-nums' : ''
          }`}
          placeholder={input.placeholder}
          value={freeInput}
          onChange={(e) => setFreeInput(e.target.value)}
          disabled={submitting}
        />
        <button
          type="submit"
          disabled={submitting || !freeInput.trim()}
          className="btn-ink px-6 py-3 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          إرسال
        </button>
      </div>
      {isUrl && input.skipLabel && (
        <button
          type="button"
          onClick={onSkipUrl}
          disabled={submitting}
          className="self-start text-xs text-muted underline decoration-rule decoration-2 underline-offset-4 hover:text-ink hover:decoration-accent disabled:opacity-40"
        >
          {input.skipLabel} ←
        </button>
      )}
    </form>
  );
}
