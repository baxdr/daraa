/**
 * Resend client — lazy-init from RESEND_API_KEY.
 *
 * Returns null when the env var is missing so call sites can decide their
 * own fallback (no-op, log to stdout, fail soft, etc). Keeping the API
 * key check at module-import time would force every test to set the env;
 * we read it on demand instead.
 */

import { Resend } from 'resend';

let cached: Resend | null | undefined;

export function getResend(): Resend | null {
  if (cached !== undefined) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    cached = null;
    return null;
  }
  cached = new Resend(key);
  return cached;
}

/** Sender envelope address. Override per-domain via env when production-ready. */
export function senderAddress(): string {
  return process.env.RESEND_FROM ?? 'درع <onboarding@resend.dev>';
}

/** True when Resend is configured. UI surfaces fall back to in-app
 *  messaging when this is false. */
export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
