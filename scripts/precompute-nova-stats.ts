/**
 * Precompute Nova Tech scan stats — runs at build time (or on-demand) to
 * generate src/data/nova-tech-stats.json. The landing-page proof section
 * reads that file instead of hard-coding numbers in the JSX.
 *
 * Honesty note on the security-headers signal: the bundled Nova Tech demo is
 * served from the Next.js server, which attaches strict CSP/HSTS/X-Frame on
 * every response. That would make the Nova Tech profile look much healthier
 * than it's supposed to. For this precompute we feed a "bare static hosting"
 * header profile (all flags false) — matching a realistic deployment on raw
 * S3 / cPanel / a bare VPS, which is what Nova Tech is meant to represent.
 *
 * Outputs JSON with:
 *   - complianceScore, gapCount, totalFineCeilingSar
 *   - breakdown of gaps (severity + titleAr)
 *   - computedAt ISO timestamp
 *   - inputs used (so the number is reproducible)
 *
 * Run with: npm run precompute
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import * as cheerio from 'cheerio';
import { analyseForms } from '../src/scanner/forms';
import { analyseThirdParty } from '../src/scanner/third-party';
import { runAnalysis } from '../src/agents/analysis-agent';
import type { Answers } from '../src/agents/chat-flow';
import type { ScanResult, PrivacyPolicyCheck } from '../src/agents/types';
import type { SecurityHeaderCheck } from '../src/scanner/security-headers';

const DEMO_DIR = join(process.cwd(), 'public/demo/novatech');
const OUT_PATH = join(process.cwd(), 'src/data/nova-tech-stats.json');

/* ─────────────────────────────────────────────────────────────
 * 1. Read Nova Tech static HTML
 * ───────────────────────────────────────────────────────────── */

const indexHtml   = readFileSync(join(DEMO_DIR, 'index.html'),   'utf8');
const privacyHtml = readFileSync(join(DEMO_DIR, 'privacy.html'), 'utf8');
const contactHtml = readFileSync(join(DEMO_DIR, 'contact.html'), 'utf8');

/* ─────────────────────────────────────────────────────────────
 * 2. Build a ScanResult from local analysis
 * ───────────────────────────────────────────────────────────── */

// Privacy policy — detect language + existence from the raw HTML. We skip
// the Claude deep-analysis path here (purposeStated, retentionPeriod, etc.
// stay `undefined`) so the corresponding rules fall into `unknown` and are
// excluded from the score denominator. This mirrors the "no key" runtime
// behaviour.
const privacyPolicy: PrivacyPolicyCheck = buildPrivacyPolicyCheck(privacyHtml);

// Third-party trackers — combine the homepage + contact page since Nova
// Tech inlines them on every page.
const thirdParty = analyseThirdParty(indexHtml + '\n' + contactHtml);

// Forms — only contact.html has a sensitive-data form; the others are
// marketing / legal copy with no inputs.
const dataForms = analyseForms(contactHtml);

// Security headers — bare-hosting profile (see module header note).
const securityHeaders: SecurityHeaderCheck = {
  httpsEnforced: true,   // assume Nova Tech has SSL — most hosts do
  hsts:          false,
  contentSecurityPolicy: false,
  xFrameOptions: false,
  xContentTypeOptionsNoSniff: false,
  referrerPolicy: false,
  permissionsPolicy: false,
  score: Math.round((1 / 7) * 100), // 1 of 7 checks passes → ~14%
  finalUrl: 'https://novatech.sa',
};

const scan: ScanResult = {
  url: 'https://novatech.sa',
  scannedAt: new Date().toISOString(),
  privacyPolicy,
  securityHeaders,
  thirdParty,
  dataForms,
};

/* ─────────────────────────────────────────────────────────────
 * 3. Nova Tech's chat answers — matches the deliberate profile
 *    described in public/demo/novatech/*.html comments.
 * ───────────────────────────────────────────────────────────── */

const answers: Answers = {
  q0_mode: 'compliance',
  q_company_name: 'Nova Tech',
  q1_company_type: 'saas',
  q2_employee_count: 25,
  q3_processes_personal_data: 'yes',
  q4_user_count: 'over_100k',
  q5_dpo_appointed: 'no',
  q6_data_location: 'outside',
  q7_government_clients: 'no',
  q8_website_url: 'https://novatech.sa',
};

/* ─────────────────────────────────────────────────────────────
 * 4. Run analysis + emit JSON
 * ───────────────────────────────────────────────────────────── */

const report = runAnalysis({ answers, scan });

const output = {
  computedAt: new Date().toISOString(),
  target: 'Nova Tech — SaaS (demo)',
  complianceScore: report.complianceScore,
  gapCount: report.gaps.length,
  totalFineCeilingSar: report.totalFineCeilingSar,
  gaps: report.gaps.map((g) => ({
    id: g.id,
    ruleId: g.ruleId,
    severity: g.severity,
    titleAr: g.titleAr,
    fineCeilingSar: g.fineCeilingSar,
  })),
  inputs: {
    privacyPolicy: {
      found: privacyPolicy.found,
      language: privacyPolicy.language,
      hasArabicVersion: privacyPolicy.hasArabicVersion,
    },
    thirdPartyDetected: thirdParty.detected.length,
    formsWithIssues: dataForms.results.filter((f) => f.violations.length > 0).length,
    securityHeadersProfile: 'bare_hosting_simulated',
    applicableRuleCount: report.applicableRuleCount,
    scanSkipped: report.scanSkipped,
    degradedMode: report.degradedMode,
  },
} as const;

mkdirSync(dirname(OUT_PATH), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(output, null, 2) + '\n', 'utf8');

console.log(`✓ wrote ${OUT_PATH}`);
console.log(`  compliance score:   ${output.complianceScore}%`);
console.log(`  gaps:               ${output.gapCount}`);
console.log(`  fine ceiling (SAR): ${output.totalFineCeilingSar.toLocaleString('en-US')}`);
console.log(`  computed at:        ${output.computedAt}`);

/* ─────────────────────────────────────────────────────────────
 * Helpers
 * ───────────────────────────────────────────────────────────── */

function buildPrivacyPolicyCheck(html: string): PrivacyPolicyCheck {
  const $ = cheerio.load(html);
  $('script, style, nav, header, footer, noscript').remove();
  const text = ($('main').text() || $('article').text() || $('body').text())
    .replace(/\s+/g, ' ')
    .trim();
  const arabicChars = (text.match(/[؀-ۿ]/g) || []).length;
  const latinChars = (text.match(/[A-Za-z]/g) || []).length;
  const total = arabicChars + latinChars;
  let language: 'ar' | 'en' | 'both' | 'unknown' = 'unknown';
  if (total >= 20) {
    const ratio = arabicChars / total;
    language = ratio > 0.7 ? 'ar' : ratio < 0.15 ? 'en' : 'both';
  }
  return {
    found: true,
    policyUrl: 'https://novatech.sa/privacy.html',
    language,
    hasArabicVersion: language === 'ar' || language === 'both',
    rawTextExcerpt: text.slice(0, 500),
    // analysis stays undefined — no Claude deep-analysis in the precompute path
  };
}
