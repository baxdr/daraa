/**
 * External scan pipeline — runs the privacy-policy/security-headers/third-party/forms
 * scanners and assembles the unified ScanResult. Used in compliance + operational-
 * compliance (with website) modes.
 *
 * Each scanner uses Promise.allSettled so one crashing implementation can't
 * collapse the whole phase. Each has an empty-result fallback.
 */

import { scanPrivacyPolicy } from '@/scanner/privacy-policy';
import { scanSecurityHeaders } from '@/scanner/security-headers';
import { scanThirdParty } from '@/scanner/third-party';
import { scanForms } from '@/scanner/forms';
import type { ScanResult } from '../types';

export interface ScanPipelineOutcome {
  scanResult: ScanResult;
  trackerCount: number;
  formIssues: number;
}

export async function runScanPipeline(url: string): Promise<ScanPipelineOutcome> {
  const [ppRes, shRes, tpRes, fRes] = await Promise.allSettled([
    scanPrivacyPolicy(url),
    scanSecurityHeaders(url),
    scanThirdParty(url),
    scanForms(url),
  ]);
  const privacyPolicy =
    ppRes.status === 'fulfilled' ? ppRes.value : { found: false, error: 'scanner_crashed' };
  const securityHeaders =
    shRes.status === 'fulfilled'
      ? shRes.value
      : {
          httpsEnforced: false,
          hsts: false,
          contentSecurityPolicy: false,
          xFrameOptions: false,
          xContentTypeOptionsNoSniff: false,
          referrerPolicy: false,
          permissionsPolicy: false,
          score: 0,
          finalUrl: url,
          error: 'scanner_crashed',
        };
  const thirdParty =
    tpRes.status === 'fulfilled'
      ? tpRes.value
      : {
          detected: [],
          crossBorderCount: 0,
          categories: {
            analytics: 0,
            advertising: 0,
            chat: 0,
            marketing: 0,
            session_replay: 0,
            other: 0,
          },
          error: 'scanner_crashed',
        };
  const dataForms =
    fRes.status === 'fulfilled'
      ? fRes.value
      : { formsFound: 0, results: [], error: 'scanner_crashed' };

  const scanResult: ScanResult = {
    url,
    scannedAt: new Date().toISOString(),
    privacyPolicy,
    securityHeaders,
    thirdParty,
    dataForms,
  };

  const trackerCount = thirdParty.detected.length;
  const formIssues = dataForms.results.reduce((n, f) => n + f.violations.length, 0);

  return { scanResult, trackerCount, formIssues };
}
