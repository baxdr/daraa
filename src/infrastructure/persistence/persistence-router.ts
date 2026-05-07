/**
 * Persistence implementation router.
 *
 * Single point of configuration for choosing which repository implementation
 * to use. Reads PERSISTENCE_DRIVER env to switch between 'filesystem' (default)
 * and 'supabase' without changing any caller code.
 *
 * For Route Handlers that need request context (cookies), use
 * getRepositoriesForRequest(req) instead.
 */

import type { Repositories } from './filesystem';
import { createFilesystemRepositories } from './filesystem';
import { createSupabaseRepositories } from './supabase';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';

let cached: Repositories | null = null;

/**
 * Get repositories using the default driver.
 * Falls back to filesystem if PERSISTENCE_DRIVER is not set.
 * For Supabase, requires env vars to be set.
 */
export function getRepositories(): Repositories {
  if (!cached) {
    const driver = process.env['PERSISTENCE_DRIVER'] || 'filesystem';

    if (driver === 'supabase') {
      // In server contexts where we can't get request cookies,
      // this will fail. Use getRepositoriesForRequest() in Route Handlers.
      throw new Error(
        'getRepositories() cannot initialize Supabase without request context. Use getRepositoriesForRequest(req) in Route Handlers.',
      );
    } else {
      cached = createFilesystemRepositories();
    }
  }
  return cached;
}

/**
 * Get repositories for a specific request (Route Handlers, Middleware).
 * Handles both filesystem and Supabase drivers.
 * For Supabase, creates a client from the request cookies.
 */
export async function getRepositoriesForRequest(_req?: Request): Promise<Repositories> {
  const driver = process.env['PERSISTENCE_DRIVER'] || 'filesystem';

  if (driver === 'supabase') {
    const client = await createServerSupabaseClient();
    return createSupabaseRepositories(client);
  } else {
    return createFilesystemRepositories();
  }
}

/**
 * Reset the cached repositories (useful for testing).
 */
export function resetRepositories(): void {
  cached = null;
}
