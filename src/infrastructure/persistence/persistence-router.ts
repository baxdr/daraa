/**
 * Persistence implementation router.
 *
 * Single point of configuration for choosing which repository implementation
 * to use. Reads PERSISTENCE_DRIVER env to switch between 'filesystem' (default)
 * and 'supabase' without changing any caller code.
 *
 * Both `getRepositories()` and `getRepositoriesForRequest()` work with
 * Supabase: the active project + chatSession repos use the service-role
 * client (env-driven, no request context required), so synchronous access
 * is fine.
 */

import type { Repositories } from './filesystem';
import { createFilesystemRepositories } from './filesystem';
import { createSupabaseRepositories } from './supabase';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';

let cached: Repositories | null = null;

function resolveDriver(): 'filesystem' | 'supabase' {
  return process.env['PERSISTENCE_DRIVER'] === 'supabase' ? 'supabase' : 'filesystem';
}

/**
 * Get repositories using the default driver. Safe to call from any server
 * context — the Supabase repos use the service-role client internally.
 */
export function getRepositories(): Repositories {
  if (cached) return cached;
  const driver = resolveDriver();
  cached = driver === 'supabase' ? createSupabaseRepositories() : createFilesystemRepositories();
  return cached;
}

/**
 * Get repositories for a specific request (Route Handlers, Middleware).
 * In Supabase mode, also threads a cookie-bound client into the legacy
 * workspaces/auditLogs repos for any caller that still relies on them.
 */
export async function getRepositoriesForRequest(_req?: Request): Promise<Repositories> {
  const driver = resolveDriver();
  if (driver !== 'supabase') return createFilesystemRepositories();
  const client = await createServerSupabaseClient();
  return createSupabaseRepositories(client);
}

/** Reset the cached repositories (useful for testing). */
export function resetRepositories(): void {
  cached = null;
}
