/**
 * Seed two demo projects for the hackathon showcase.
 *
 * Both projects are written directly to the file store (`data/projects/*.json`)
 * with stable, predictable IDs so the /demo page can link to them without
 * a fresh pipeline run. The values are hand-tuned so that the dashboards
 * render with **drama** — overdue rows, amber warnings, a real fine
 * ceiling — instead of the "365 days for everything" state a freshly
 * created project shows.
 *
 * Run with: npm run seed-demo
 *
 * Idempotent: overwrites the two demo JSON files on every run.
 */

import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  runOperationalAnalysis,
  type OperationalReport,
} from '../src/agents/operational-analysis';
import { runAnalysis, type AnalysisReport } from '../src/agents/analysis-agent';
import type { ProjectRecord } from '../src/lib/project-store';
import type { Answers } from '../src/agents/chat-flow';
import type { GovEntity } from '../src/knowledge/entities';
import type { ScanResult } from '../src/agents/types';
import novaStats from '../src/data/nova-tech-stats.json';

const DATA_DIR = join(process.cwd(), 'data/projects');
mkdirSync(DATA_DIR, { recursive: true });

const NOW = Date.now();
const DAY = 86_400_000;
const daysAgoIso = (n: number) =>
  new Date(NOW - n * DAY).toISOString().slice(0, 10);
const daysFromNowIso = (n: number) =>
  new Date(NOW + n * DAY).toISOString().slice(0, 10);

/* ─────────────────────────────────────────────────────────────────────
 * 1. "كوفي رافعه" — operational_compliance with URGENT renewals
 * ──────────────────────────────────────────────────────────────────── */

{
  const id = 'demo-kafe-rafeh-op';
  const answers: Answers = {
    q0_mode: 'operational_compliance',
    q_company_name: 'كوفي رافعه',
    op1_vertical: 'restaurant',
    op2_city: 'jeddah',
    op3_cr_issue_date:           daysAgoIso(350), // CR: 15d to expiry
    op4_municipal_last_renewed:  daysAgoIso(340), // Muni: 25d to expiry
    op5_civil_defense_last:      daysAgoIso(320), // CD:   45d to expiry (critical rule → medium)
    op6_sfda_cert_date:          daysAgoIso(355), // SFDA: 10d to expiry (critical)
    op7_employee_count:          12,              // nitaqat flag
    op8_lease_expiry:            daysFromNowIso(50),
    op9_has_website:             'no',
  };
  const report: OperationalReport = runOperationalAnalysis({ answers });

  const record: ProjectRecord = {
    id,
    createdAt: NOW - 350 * DAY, // project "opened" nearly a year ago
    mode: 'operational_compliance',
    status: 'complete',
    phase: 'active_monitoring',
    email: 'demo@daraa.sa',
    companyName: answers.q_company_name!,
    vertical: 'restaurant',
    cityId: 'jeddah',
    url: null,
    answers,
    activities: [],
    messages: [],
    entities: [],
    roadmap: [],
    costSummary: { minSar: 0, maxSar: 0, itemCount: 0 },
    topWarnings: [
      'شهادة الغذاء والدواء (SFDA) على وشك الانتهاء — ١٠ أيام متبقّية. أي تأخير في التجديد يوقف الخدمة فوراً.',
    ],
    regulatoryUpdates: [],
    operationalReport: report,
  };

  writeFileSync(join(DATA_DIR, `${id}.json`), JSON.stringify(record), 'utf8');
  console.log(`✓ seeded ${id}`);
  console.log(`  healthScore: ${report.healthScore}%`);
  console.log(`  overdue: ${report.overdue.length} · upcoming: ${report.upcomingRenewals.length} · total: ${report.gaps.length}`);
}

/* ─────────────────────────────────────────────────────────────────────
 * 2. "Nova Tech" — digital compliance with real scan result + gaps
 * ──────────────────────────────────────────────────────────────────── */

