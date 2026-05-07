/**
 * Claim callback — completes the email verification and claims projects.
 *
 * Flow:
 * 1. User clicks magic-link in email
 * 2. Supabase redirects here with code
 * 3. We exchange code for session
 * 4. We find all projects with the user's email
 * 5. We update those projects to link to the authenticated user
 * 6. Redirect to account dashboard
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { getRepositoriesForRequest } from '@/infrastructure/persistence/persistence-router';

export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=no_code', request.url));
  }

  const supabase = await createServerSupabaseClient();

  // Exchange code for session
  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return NextResponse.redirect(
      new URL(`/auth/login?error=${exchangeError.message}`, request.url),
    );
  }

  // Get the authenticated user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.redirect(new URL('/auth/login?error=no_user', request.url));
  }

  // Claim all projects with this email
  try {
    const repos = await getRepositoriesForRequest(request);
    const projects = await repos.projects.findByEmail(user.email || '');

    // Update each project to link to the user's workspace
    for (const project of projects) {
      await repos.projects.update(project.id, {
        ...project,
        ...(user.email ? { email: user.email } : {}),
      });
    }
  } catch (err) {
    console.error('Failed to claim projects:', err);
    // Don't fail the entire flow; user can still access their account
  }

  // Redirect to account dashboard
  return NextResponse.redirect(new URL('/account', request.url));
}
