/**
 * Project claim page — allows returning users to claim ownership of
 * anonymous projects via email verification.
 *
 * In demo mode (no Supabase env), shows a friendly notice and CTAs
 * back to /chat / / instead of crashing on createServerSupabaseClient.
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { ClaimForm } from '@/app/auth/components/claim-form';

export const metadata = {
  title: 'ادّعِ مشروعك — درع',
  description: 'استرجع مشاريعك السابقة عبر البريد الإلكتروني',
};

const SUPABASE_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

export default async function ClaimPage() {
  if (!SUPABASE_ENABLED) {
    return <DemoModeNotice />;
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect('/account');
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-20">
      <div className="w-full space-y-8" dir="rtl">
        <div className="text-center">
          <span className="eyebrow">استرجاع مشاريع</span>
          <h1 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-ink">
            ادّعِ مشروعك
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-2">
            أدخل بريدك الإلكتروني لاسترجاع مشاريعك السابقة وربطها بحسابك
          </p>
        </div>

        <div className="border border-rule bg-white p-8">
          <ClaimForm />
        </div>

        <div className="text-center text-xs text-muted">
          حساب جديد؟{' '}
          <Link href="/auth/login" className="font-semibold text-accent hover:underline">
            سجل الدخول
          </Link>
        </div>
      </div>
    </main>
  );
}

function DemoModeNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="eyebrow">استرجاع المشاريع</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
        استرجع مشاريعك المحفوظة
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">
        أدخل بريدك الإلكتروني في صفحة المشروع لربطه بحسابك، ثم استرجع مشاريعك من أي جهاز.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/" className="btn-outline">
          العودة للرئيسية
        </Link>
        <Link href="/return" className="btn-ink">
          استعرض مشاريعك
          <span aria-hidden className="ms-2">
            ←
          </span>
        </Link>
      </div>
    </main>
  );
}
