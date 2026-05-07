/**
 * Browser-side Supabase Auth client. Safe to import in Client Components.
 * Has no `next/headers` import so it doesn't pollute client bundles.
 */

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL');
const SUPABASE_ANON_KEY = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY');

export function createBrowserSupabaseClient(): SupabaseClient<Database> {
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);
}
