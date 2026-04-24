'use client';

import { useState } from 'react';

/**
 * Optional banner on the unified dashboard — shown when the project has
 * no email attached yet. Captures an email after-the-fact so the user can
 * return later via /return.
 */
export function SaveProjectBanner({
  projectId,
  initialEmail,
}: {
  projectId: string;
  initialEmail?: string;
}) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [savedEmail, setSavedEmail] = useState<string | null>(initialEmail ?? null);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/project/${projectId}/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        setError(body.error ?? `تعذّر الحفظ (${res.status})`);
        return;
      }
      const body = (await res.json()) as { ok: boolean; email: string };
      setSavedEmail(body.email);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ غير متوقع');
    } finally {
      setSubmitting(false);
    }
  }

  if (savedEmail) {
    return (
      <section className="mb-10 border-s-2 border-accent bg-accent-soft/60 px-6 py-5">
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="text-base">✓</span>
          <div className="flex-1">
            <div className="font-display text-sm font-extrabold tracking-tight text-accent-strong">
              المشروع محفوظ على
            </div>
            <div className="mt-0.5 font-mono text-xs text-ink-2" dir="ltr">{savedEmail}</div>
          </div>
          <a
            href="/return"
            className="text-xs font-semibold text-accent underline decoration-rule decoration-2 underline-offset-4 hover:decoration-accent"
          >
            مشاريعي ←
          </a>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10 border border-rule bg-paper-2/60 px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="eyebrow !text-[10px]">للعودة لاحقاً</div>
          <h3 className="mt-1 font-display text-lg font-extrabold tracking-tight">
            احفظ مشروعك بإيميلك
          </h3>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-2">
            بدون تسجيل — فقط إيميل. تقدر ترجع من{' '}
            <a href="/return" className="font-semibold text-accent hover:text-accent-strong">
              /return
            </a>{' '}
            وتلاقي مشروعك كما هو.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          type="email"
          required
          dir="ltr"
          placeholder="you@company.sa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className="flex-1 border border-ink bg-paper px-4 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="btn-ink text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '…' : 'احفظ'}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
