'use client';

import { useState } from 'react';
import Link from 'next/link';

type Mode = 'idle' | 'saving' | 'saved' | 'magic_sent' | 'claimed';

interface SaveProjectBannerProps {
  projectId: string;
  initialEmail?: string;
  /** True if the current visitor is signed in. Set by server component. */
  isSignedIn?: boolean;
  /** True if the project is already owned by the signed-in viewer. */
  isOwnedByMe?: boolean;
  /** True if Supabase is configured server-side. Drives whether magic-link
   *  is offered at all. */
  authEnabled?: boolean;
}

/**
 * Save banner with two flows:
 *
 *  Authenticated: single click → POST /api/project/[id]/claim → ownerUserId
 *  Anonymous:     enter email → save email + send magic-link → callback
 *                 claims the project on sign-in
 *
 * In demo mode (authEnabled=false) only the email-save path is shown,
 * so the existing /return-by-email recovery still works for local demos.
 */
export function SaveProjectBanner({
  projectId,
  initialEmail,
  isSignedIn = false,
  isOwnedByMe = false,
  authEnabled = false,
}: SaveProjectBannerProps) {
  const [email, setEmail] = useState(initialEmail ?? '');
  const [mode, setMode] = useState<Mode>(initialEmail ? 'saved' : 'idle');
  const [error, setError] = useState<string | null>(null);

  // Already owned by viewer — silent.
  if (isOwnedByMe || mode === 'claimed') {
    return null;
  }
  // Confirmation panels.
  if (mode === 'magic_sent') {
    return (
      <section className="mb-10 border-s-2 border-accent bg-accent-soft px-6 py-5">
        <div className="eyebrow !text-[10px]">تحقّق من بريدك</div>
        <h3 className="mt-1 font-display text-lg font-extrabold tracking-tight text-accent-strong">
          أرسلنا رابط الدخول لـ {email}
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-ink-2">
          افتح إيميلك واضغط على الرابط — راح يرجعك لهذي الصفحة وحسابك مفعّل ومشروعك محفوظ خاص فيك.
        </p>
      </section>
    );
  }
  if (mode === 'saved' && !authEnabled) {
    return null;
  }

  async function handleClaim() {
    setMode('saving');
    setError(null);
    try {
      const res = await fetch(`/api/project/${projectId}/claim`, { method: 'POST' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `تعذّر الحفظ (${res.status})`);
        setMode('idle');
        return;
      }
      setMode('claimed');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      setMode('idle');
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || mode === 'saving') return;
    setMode('saving');
    setError(null);
    try {
      const emailRes = await fetch(`/api/project/${projectId}/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!emailRes.ok) {
        const body = (await emailRes.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? `تعذّر الحفظ (${emailRes.status})`);
        setMode('idle');
        return;
      }

      // Try to upgrade to a real account via magic-link (only when Supabase
      // is wired). If it fails or isn't available, the email is already
      // saved on the project so /return still works.
      if (authEnabled) {
        const linkRes = await fetch('/api/auth/send-magic-link', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), next: `/project/${projectId}` }),
        });
        if (linkRes.ok) {
          setMode('magic_sent');
          return;
        }
      }
      setMode('saved');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'خطأ غير متوقع');
      setMode('idle');
    }
  }

  // ── Signed-in viewer with no claim yet — single-click claim ─────────
  if (isSignedIn && authEnabled) {
    return (
      <section className="mb-10 border-s-2 border-accent bg-accent-soft/60 px-6 py-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <div className="eyebrow !text-[10px]">حفظ في حسابك</div>
            <h3 className="mt-1 font-display text-lg font-extrabold tracking-tight">
              احفظ هذا المشروع في حسابك
            </h3>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-2">
              سيُربط المشروع بحسابك ويصبح خاصاً — لن يتمكن غيرك من فتحه عبر الرابط.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void handleClaim()}
            disabled={mode === 'saving'}
            className="btn-ink text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            {mode === 'saving' ? '…' : 'احفظ في حسابي'}
          </button>
        </div>
        {error && (
          <p role="alert" className="mt-3 text-xs text-danger">
            {error}
          </p>
        )}
      </section>
    );
  }

  // ── Anonymous visitor — email save (+ magic-link if auth enabled) ───
  return (
    <section className="mb-10 border border-rule bg-paper-2/60 px-6 py-5">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="eyebrow !text-[10px]">للحفظ والوصول لاحقاً</div>
          <h3 className="mt-1 font-display text-lg font-extrabold tracking-tight">
            {authEnabled ? 'احفظ مشروعك في حساب خاص' : 'احفظ مشروعك بإيميلك'}
          </h3>
          <p className="mt-1 max-w-md text-xs leading-relaxed text-ink-2">
            {authEnabled
              ? 'بنرسل لك رابط دخول على إيميلك — تضغط عليه ويصير المشروع خاص في حسابك.'
              : 'بدون تسجيل — فقط إيميل. تقدر ترجع من '}
            {!authEnabled && (
              <Link href="/return" className="font-semibold text-accent hover:text-accent-strong">
                /return
              </Link>
            )}
            {!authEnabled && ' وتلاقي مشروعك كما هو.'}
          </p>
        </div>
      </div>
      <form
        onSubmit={(e) => void handleEmailSubmit(e)}
        className="mt-4 flex flex-col gap-2 sm:flex-row"
      >
        <input
          type="email"
          required
          dir="ltr"
          placeholder="you@company.sa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={mode === 'saving'}
          className="flex-1 border border-ink bg-paper px-4 py-2.5 font-mono text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={mode === 'saving' || !email.trim()}
          className="btn-ink text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {mode === 'saving' ? '…' : authEnabled ? 'أرسل رابط الحفظ' : 'احفظ'}
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
