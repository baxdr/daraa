/**
 * Environment variable validation.
 *
 * Reading env vars through this module guarantees:
 *   1. Typed access (no `process.env.FOO!` bang-casts scattered around).
 *   2. Clear startup diagnostics for anything missing.
 *   3. A single place to change when we migrate to a secrets manager.
 *
 * Only one var is strictly required: `ANTHROPIC_API_KEY` — and even that is
 * soft (the system falls back to templates / static data when missing).
 * Supabase vars are reserved for persistence and unused today.
 */

import { z } from 'zod';

const Schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Anthropic — soft-required (null-safe paths fall back without it).
  ANTHROPIC_API_KEY: z
    .string()
    .min(1)
    .regex(/^sk-ant-/, 'ANTHROPIC_API_KEY must start with "sk-ant-"')
    .optional(),
  // Optional second key — used automatically as a failover when the
  // primary hits 429 (rate limit). Fine to leave empty for dev.
  ANTHROPIC_API_KEY_BACKUP: z
    .string()
    .min(1)
    .regex(/^sk-ant-/, 'ANTHROPIC_API_KEY_BACKUP must start with "sk-ant-"')
    .optional(),

  // Supabase — reserved.
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Optional — headless browser worker for Week 2.
  BROWSERLESS_URL: z.string().url().optional(),
});

export type Env = z.infer<typeof Schema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = Schema.safeParse(process.env);
  if (!parsed.success) {
    // Log but don't crash — soft-required means we keep running with the
    // defaulted / missing values. Critical failures surface when a caller
    // tries to USE the missing value.
    console.warn('[env] validation failed:', parsed.error.flatten().fieldErrors);
    cached = Schema.parse({ NODE_ENV: process.env.NODE_ENV ?? 'development' });
  } else {
    cached = parsed.data;
  }
  return cached;
}

export function hasAnthropicKey(): boolean {
  return Boolean(getEnv().ANTHROPIC_API_KEY);
}
