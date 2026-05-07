/**
 * Project claim page — allows returning users to claim ownership of
 * anonymous projects via email verification.
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { ClaimForm } from '@/app/auth/components/claim-form';

export const metadata = {
  title: 'ادّعِ مشروعك — درع',
  description: 'استرجع مشاريعك السابقة عبر البريد الإلكتروني',
};

export default async function ClaimPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already logged in — redirect to projects list
  if (user) {
    redirect('/account');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">ادّعِ مشروعك</h1>
          <p className="mt-2 text-sm text-gray-600">
            أدخل بريدك الإلكتروني لاسترجاع مشاريعك السابقة
          </p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <ClaimForm />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500" dir="rtl">
          <p>
            حساب جديد؟{' '}
            <a href="/auth/login" className="font-semibold text-blue-600 hover:underline">
              سجل الدخول
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
