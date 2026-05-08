/**
 * Logout route — signs out the user and redirects to home.
 *
 * Demo-mode (no Supabase env): nothing to sign out, just redirect home.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';

export const runtime = 'nodejs';

const SUPABASE_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

export async function POST(request: NextRequest) {
  if (!SUPABASE_ENABLED) {
    return NextResponse.redirect(new URL('/', request.url), { status: 302 });
  }

  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[auth/logout] sign-out failed:', err);
  }

  return NextResponse.redirect(new URL('/', request.url), { status: 302 });
}

/**
 * Allow GET for convenience (e.g., <a href="/auth/logout">Logout</a>)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
