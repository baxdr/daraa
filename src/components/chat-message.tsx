import type { ReactNode } from 'react';
import type { TermId } from '@/knowledge/terms';
import { TermTooltip } from './term-tooltip';

/**
 * Flat editorial chat bubbles — no tails, no rounded gimmicks.
 *
 * Agent side: subtle paper-2 surface with a small accent marker to the right
 * (speaker side in RTL). User side: solid accent fill, left-aligned.
 */

interface AgentMessageProps {
  text: string;
  hint?: string;
  terms?: TermId[];
  children?: ReactNode;
}

export function AgentMessage({ text, hint, terms, children }: AgentMessageProps) {
  return (
    <div className="flex gap-4 animate-fade-rise">
      <AgentMark />
      <div className="min-w-0 flex-1">
        <div className="border border-rule bg-paper-2 px-5 py-4 text-ink">
          <p className="text-[15px] leading-relaxed">{text}</p>
          {hint && <p className="mt-2 text-sm leading-relaxed text-ink-2">{hint}</p>}
          {terms?.length ? (
            <div className="mt-3 space-y-1.5">
              {terms.map((t) => (
                <TermTooltip key={t} termId={t} />
              ))}
            </div>
          ) : null}
        </div>
        {children && <div className="mt-3">{children}</div>}
      </div>
    </div>
  );
}

export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex justify-end animate-fade-rise">
      <div className="max-w-[78%] bg-ink px-5 py-3.5 text-paper">
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
