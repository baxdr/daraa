/**
 * Supabase Auth client factory for both server and browser contexts.
 *
 * Uses @supabase/ssr for proper session management with Next.js 14+.
 * Server clients work in Route Handlers and Server Components.
 * Browser clients are safe for use on the frontend.
 */

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

/**
 * Create a Supabase client for server-side Route Handlers and Server Components.
 * Manages session via httpOnly cookies automatically.
 *
 * Usage in Route Handlers:
 *   const supabase = await createServerSupabaseClient();
 *   const { data } = await supabase.auth.getUser();
 */
export async function createServerSupabaseClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = cookies();
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

  return createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookies: { name: string; value: string; options?: CookieOptions }[]) {
        try {
          cookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env['NODE_ENV'] === 'production',
              sameSite: 'lax',
              path: '/',
            });
          });
        } catch {
          // Silently fail in edge functions where cookies can't be set
        }
      },
    },
  });
}

/**
 * Create a Supabase client for browser/client-side use.
 * Respects RLS policies and session-based auth.
 *
 * Usage in Client Components (useEffect / event handlers):
 *   const supabase = createBrowserSupabaseClient();
 *   const { data } = await supabase.auth.getUser();
 */
// Browser client moved to supabase-auth-browser.ts to keep next/headers
// out of client bundles. Re-export for callers that already imported it here.
export { createBrowserSupabaseClient } from './supabase-auth-browser';
