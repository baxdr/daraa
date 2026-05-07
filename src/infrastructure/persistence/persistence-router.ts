/**
 * Persistence implementation router.
 *
 * Single point of configuration for choosing which repository implementation
 * to use. Phase 2 uses filesystem; Phase 3+ will read env to switch to
 * Supabase without changing any caller code.
 */

import type { Repositories } from './filesystem';
import { createFilesystemRepositories } from './filesystem';

let cached: Repositories | null = null;

export function getRepositories(): Repositories {
  if (!cached) {
    // TODO: Phase 3+ — read process.env.PERSISTENCE_DRIVER
    // if (process.env.PERSISTENCE_DRIVER === 'supabase') {
    //   cached = createSupabaseRepositories();
    // } else {
    cached = createFilesystemRepositories();
    // }
  }
  return cached;
}

/**
 * Reset the cached repositories (useful for testing).
 */
export function resetRepositories(): void {
  cached = null;
}
