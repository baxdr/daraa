/**
 * Resolve the current request's authenticated Principal from Supabase.
 *
 * Returns null if no Supabase env is configured (demo mode) or if the
 * request has no session. Memberships are an empty array for now —
 * workspace_members lookup happens lazily in policies that need it.
 *
 * Designed to be called from Server Components and Route Handlers via
 * request-scoped invocation; do NOT cache the result across requests.
 */

import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import type { Principal } from '@/core/policies';
import type { UserId } from '@/core/domain/ids';

const SUPABASE_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

export async function getAuthPrincipal(): Promise<Principal | null> {
  if (!SUPABASE_ENABLED) return null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;
    return {
      userId: user.id as UserId,
      memberships: [],
    };
  } catch {
    // If Supabase init fails (transient or env-mismatch), treat as
    // anonymous rather than crash the request.
    return null;
  }
}
