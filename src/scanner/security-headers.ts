/**
 * Security-headers scanner — guarded by SSRF-safe fetch. Checks HTTP response
 * headers against NCA ECC baseline web-application controls.
 */

import { safeFetch, UrlGuardError } from '@/infrastructure/http/url-guard';

export interface SecurityHeaderCheck {
  httpsEnforced: boolean;
  hsts: boolean;
  contentSecurityPolicy: boolean;
  xFrameOptions: boolean;
  xContentTypeOptionsNoSniff: boolean;
  referrerPolicy: boolean;
  permissionsPolicy: boolean;
  score: number;
  finalUrl: string;
  error?: string;
}

export async function scanSecurityHeaders(url: string): Promise<SecurityHeaderCheck> {
  const empty: SecurityHeaderCheck = {
    httpsEnforced: false,
    hsts: false,
    contentSecurityPolicy: false,
    xFrameOptions: false,
    xContentTypeOptionsNoSniff: false,
    referrerPolicy: false,
    permissionsPolicy: false,
    score: 0,
    finalUrl: url,
  };

  try {
    // HEAD first — some origins (Cloudflare) reject HEAD with 405/501; retry
    // with a range-limited GET on those specific statuses.
    let { response, finalUrl } = await safeFetch(url, { method: 'HEAD', maxBytes: 64 * 1024 });
    if (response.status === 405 || response.status === 501) {
      const retry = await safeFetch(url, {
        method: 'GET',
        headers: { range: 'bytes=0-1024' },
        maxBytes: 64 * 1024,
      });
      response = retry.response;
      finalUrl = retry.finalUrl;
    }

    const h = response.headers;
    const check: SecurityHeaderCheck = {
      httpsEnforced: finalUrl.startsWith('https://'),
      hsts: Boolean(h.get('strict-transport-security')),
      contentSecurityPolicy: Boolean(h.get('content-security-policy')),
      xFrameOptions: Boolean(h.get('x-frame-options')),
      xContentTypeOptionsNoSniff: h.get('x-content-type-options')?.toLowerCase() === 'nosniff',
      referrerPolicy: Boolean(h.get('referrer-policy')),
      permissionsPolicy: Boolean(h.get('permissions-policy')),
      score: 0,
      finalUrl,
    };

    const flags = [
      check.httpsEnforced,
      check.hsts,
      check.contentSecurityPolicy,
      check.xFrameOptions,
      check.xContentTypeOptionsNoSniff,
      check.referrerPolicy,
      check.permissionsPolicy,
    ];
    const passed = flags.filter(Boolean).length;
    check.score = Math.round((passed / flags.length) * 100);
    return check;
  } catch (err) {
    return {
      ...empty,
      error:
        err instanceof UrlGuardError
          ? err.reason
          : err instanceof Error
            ? err.message
            : 'fetch_failed',
    };
  }
}
