/**
 * Delete account button with confirmation.
 * Client component for managing deletion flow.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/infrastructure/auth/supabase-auth-browser';

type DeleteState = 'idle' | 'confirming' | 'loading' | 'error';

export function DeleteAccountButton() {
  const router = useRouter();
  const [state, setState] = useState<DeleteState>('idle');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');

  const supabase = createBrowserSupabaseClient();

  // Get user email when component mounts
  useState(() => {
    void supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  });

  const handleDelete = async () => {
    if (email !== userEmail) {
      setError('البريد الإلكتروني غير متطابق');
      return;
    }

    setState('loading');
    setError(null);

    try {
      // Call the delete endpoint
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'فشل حذف الحساب');
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ غير متوقع');
      setState('error');
    }
  };

  if (state === 'confirming') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="mb-4 text-sm font-medium text-red-900">أدخل بريدك الإلكتروني للتأكيد</p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={userEmail}
          disabled={state !== 'confirming'}
          className="mb-4 block w-full rounded border border-red-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-red-500 disabled:bg-gray-50"
        />
        {error && <p className="mb-4 text-xs text-red-700">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => void handleDelete()}
            disabled={email !== userEmail}
            className="flex-1 rounded bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-gray-300"
          >
            تأكيد الحذف
          </button>
          <button
            onClick={() => {
              setState('idle');
              setEmail('');
              setError(null);
            }}
            className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            إلغاء
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setState('confirming')}
      className="rounded border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      حذف حسابي
    </button>
  );
}
