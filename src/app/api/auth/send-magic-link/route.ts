/**
 * POST /api/auth/send-magic-link
 *
 * Triggers a Supabase magic-link email. The link's `redirectTo` includes
 * a `next=` so /auth/callback can land the user back at the project they
 * were saving (and claim it as part of the callback flow).
 *
 * In demo mode (no Supabase env), returns 503 with a friendly Arabic
 * message — the save banner uses this to fall back to email-only save.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { enforceRateLimit } from '@/infrastructure/rate-limit/rate-limit';

export const runtime = 'nodejs';

const SUPABASE_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

const BodySchema = z.object({
  email: z.string().email({ message: 'أدخل بريداً إلكترونياً صحيحاً' }).max(200),
  next: z.string().max(300).optional(),
});

export async function POST(req: NextRequest) {
  if (!SUPABASE_ENABLED) {
    return NextResponse.json({ error: 'تسجيل الدخول غير متاح في وضع الديمو' }, { status: 503 });
  }

  const limited = enforceRateLimit(req, { bucket: 'magic-link', max: 5, windowMs: 60_000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'طلب غير صالح';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Sanitise next: must be a same-origin path. Reject absolute URLs.
  let nextPath = '/account';
  if (parsed.data.next && parsed.data.next.startsWith('/') && !parsed.data.next.startsWith('//')) {
    nextPath = parsed.data.next;
  }

  const origin = req.nextUrl.origin;
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: parsed.data.email.trim().toLowerCase(),
      options: {
        emailRedirectTo: redirectTo,
        shouldCreateUser: true,
      },
    });
    if (error) {
      console.error('[send-magic-link] supabase error:', error.message);
      return NextResponse.json({ error: 'تعذّر إرسال البريد، حاول لاحقاً' }, { status: 500 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[send-magic-link] unexpected:', err);
    return NextResponse.json({ error: 'خطأ غير متوقع' }, { status: 500 });
  }
}
