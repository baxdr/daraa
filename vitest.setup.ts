import { afterAll, afterEach, beforeAll, vi } from 'vitest';

beforeAll(() => {
  process.env['ANTHROPIC_API_KEY'] = process.env['ANTHROPIC_API_KEY'] ?? 'test-anthropic-key';
  process.env['NEXT_PUBLIC_SUPABASE_URL'] =
    process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'http://localhost:54321';
  process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] =
    process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'] ?? 'test-anon-key';
  process.env['SUPABASE_SERVICE_ROLE_KEY'] =
    process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? 'test-service-key';
});

afterEach(() => {
  vi.restoreAllMocks();
});

afterAll(() => {
  vi.resetAllMocks();
});

const ORIGINAL_FETCH = globalThis.fetch;
globalThis.fetch = vi.fn(async (...args: Parameters<typeof fetch>) => {
  const url = String(args[0]);
  if (url.includes('api.anthropic.com')) {
    throw new Error(`Live Anthropic call blocked in tests. Mock anthropic-client for: ${url}`);
  }
  if (url.includes('supabase.co') || url.includes('localhost:54321')) {
    throw new Error(`Live Supabase call blocked in tests. Mock the repository for: ${url}`);
  }
  return ORIGINAL_FETCH(...args);
}) as typeof fetch;
