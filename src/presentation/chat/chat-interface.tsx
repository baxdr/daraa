'use client';

import Link from 'next/link';
import { AgentMessage, UserMessage } from '@/presentation/components/chat-message';
import { ChatErrorBanner } from './chat-error-banner';
import { FreeInput } from './chat-input';
import { ChatSuggestions } from './chat-suggestions';
import { computeProgress, computeQuestionCount } from './progress';

const EXPECTED_QUESTIONS = 16;
import { useChatSession } from './use-chat-session';

/**
 * Claude-driven chat UI. Every turn accepts free text OR a quick-reply tap.
 * The server's chat agent extracts structured fields from whatever the user
 * said; the UI just renders the agent's next message and the suggestions
 * it wants to offer.
 */
export function ChatInterface() {
  const session = useChatSession();
  const {
    sessionId,
    turns,
    suggestions,
    input,
    freeText,
    submitting,
    error,
    done,
    bottomRef,
    setFreeText,
    handleQuickReply,
    handleFreeSubmit,
    handleSkipInput,
    dismissError,
    retryStart,
  } = session;

  const progress = computeProgress(turns);
  const showSkip = input?.kind === 'url_or_skip' || input?.kind === 'date_or_skip';

  return (
    <div className="mx-auto flex h-[100dvh] max-w-3xl flex-col">
      <ChatMasthead questionCount={computeQuestionCount(turns)} expected={EXPECTED_QUESTIONS} />

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
            turn.role === 'agent' ? (
              <AgentMessage key={i} text={turn.message} />
            ) : (
              <UserMessage key={i} text={turn.text} />
            ),
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
              className="text-xs text-muted underline decoration-rule decoration-1 underline-offset-2 transition-colors hover:text-ink hover:decoration-ink"
              title="ابدأ محادثة جديدة"
            >
              ← ابدأ محادثة جديدة
            </button>
          </div>
        )}

        {error && (
          <ChatErrorBanner
            message={error}
            hasSession={Boolean(sessionId)}
            onRetry={retryStart}
            onDismiss={dismissError}
          />
        )}

        {!done && (
          <ChatSuggestions
            suggestions={suggestions}
            submitting={submitting}
            onPick={handleQuickReply}
          />
        )}

        {!done && input && (
          <FreeInput
            input={input}
            value={freeText}
            onChange={setFreeText}
            onSubmit={handleFreeSubmit}
            {...(showSkip ? { onSkip: handleSkipInput } : {})}
            submitting={submitting}
          />
        )}

        {done && (
          <div className="flex items-center gap-3 border border-accent/30 bg-accent-soft px-4 py-3 text-sm text-accent-strong">
            <span className="h-2 w-2 animate-pulse-subtle rounded-full bg-accent" aria-hidden />
            <span className="font-medium">جاري تحضير تقريرك…</span>
          </div>
        )}

        <p className="mt-3 text-xs text-muted">أداة استرشادية — لا تغني عن الاستشارة القانونية.</p>
      </footer>
    </div>
  );
}

function ChatMasthead({ questionCount, expected }: { questionCount: number; expected: number }) {
  return (
    <header className="flex items-center justify-between border-b border-rule px-5 py-4 md:px-8">
      <Link href="/" className="group flex items-center gap-2.5" aria-label="درع — العودة للرئيسية">
        <svg width="22" height="22" viewBox="0 0 34 34" aria-hidden="true" className="text-accent">
          <path
            d="M17 3 L29 9 L29 19 Q29 27 17 31 Q5 27 5 19 L5 9 Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
          />
          <path
            d="M11 17 L15 21 L23 13"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-display text-lg font-extrabold tracking-tight group-hover:text-accent">
          درع
        </span>
      </Link>
      <div className="flex flex-col items-end gap-0.5 text-xs text-muted">
        <span>استشارة مباشرة</span>
        <span className="font-mono tabular-nums">
          السؤال {questionCount}/{expected}
        </span>
      </div>
    </header>
  );
}
