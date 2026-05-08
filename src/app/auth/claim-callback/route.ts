/**
 * Claim callback — completes the email verification and claims projects.
 *
 * Flow:
 * 1. User clicks magic-link in email
 * 2. Supabase redirects here with code
 * 3. We exchange code for session
 * 4. We find all projects with the user's email
 * 5. We update those projects to set ownerUserId (real ownership transfer)
 * 6. Redirect to account dashboard
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { getRepositoriesForRequest } from '@/infrastructure/persistence/persistence-router';

export const runtime = 'nodejs';

const SUPABASE_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

export async function GET(request: NextRequest) {
  if (!SUPABASE_ENABLED) {
    return NextResponse.redirect(new URL('/?error=auth_unavailable', request.url));
  }

  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
  }

  const supabase = await createServerSupabaseClient();

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${exchangeError.message}`, request.url),
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();
  if (userError || !user) {
    return NextResponse.redirect(new URL('/auth/login?error=no_user', request.url));
  }

  // Real ownership transfer: every anonymous project matching this email
  // gets ownerUserId set, becoming private from this moment on.
  try {
    const repos = await getRepositoriesForRequest(request);
    const projects = user.email ? await repos.projects.findByEmail(user.email) : [];
    let claimed = 0;
    for (const project of projects) {
      if (project.ownerUserId) continue;
      if (project.id.startsWith('demo-')) continue;
      await repos.projects.update(project.id, {
        ownerUserId: user.id,
        ...(user.email ? { email: user.email } : {}),
      });
      claimed += 1;
    }
    if (claimed > 0) {
      console.info('[claim-callback] claimed', claimed, 'projects for', user.id);
    }
  } catch (err) {
    console.error('[claim-callback] claim step failed:', err);
  }

  return NextResponse.redirect(new URL('/account?claimed=1', request.url));
}
