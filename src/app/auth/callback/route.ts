/**
 * Auth callback handler for OAuth and magic-link redirects.
 *
 * On successful sign-in, in addition to setting the session cookie,
 * we claim any anonymous projects whose `email` matches the freshly
 * authenticated user — assigning `ownerUserId` so they become private.
 * If `?next=/project/[id]` is present, we also opportunistically claim
 * that specific project even if its email wasn't set yet.
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
  const next = searchParams.get('next') || '/account';

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
  }

  const supabase = await createServerSupabaseClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL(`/auth/login?error=${error.message}`, request.url));
  }

  // Claim anonymous projects (matching email + project hinted via next).
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const repos = await getRepositoriesForRequest(request);
      const matched = user.email ? await repos.projects.findByEmail(user.email) : [];
      for (const project of matched) {
        if (project.ownerUserId) continue;
        await repos.projects.update(project.id, { ownerUserId: user.id });
      }
      // If next points at a specific anonymous project, claim it too.
      const projectMatch = next.match(/^\/project\/([^/?#]+)/);
      const hintedId = projectMatch ? projectMatch[1] : null;
      if (hintedId && !matched.some((p) => p.id === hintedId)) {
        const hinted = await repos.projects.findById(hintedId);
        if (hinted && !hinted.ownerUserId && !hinted.id.startsWith('demo-')) {
          await repos.projects.update(hinted.id, {
            ownerUserId: user.id,
            ...(user.email ? { email: user.email } : {}),
          });
        }
      }
    }
  } catch (err) {
    console.error('[auth/callback] claim step failed:', err);
    // Don't block sign-in on claim failure.
  }

  return NextResponse.redirect(new URL(next, request.url));
}
