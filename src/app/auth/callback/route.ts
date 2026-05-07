/**
 * Auth callback handler for OAuth and magic-link redirects.
 * Handles the code exchange and sets up the session.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '/account';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error.message}`, request.url));
  }

  // Redirect to requested page or account dashboard
  return NextResponse.redirect(new URL(next, request.url));
}
