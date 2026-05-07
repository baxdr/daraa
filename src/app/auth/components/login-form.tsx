/**
 * Login form component — handles magic-link and Google OAuth.
 * Client component for form state management.
 */

'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/infrastructure/auth/supabase-auth-browser';

type AuthMode = 'email' | 'google';
type AuthState = 'idle' | 'loading' | 'sent' | 'error';

export function LoginForm() {
  // TODO(phase-3.1): expose mode toggle when adding password fallback.
  const [_mode, _setMode] = useState<AuthMode>('email');
  const [state, setState] = useState<AuthState>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);

  const supabase = createBrowserSupabaseClient();

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('loading');
    setError(null);

    try {
      const { error: err } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
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

  const handleGoogle = async () => {
    setState('loading');
    setError(null);

    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (err) {
        setError(err.message);
        setState('error');
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
    <form onSubmit={(e) => void handleMagicLink(e)} className="space-y-4" dir="rtl">
      {/* Email Input */}
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
          placeholder="you@example.com"
          className="mt-1 block w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-50"
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Magic Link Button */}
      <button
        type="submit"
        disabled={state === 'loading' || !email}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700 disabled:bg-gray-300"
      >
        {state === 'loading' ? 'جاري الإرسال...' : 'إرسال رابط التحقق'}
      </button>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-2 text-gray-500">أو</span>
        </div>
      </div>

      {/* Google Button */}
      <button
        type="button"
        onClick={() => void handleGoogle()}
        disabled={state === 'loading'}
        className="w-full rounded-lg border border-gray-300 px-4 py-2 font-medium text-gray-700 transition hover:bg-gray-50 disabled:bg-gray-50"
      >
        {state === 'loading' ? 'جاري الدخول...' : 'الدخول عبر Google'}
      </button>
    </form>
  );
}
