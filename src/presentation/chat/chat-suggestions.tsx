'use client';

import type { QuickReply } from './types';

interface ChatSuggestionsProps {
  suggestions: QuickReply[];
  submitting: boolean;
  onPick: (opt: QuickReply) => void;
}

export function ChatSuggestions({ suggestions, submitting, onPick }: ChatSuggestionsProps) {
  if (suggestions.length === 0) return null;
  return (
    <div role="group" aria-label="اقتراحات سريعة" className="mb-3 flex flex-wrap gap-2">
      {suggestions.map((opt) => (
        <button
          key={opt.value}
          type="button"
          disabled={submitting}
          onClick={() => onPick(opt)}
          className="min-h-[40px] border border-rule bg-paper-2 px-3.5 py-2 text-[13px] font-semibold text-ink transition-all hover:border-ink hover:bg-ink hover:text-paper focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-not-allowed disabled:opacity-40"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
