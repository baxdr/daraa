import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** Browser/client-safe client — honours RLS. */
export function getBrowserClient(): SupabaseClient {
  if (!url || !anonKey) throw new Error('Supabase public env vars missing');
  return createClient(url, anonKey);
}

/** Server-only admin client — bypasses RLS. NEVER expose to the browser. */
export function getAdminClient(): SupabaseClient {
  if (!url || !serviceKey) throw new Error('Supabase admin env vars missing');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
