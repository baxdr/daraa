import Anthropic from '@anthropic-ai/sdk';
import { getEnv, hasAnthropicKey } from './env';

/**
 * Claude client — lazy, typed, and safe when the key is missing.
 *
 * Earlier versions of this file constructed `new Anthropic({ apiKey: 'missing' })`
 * up-front, which meant any accidental direct call to `.messages.create`
 * would hit Anthropic with a bogus key and surface a 401 in our logs.
 * Instead we lazy-construct on first real use and throw a typed error when
 * no key is configured — callers are expected to guard with `hasApiKey()`.
 */

let _primary: Anthropic | null = null;
let _backup: Anthropic | null = null;

function getClient(): Anthropic {
  if (_primary) return _primary;
  const key = getEnv().ANTHROPIC_API_KEY;
  if (!key) throw new MissingApiKeyError();
  _primary = new Anthropic({ apiKey: key });
  return _primary;
}

function getBackupClient(): Anthropic | null {
  if (_backup) return _backup;
  const key = getEnv().ANTHROPIC_API_KEY_BACKUP;
  if (!key) return null;
  _backup = new Anthropic({ apiKey: key });
  return _backup;
}

/**
 * A 429 or "rate_limit_error" from the primary key means we've exhausted
 * our per-minute budget. If a backup key is configured, failover to it
 * for this single request. The caller sees a normal successful response.
 */
function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const e = err as { status?: number; message?: string };
  if (e.status === 429) return true;
  return typeof e.message === 'string' && /rate_limit/i.test(e.message);
}

/** Proxy that defers construction until first use. Back-compat for callers that
 *  imported `anthropic` directly. */
export const anthropic: Anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client as unknown as Record<string, unknown>, prop as string);
    return typeof value === 'function'
      ? (value as (...args: unknown[]) => unknown).bind(client)
      : value;
  },
});

export const MODELS = {
  sonnet: 'claude-sonnet-4-6',
  opus: 'claude-opus-4-7',
} as const;

export type AgentName = 'scan' | 'regulatory' | 'analysis' | 'document' | 'orchestrator';

export class MissingApiKeyError extends Error {
  constructor() {
    super('ANTHROPIC_API_KEY is not configured');
    this.name = 'MissingApiKeyError';
  }
}

export function hasApiKey(): boolean {
  return hasAnthropicKey();
}

export async function callClaude(opts: {
  model: (typeof MODELS)[keyof typeof MODELS];
  system: string;
  user: string;
  maxTokens?: number;
}): Promise<string> {
  if (!hasApiKey()) throw new MissingApiKeyError();
  const payload = {
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: 'user' as const, content: opts.user }],
  };
  try {
    const res = await getClient().messages.create(payload);
    const first = res.content.find((b) => b.type === 'text');
    if (!first || first.type !== 'text') throw new Error('Claude returned no text block');
    return first.text;
  } catch (err) {
    if (isRateLimitError(err)) {
      const backup = getBackupClient();
      if (backup) {
        console.warn('[claude] primary key 429 — failing over to backup');
        const res = await backup.messages.create(payload);
        const first = res.content.find((b) => b.type === 'text');
        if (!first || first.type !== 'text') throw new Error('Claude returned no text block');
        return first.text;
      }
    }
    throw err;
  }
}

/**
 * Parse JSON from a Claude response that may be wrapped in ```json fences.
 * Throws with a short diagnostic — does NOT include the raw model output in
 * the error message (previous versions leaked up to 500 chars to callers).
 */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON: ${(err as Error).message}`);
  }
}
