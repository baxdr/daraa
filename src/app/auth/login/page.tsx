/**
 * Authentication login page.
 * Supports magic-link (primary) and Google OAuth (secondary).
 * RTL Arabic-first design.
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { LoginForm } from '@/app/auth/components/login-form';

export const metadata = {
  title: 'دخول درع',
  description: 'سجل الدخول إلى منصة درع للامتثال',
};

export default async function LoginPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Already logged in — redirect to account
  if (user) {
    redirect('/account');
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center" dir="rtl">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">درع</h1>
          <p className="mt-2 text-sm text-gray-600">منصة الامتثال التنظيمي للشركات السعودية</p>
        </div>

        {/* Form Card */}
        <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
          <LoginForm />
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500" dir="rtl">
          <p>
            هل أنت صاحب مشروع موجود؟{' '}
            <a href="/auth/claim" className="font-semibold text-blue-600 hover:underline">
              ادّعِ مشروعك
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
