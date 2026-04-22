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

let _client: Anthropic | null = null;

function getClient(): Anthropic {
  if (_client) return _client;
  const key = getEnv().ANTHROPIC_API_KEY;
  if (!key) throw new MissingApiKeyError();
  _client = new Anthropic({ apiKey: key });
  return _client;
}

/** Proxy that defers construction until first use. Back-compat for callers that
 *  imported `anthropic` directly. */
export const anthropic: Anthropic = new Proxy({} as Anthropic, {
  get(_target, prop) {
    const client = getClient();
    const value = Reflect.get(client as unknown as Record<string, unknown>, prop as string);
    return typeof value === 'function' ? (value as (...args: unknown[]) => unknown).bind(client) : value;
  },
});

export const MODELS = {
  sonnet: 'claude-sonnet-4-6',
  opus:   'claude-opus-4-7',
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
  const res = await getClient().messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 4096,
    system: opts.system,
    messages: [{ role: 'user', content: opts.user }],
  });
  const first = res.content.find((b) => b.type === 'text');
  if (!first || first.type !== 'text') throw new Error('Claude returned no text block');
  return first.text;
}

/**
 * Parse JSON from a Claude response that may be wrapped in ```json fences.
 * Throws with a short diagnostic — does NOT include the raw model output in
 * the error message (previous versions leaked up to 500 chars to callers).
 */
export function parseJsonResponse<T>(text: string): T {
  const cleaned = text.trim().replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
  try {
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw new Error(`Failed to parse Claude JSON: ${(err as Error).message}`);
  }
}
