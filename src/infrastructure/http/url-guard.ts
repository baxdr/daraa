/**
 * SSRF protection for scanner fetches.
 *
 * The scanners visit URLs supplied by untrusted users (the company URL in
 * the chat). Without guarding, a submitter could aim the scanner at cloud
 * metadata endpoints (AWS IMDS at 169.254.169.254), private networks, or
 * file:// URIs — and the response text gets piped into a Claude prompt,
 * leaking whatever the metadata service returns.
 *
 * Rules:
 *   1. Protocol must be http or https.
 *   2. Port must be 80 or 443.
 *   3. Host must resolve to a globally-routable public IPv4 or IPv6 address.
 *      Private / loopback / link-local / reserved ranges are blocked.
 *   4. Redirects are followed MANUALLY, with the same guard applied on each hop.
 *   5. Response body is size-capped (default 2 MB) to bound memory per scan.
 *
 * Callers use `safeFetch(url, { maxBytes?, maxHops? })` as a drop-in for
 * `fetch` — it returns the final Response (body already drained into a
 * capped Buffer) or throws a typed error.
 */

import { promises as dns } from 'node:dns';
import { isIP } from 'node:net';

export class UrlGuardError extends Error {
  constructor(
    message: string,
    public readonly reason:
      | 'invalid_url'
      | 'bad_protocol'
      | 'bad_port'
      | 'resolution_failed'
      | 'private_ip'
      | 'too_many_redirects'
      | 'response_too_large'
      | 'fetch_failed',
  ) {
    super(message);
    this.name = 'UrlGuardError';
  }
}

const USER_AGENT = 'Mozilla/5.0 (compatible; DaraaComplianceScanner/1.0; +https://daraa.sa/bot)';
const DEFAULT_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const DEFAULT_MAX_HOPS = 3;
const DEFAULT_TIMEOUT_MS = 12_000;

/** Validate just the URL shape (protocol + port), without DNS. Cheap pre-check. */
export function validateUrlShape(url: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new UrlGuardError('رابط غير صالح', 'invalid_url');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UrlGuardError(`بروتوكول غير مسموح: ${parsed.protocol}`, 'bad_protocol');
  }
  const port = parsed.port === '' ? (parsed.protocol === 'https:' ? '443' : '80') : parsed.port;
  if (port !== '80' && port !== '443') {
    throw new UrlGuardError(`منفذ غير مسموح: ${port}`, 'bad_port');
  }
  return parsed;
}

/** DNS-resolve the host and reject if any returned IP is private / reserved. */
export async function assertPublicHost(hostname: string): Promise<void> {
  // If the hostname is already a literal IP, check it directly.
  if (isIP(hostname)) {
    if (!isPublicIp(hostname)) {
      throw new UrlGuardError('عنوان خاص غير مسموح', 'private_ip');
    }
    return;
  }

  // Common aliases for loopback / local — reject without hitting DNS.
  const lower = hostname.toLowerCase();
  if (lower === 'localhost' || lower.endsWith('.localhost')) {
    throw new UrlGuardError('عنوان محلي غير مسموح', 'private_ip');
  }
  if (lower.endsWith('.local') || lower.endsWith('.internal') || lower.endsWith('.intranet')) {
    throw new UrlGuardError('عنوان داخلي غير مسموح', 'private_ip');
  }

  // Resolve A + AAAA; a host can resolve to both, and we fail if ANY address is private.
  let addrs: string[];
  try {
    const [a, aaaa] = await Promise.allSettled([dns.resolve4(hostname), dns.resolve6(hostname)]);
    addrs = [
      ...(a.status === 'fulfilled' ? a.value : []),
      ...(aaaa.status === 'fulfilled' ? aaaa.value : []),
    ];
  } catch (err) {
    throw new UrlGuardError(
      `تعذّر التحقق من الخادم: ${err instanceof Error ? err.message : String(err)}`,
      'resolution_failed',
    );
  }
  if (addrs.length === 0) {
    throw new UrlGuardError('لم نجد عناوين للخادم', 'resolution_failed');
  }
  for (const addr of addrs) {
    if (!isPublicIp(addr)) {
      throw new UrlGuardError('الخادم يحل إلى عنوان خاص — محظور', 'private_ip');
    }
  }
}

export function isPublicIp(addr: string): boolean {
  const v = isIP(addr);
  if (v === 4) return isPublicIpv4(addr);
  if (v === 6) return isPublicIpv6(addr);
  return false;
}

