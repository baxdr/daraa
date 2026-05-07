import type { ReactNode } from 'react';
import { TERMS, type TermId } from '@/knowledge/terms';

/**
 * Flat editorial chat bubbles — no tails, no rounded gimmicks.
 *
 * Agent side: subtle paper-2 surface with a small accent marker to the right
 * (speaker side in RTL). User side: solid accent fill, left-aligned.
 *
 * Terms render as inline margin-notes directly inside the bubble — the
 * explanation is embedded in the question itself, not hidden behind a chip.
 */

interface AgentMessageProps {
  text: string;
  hint?: string;
  terms?: TermId[];
  children?: ReactNode;
}

export function AgentMessage({ text, hint, terms, children }: AgentMessageProps) {
  return (
    <div className="flex animate-fade-rise gap-4">
      <AgentMark />
      <div className="min-w-0 flex-1">
        <div className="border border-rule bg-paper-2 px-5 py-4 text-ink">
          <p className="text-[15px] leading-relaxed">{text}</p>
          {hint && <p className="mt-2 text-sm leading-relaxed text-ink-2">{hint}</p>}
          {terms?.length ? (
            <div className="mt-3 space-y-2.5 border-t border-rule/70 pt-3">
              {terms.map((t) => (
                <InlineTerm key={t} termId={t} />
              ))}
            </div>
          ) : null}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

function InlineTerm({ termId }: { termId: TermId }) {
  const term = TERMS[termId];
  if (!term) return null;
  return (
    <div className="text-[13.5px] leading-relaxed text-ink-2">
      <span className="me-2 font-mono text-[10px] font-bold tracking-[0.16em] text-accent">
        مصطلح
      </span>
      <span className="font-display font-extrabold tracking-tight text-ink">{term.termAr}</span>
      <span className="mx-1 text-muted">—</span>
      <span>{term.simpleExplanation}</span>
      {term.analogy && (
        <div className="mt-1 text-ink-2/90">
          <span className="font-semibold">تشبيه: </span>
          {term.analogy}
        </div>
      )}
      {term.whenRequired && (
        <div className="mt-1 text-ink-2/90">
          <span className="font-semibold">متى ينطبق: </span>
          {term.whenRequired}
        </div>
      )}
    </div>
  );
}

export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex animate-fade-rise justify-end">
      <div className="max-w-[78%] bg-ink px-5 py-3.5 text-paper" dir="auto">
        <p className="text-[15px] leading-relaxed">{text}</p>
      </div>
    </div>
  );
}

/* Agent wordmark — compact shield-check (same as landing DaraaMark). */
function AgentMark() {
  return (
    <div
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-rule bg-white text-accent"
      aria-label="درع"
    >
      <svg width="18" height="18" viewBox="0 0 34 34" aria-hidden>
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
    </div>
  );
}