{
  const id = 'demo-nova-tech-dig';
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

  // Synthesize a realistic ScanResult that matches the Nova Tech precompute.
  const scan: ScanResult = {
    url: 'https://novatech.sa',
    scannedAt: new Date().toISOString(),
    privacyPolicy: {
      found: true,
      policyUrl: 'https://novatech.sa/privacy.html',
      language: 'en',
      hasArabicVersion: false,
    },
    securityHeaders: {
      httpsEnforced: true,
      hsts: false,
      contentSecurityPolicy: false,
      xFrameOptions: false,
      xContentTypeOptionsNoSniff: false,
      referrerPolicy: false,
      permissionsPolicy: false,
      score: Math.round((1 / 7) * 100),
      finalUrl: 'https://novatech.sa',
    },
    thirdParty: {
      detected: [
        { domain: 'google-analytics.com', displayName: 'Google Analytics', category: 'analytics',  crossBorder: true },
        { domain: 'connect.facebook.net', displayName: 'Facebook Pixel',    category: 'advertising', crossBorder: true },
        { domain: 'hotjar.com',           displayName: 'Hotjar',            category: 'session_replay', crossBorder: true },
      ],
      crossBorderCount: 3,
      categories: { analytics: 1, advertising: 1, chat: 0, marketing: 0, session_replay: 1, other: 0 },
    },
    dataForms: {
      formsFound: 1,
      results: [{
        formIndex: 0,
        action: '#',
        sensitiveFields: ['name', 'email', 'phone'],
        hasConsent: false,
        hasPrivacyLink: false,
        violations: [
          'يجمع بيانات شخصية بدون مربع موافقة صريح',
          'بدون رابط لسياسة الخصوصية قريب من الفورم',
        ],
      }],
    },
  };

  const analysis: AnalysisReport = runAnalysis({ answers, scan });

  const record: ProjectRecord = {
    id,
    createdAt: NOW - 2 * DAY,
    mode: 'compliance',
    status: 'complete',
    phase: 'active_monitoring',
    email: 'demo@daraa.sa',
    companyName: answers.q_company_name!,
    vertical: 'tech',
    url: 'https://novatech.sa',
    answers,
    activities: [],
    messages: [],
    entities: [],
    roadmap: [],
    costSummary: { minSar: 0, maxSar: 0, itemCount: 0 },
    topWarnings: [
      'بياناتكم مُستضافة خارج المملكة وتجاوز المستخدمون ١٠٠ ألف بدون DPO معيّن — مخالفة جوهرية للمادة ٣٢.',
    ],
    regulatoryUpdates: [],
    complianceScore: analysis.complianceScore,
    totalFineCeilingSar: analysis.totalFineCeilingSar,
    gaps: analysis.gaps,
    analysis,
    scanResult: scan,
  };

  writeFileSync(join(DATA_DIR, `${id}.json`), JSON.stringify(record), 'utf8');
  console.log(`\n✓ seeded ${id}`);
  console.log(`  complianceScore: ${analysis.complianceScore}%`);
  console.log(`  gaps: ${analysis.gaps.length} · fine ceiling: ${analysis.totalFineCeilingSar.toLocaleString('en-US')} SAR`);
  console.log(`  (precomputed JSON still at src/data/nova-tech-stats.json: ${novaStats.complianceScore}% / ${novaStats.gapCount} / ${novaStats.totalFineCeilingSar.toLocaleString('en-US')})`);
}

/* ─────────────────────────────────────────────────────────────────────
 * Email index — both demo projects linked to demo@daraa.sa so /return
 * shows them in one list.
 * ──────────────────────────────────────────────────────────────────── */

{
  const USERS_DIR = join(process.cwd(), 'data/users');
  mkdirSync(USERS_DIR, { recursive: true });
  const hash = createHash('sha256').update('demo@daraa.sa').digest('hex').slice(0, 16);
  writeFileSync(
    join(USERS_DIR, `${hash}.json`),
    JSON.stringify({
      email: 'demo@daraa.sa',
      projectIds: ['demo-kafe-rafeh-op', 'demo-nova-tech-dig'],
      updatedAt: NOW,
    }),
    'utf8',
  );
  console.log(`\n✓ seeded email index for demo@daraa.sa`);
}

// Suppress unused-import warning for novaStats (we only log it).
void novaStats;
