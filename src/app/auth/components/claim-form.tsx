/**
 * Claim form component — sends magic-link to allow email claim.
 * Client component for form state.
 */

'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/infrastructure/auth/supabase-auth-browser';

type ClaimState = 'idle' | 'loading' | 'sent' | 'error';

export function ClaimForm() {
  const [state, setState] = useState<ClaimState>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    setError(null);

    try {
      // Send magic-link for claim flow
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/claim-callback`,
        },
      });

      if (err) {
        setError(err.message);
        setState('error');
      } else {
        setState('sent');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setState('error');
    }
  };

  if (state === 'sent') {
    return (
      <div className="space-y-4 text-center" dir="rtl">
        <div className="rounded-lg bg-green-50 p-4">
          <p className="text-sm font-medium text-green-800">تم إرسال رابط التحقق</p>
          <p className="mt-1 text-xs text-green-700">تحقق من بريدك الإلكتروني ({email})</p>
          <p className="mt-2 text-xs text-green-700">
            بعد التحقق، سيتم ربط جميع مشاريعك بحسابك الجديد
          </p>
        </div>
        <button
          onClick={() => {
            setState('idle');
            setEmail('');
          }}
          className="text-sm text-blue-600 hover:underline"
        >
          جرب بريد آخر
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleClaim(e)} className="space-y-4" dir="rtl">
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          بريدك الإلكتروني
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={state === 'loading'}
          placeholder="البريد الذي استخدمته سابقاً"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={state === 'loading' || !email}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {state === 'loading' ? 'جاري الإرسال...' : 'إرسال رابط الادّعاء'}
      </button>

      <div className="text-xs text-gray-500" dir="rtl">
        <p>سنبحث عن جميع المشاريع المرتبطة بهذا البريد الإلكتروني وننقلها إلى حسابك الجديد.</p>
      </div>
    </form>
  );
}
