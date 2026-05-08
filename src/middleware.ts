/**
 * Next.js 14+ middleware for Supabase Auth session management.
 *
 * Responsibilities:
 * - Refresh Supabase session on each request
 * - Attach x-user-id header for downstream server-only code
 * - Enforce auth gates for protected routes
 * - Allow anonymous users for public routes
 */

import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '@/types/supabase';

// Supabase env vars are optional. When missing, we run in
// anonymous-only mode: every request is treated as a public visitor and
// no auth gate is enforced. Useful for FS-backed demos and the
// hackathon deploy path.
function readSupabaseConfig(): { url: string; key: string } | null {
  const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
  const key = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];
  if (!url || !key) return null;
  return { url, key };
}

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  '/',
  '/chat',
  '/api/health',
  '/api/projects/by-email',
  '/robots.txt',
  '/sitemap.xml',
  '/icon.svg',
  '/opengraph-image',
]);

// Auth routes (unauthenticated)
const AUTH_ROUTES = new Set(['/auth/login', '/auth/callback', '/auth/logout', '/auth/claim']);

// Routes that require authentication (redirect to login if not authenticated)
const PROTECTED_ROUTES_REGEX =
  /^\/account($|\/)|^\/workspaces($|\/)|^\/project\/|^\/api\/project\//;

// Routes that allow both authenticated and anonymous users
const HYBRID_ROUTES_REGEX = /^\/project\/|^\/api\/project\//;

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  // Anonymous-only mode: no auth, every route public. Critical for
  // hackathon demos where Supabase isn't wired.
  const supabaseConfig = readSupabaseConfig();
  if (!supabaseConfig) {
    return res;
  }

  const supabase = createServerClient<Database>(supabaseConfig.url, supabaseConfig.key, {
    cookies: {
      getAll() {
        return req.cookies.getAll();
      },
      setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
        cookies.forEach(({ name, value, options }) => {
          res = NextResponse.next();
          res.cookies.set(name, value, {
            ...options,
            httpOnly: true,
            secure: process.env['NODE_ENV'] === 'production',
            sameSite: 'lax',
            path: '/',
          });
        });
      },
    },
  });

  // Refresh the session (important for token rotation)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = req.nextUrl.pathname;

  // Skip auth checks for public routes
  if (PUBLIC_ROUTES.has(pathname) || AUTH_ROUTES.has(pathname)) {
    // Skip /_next and other Next.js internals
    if (pathname.startsWith('/_next')) {
      return res;
    }
    return res;
  }

  // For hybrid routes (projects can be anonymous or authenticated), allow both
  if (HYBRID_ROUTES_REGEX.test(pathname)) {
    // Check if project is anonymous-accessible (owner_user_id IS NULL)
    // This is enforced server-side; the frontend can check RLS via the client
    if (user) {
      // Attach user ID for server-only code
      res.headers.set('x-user-id', user.id);
    }
    return res;
  }

  // Protected routes require authentication
  if (PROTECTED_ROUTES_REGEX.test(pathname)) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = '/auth/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    // Attach user ID for server-only code (private header)
    res.headers.set('x-user-id', user.id);
    return res;
  }

  // Default: allow if authenticated, redirect if not
  if (!user && !pathname.startsWith('/api')) {
    const url = req.nextUrl.clone();
    url.pathname = '/auth/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    res.headers.set('x-user-id', user.id);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)'],
};
