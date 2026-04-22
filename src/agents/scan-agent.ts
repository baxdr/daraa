import { scanPrivacyPolicy } from '@/scanner/privacy-policy';
import { scanSecurityHeaders } from '@/scanner/security-headers';
import { scanThirdParty } from '@/scanner/third-party';
import type { ScanResult } from './types';

/**
 * Scan Agent — runs all sub-scans in parallel and returns the combined result.
 *
 * Kept as a thin facade so a caller that doesn't need the activity-timeline
 * narrative (tests, CLI tools, future batch jobs) gets a clean API. The
 * orchestrator calls the sub-scans directly instead, so it can interleave
 * "agent is working" events between them.
 */
export async function runScanAgent(url: string): Promise<ScanResult> {
  const [privacyPolicy, securityHeaders, thirdParty] = await Promise.all([
    scanPrivacyPolicy(url),
    scanSecurityHeaders(url),
    scanThirdParty(url),
  ]);
  return {
    url,
    scannedAt: new Date().toISOString(),
    privacyPolicy,
    securityHeaders,
    thirdParty,
  };
}