function isPublicIpv4(addr: string): boolean {
  const parts = addr.split('.').map((n) => Number.parseInt(n, 10));
  if (parts.length !== 4) return false;
  const [a, b, c, d] = parts as [number, number, number, number];
  if ([a, b, c, d].some((n) => Number.isNaN(n) || n < 0 || n > 255)) return false;
  if (a === 0) return false; // 0.0.0.0/8 "this network"
  if (a === 10) return false; // 10.0.0.0/8 private
  if (a === 127) return false; // loopback
  if (a === 169 && b === 254) return false; // link-local + cloud metadata
  if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12 private
  if (a === 192 && b === 168) return false; // 192.168.0.0/16 private
  if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT 100.64.0.0/10
  if (a === 198 && (b === 18 || b === 19)) return false; // benchmark 198.18.0.0/15
  if (a === 224 || a === 239) return false; // multicast
  if (a === 255 && b === 255) return false; // broadcast
  return a >= 1 && a <= 254;
}

function isPublicIpv6(addr: string): boolean {
  const lower = addr.toLowerCase();
  if (lower === '::' || lower === '::1') return false; // unspecified + loopback
  if (
    lower.startsWith('fe80:') ||
    lower.startsWith('fe8') ||
    lower.startsWith('fe9') ||
    lower.startsWith('fea') ||
    lower.startsWith('feb')
  )
    return false; // link-local
  if (lower.startsWith('fc') || lower.startsWith('fd')) return false; // unique-local
  if (lower.startsWith('ff')) return false; // multicast
  if (lower.startsWith('::ffff:')) {
    // IPv4-mapped — extract and check the v4 side.
    const v4 = lower.replace('::ffff:', '');
    if (isIP(v4) === 4) return isPublicIpv4(v4);
    return false;
  }
  return true;
}

/**
 * Guarded fetch. Follows redirects manually, up to `maxHops`, with the URL
 * guard applied at every hop. Caps the response body at `maxBytes`.
 */
export async function safeFetch(
  inputUrl: string,
  init: RequestInit & { maxBytes?: number; maxHops?: number; timeoutMs?: number } = {},
): Promise<{ response: Response; finalUrl: string; bytes: number; truncated: boolean }> {
  const maxBytes = init.maxBytes ?? DEFAULT_MAX_BYTES;
  const maxHops = init.maxHops ?? DEFAULT_MAX_HOPS;
  const timeoutMs = init.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let currentUrl = validateUrlShape(inputUrl).toString();
  await assertPublicHost(new URL(currentUrl).hostname);

  let hops = 0;
  let lastResponse: Response | null = null;
  while (hops <= maxHops) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let res: Response;
    try {
      res = await fetch(currentUrl, {
        ...init,
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'user-agent': USER_AGENT,
          ...((init.headers as Record<string, string>) ?? {}),
        },
      });
    } catch (err) {
      clearTimeout(timer);
      throw new UrlGuardError(
        `تعذّر الاتصال بالخادم: ${err instanceof Error ? err.message : String(err)}`,
        'fetch_failed',
      );
    }
    clearTimeout(timer);
    lastResponse = res;

    // Manual redirect handling — re-validate each hop.
    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get('location');
      if (!loc) return { response: res, finalUrl: currentUrl, bytes: 0, truncated: false };
      hops += 1;
      if (hops > maxHops)
        throw new UrlGuardError('تجاوز عدد التحويلات المسموح', 'too_many_redirects');
      currentUrl = new URL(loc, currentUrl).toString();
      validateUrlShape(currentUrl);
      await assertPublicHost(new URL(currentUrl).hostname);
      continue;
    }

    // Drain the body into a capped buffer.
    const { bytes, truncated, buffer } = await readCapped(res, maxBytes);
    // Re-wrap as a Response so downstream callers can call .text() / .headers etc.
    // Copy into a fresh ArrayBuffer to avoid the SharedArrayBuffer union that
    // `Uint8Array#buffer` exposes in Node 20+ — BodyInit doesn't accept it.
    const copy = new ArrayBuffer(buffer.byteLength);
    new Uint8Array(copy).set(buffer);
    const wrapped = new Response(copy, {
      status: res.status,
      statusText: res.statusText,
      headers: res.headers,
    });
    return { response: wrapped, finalUrl: currentUrl, bytes, truncated };
  }

  // Should be unreachable — the loop always returns or throws.
  if (lastResponse) {
    return { response: lastResponse, finalUrl: currentUrl, bytes: 0, truncated: false };
  }
  throw new UrlGuardError('حالة غير متوقعة', 'fetch_failed');
}

async function readCapped(
  res: Response,
  maxBytes: number,
): Promise<{ bytes: number; truncated: boolean; buffer: Uint8Array }> {
  if (!res.body) return { bytes: 0, truncated: false, buffer: new Uint8Array() };
  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  let truncated = false;
  // Read until the stream ends OR we exceed the cap (in which case we cancel and flag truncated).
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        truncated = true;
        try {
          await reader.cancel();
        } catch {
          /* ignore */
        }
        break;
      }
      chunks.push(value);
    }
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    buffer.set(c, offset);
    offset += c.byteLength;
  }
  return { bytes: total, truncated, buffer };
}
