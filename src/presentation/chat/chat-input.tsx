'use client';

import type { InputAffordance } from './types';

interface FreeInputProps {
  input: InputAffordance;
  value: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onSkip?: () => void;
  submitting: boolean;
}

export function FreeInput({
  input,
  value,
  onChange,
  onSubmit,
  onSkip,
  submitting,
}: FreeInputProps) {
  const isUrl = input.kind === 'url_or_skip';
  const isNumber = input.kind === 'number';
  const isDate = input.kind === 'date' || input.kind === 'date_or_skip';
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          // Native type=date renders a locale-aware picker but always
          // submits an ISO YYYY-MM-DD value — exactly what the validator
          // expects. No pattern attribute needed.
          type={isUrl ? 'url' : isDate ? 'date' : 'text'}
          inputMode={isNumber ? 'numeric' : 'text'}
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
          className="btn-ink px-6 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-40"
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
