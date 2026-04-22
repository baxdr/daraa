/**
 * In-memory IP-bucketed rate limiter.
 *
 * Minimum viable for the hackathon — keeps a sliding-window counter per
 * (bucket, ip) on `globalThis` so it survives Next.js dev HMR. NOT suitable
 * for horizontally-scaled production: each function instance has its own
 * counter. Replace with Upstash `@upstash/ratelimit` before GA.
 */

import { NextResponse } from 'next/server';

export interface RateLimitResult {
  ok: true;
  remaining: number;
}
export interface RateLimitBlocked {
  ok: false;
  retryAfterSec: number;
  remaining: 0;
}

interface Bucket {
  // Timestamps of recent hits, ms-since-epoch.
  hits: number[];
}

const globalForRL = globalThis as unknown as { __daraaRL?: Map<string, Bucket> };
const BUCKETS: Map<string, Bucket> =
  globalForRL.__daraaRL ?? (globalForRL.__daraaRL = new Map());

/**
 * Sliding-window limiter. Returns `ok: false` with retry-after if the
 * bucket+ip has made >= `max` requests within `windowMs`.
 */
export function check(opts: {
  bucket: string;
  ip: string;
  max: number;
  windowMs: number;
}): RateLimitResult | RateLimitBlocked {
  const now = Date.now();
  const cutoff = now - opts.windowMs;
  const key = `${opts.bucket}:${opts.ip}`;
  let b = BUCKETS.get(key);
  if (!b) {
    b = { hits: [] };
    BUCKETS.set(key, b);
  }
  // Drop expired hits.
  b.hits = b.hits.filter((t) => t > cutoff);
  if (b.hits.length >= opts.max) {
    const earliest = b.hits[0];
    const retryAfterSec = Math.max(1, Math.ceil((earliest + opts.windowMs - now) / 1000));
    return { ok: false, retryAfterSec, remaining: 0 };
  }
  b.hits.push(now);
  return { ok: true, remaining: opts.max - b.hits.length };
}

/** Best-effort extraction of the requester's IP. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  const real = req.headers.get('x-real-ip');
  if (real) return real.trim();
  return 'unknown';
}

/**
 * Convenience wrapper — returns a 429 NextResponse if blocked, or null if
 * the request is allowed through.
 */
export function enforceRateLimit(
  req: Request,
  opts: { bucket: string; max: number; windowMs: number },
): NextResponse | null {
  const ip = clientIp(req);
  const verdict = check({ ...opts, ip });
  if (verdict.ok) return null;
  return NextResponse.json(
    { error: `عدد الطلبات كبير. حاول بعد ${verdict.retryAfterSec} ثانية.` },
    {
      status: 429,
      headers: {
        'retry-after': String(verdict.retryAfterSec),
        'x-ratelimit-bucket': opts.bucket,
      },
    },
  );
}

/** Cleanup — run periodically to drop old buckets (avoids unbounded growth). */
setInterval(() => {
  const now = Date.now();
  for (const [key, b] of BUCKETS) {
    // Drop any bucket whose last hit was > 15 minutes ago.
    const last = b.hits[b.hits.length - 1] ?? 0;
    if (now - last > 15 * 60_000) BUCKETS.delete(key);
  }
}, 5 * 60_000).unref?.();
