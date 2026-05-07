/**
 * Logout route — signs out the user and redirects to home.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabaseClient();

  await supabase.auth.signOut();

  return NextResponse.redirect(new URL('/', request.url), {
    status: 302,
  });
}

/**
 * Allow GET for convenience (e.g., <a href="/auth/logout">Logout</a>)
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
