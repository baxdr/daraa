/**
 * Authentication login page.
 * Supports magic-link (primary) and Google OAuth (secondary).
 * RTL Arabic-first design.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { LoginForm } from '@/app/auth/components/login-form';

export const metadata = {
  title: 'دخول درع',
  description: 'سجل الدخول إلى منصة درع للامتثال',
};

// Reads cookies via Supabase SSR; opt out of static rendering so the build
// doesn't try to invoke the Supabase client outside a request scope.
export const dynamic = 'force-dynamic';

const SUPABASE_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

export default async function LoginPage() {
  if (!SUPABASE_ENABLED) {
    return <DemoModeNotice />;
  }

  // A stale or malformed auth cookie can make supabase.auth.getUser() throw.
  // Treat any failure here as "no session" and render the login form rather
  // than blowing up the page with the global error boundary.
  let user: unknown = null;
  try {
    const supabase = await createServerSupabaseClient();
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (err) {
    console.error('[auth/login] getUser failed:', err instanceof Error ? err.message : err);
  }

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

function DemoModeNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="eyebrow">ابدأ معنا</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">أهلاً بك في درع</h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">
        ابدأ استشارتك مباشرة — مشروعك يُحفظ تلقائياً في متصفحك حتى تربطه بحسابك لاحقاً.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-outline">
          العودة للرئيسية
        </Link>
        <Link href="/chat" className="btn-ink">
          ابدأ الاستشارة
          <span aria-hidden className="ms-2">
            ←
          </span>
        </Link>
      </div>
    </main>
  );
}
