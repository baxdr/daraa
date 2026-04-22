'use client';

import { useId, useState } from 'react';
import { TERMS, type TermId } from '@/knowledge/terms';

/**
 * Inline "اشرح لي X" chip — the warmest, most explainer-y moment in the UI.
 *
 * Palette revised after a11y review: the earlier warn-on-warn-soft combo
 * failed WCAG AA. Now uses paper-2 surface with accent label (~10:1 contrast)
 * and full ink body text, which also reads more like a margin-note in the
 * editorial vocabulary of the product.
 */
export function TermTooltip({ termId }: { termId: TermId }) {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const term = TERMS[termId];
  if (!term) return null;

  return (
    <div className="overflow-hidden border border-rule bg-paper-2/70 text-sm text-ink">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-right font-medium transition-colors hover:bg-paper-2"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? `إخفاء شرح ${term.termAr}` : `اشرح ${term.termAr}`}
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-[10px] font-bold tracking-[0.16em] text-accent">
            مصطلح
          </span>
          <span className="font-display font-extrabold tracking-tight">{term.termAr}؟</span>
        </span>
        <span className="font-mono text-[11px] text-ink-2">{open ? '—' : 'اشرح'}</span>
      </button>
      {open && (
        <div
          id={panelId}
          className="space-y-2 border-t border-rule px-3 py-3 leading-relaxed animate-fade-rise"
        >
          <p>{term.simpleExplanation}</p>
          {term.analogy && (
            <p className="text-ink-2">
              <span className="font-semibold">تشبيه: </span>
              {term.analogy}
            </p>
          )}
          {term.example && (
            <p className="text-ink-2">
              <span className="font-semibold">مثال: </span>
              {term.example}
            </p>
          )}
          {term.whenRequired && (
            <p className="text-ink-2">
              <span className="font-semibold">متى ينطبق: </span>
              {term.whenRequired}
            </p>
          )}
          {term.whatToDo && (
            <p className="text-ink-2">
              <span className="font-semibold">وش تسوي: </span>
              {term.whatToDo}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
