/**
 * One-shot data migration: regenerate operationalReport for every demo
 * project under data/projects/demo-*.json by running the live operational
 * analyzer against its persisted answers.
 *
 * Why: the demo JSONs were seeded before runOperationalAnalysis populated
 * a project record's operationalReport field, so the dashboard rendered
 * with no narrative + no gaps. Re-running the analyzer here produces the
 * gaps (extinguishers, ventilation, hygiene certs, …) that the public
 * dashboard expects.
 *
 * Run:   pnpm tsx scripts/regenerate-demo-reports.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { runOperationalAnalysis } from '../src/agents/operational-analysis';

const DIR = 'data/projects';

const files = readdirSync(DIR).filter((f) => f.startsWith('demo-') && f.endsWith('.json'));

for (const f of files) {
  const path = join(DIR, f);
  const project = JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;
  const answers = project.answers as Parameters<typeof runOperationalAnalysis>[0]['answers'];
  const report = runOperationalAnalysis({ answers });
  project.operationalReport = report;
  writeFileSync(path, JSON.stringify(project, null, 2) + '\n');
  console.log(
    `✓ ${f.padEnd(30)}  health=${report.healthScore}%  gaps=${report.gaps.length}  overdue=${report.overdue.length}  upcoming=${report.upcomingRenewals.length}`,
  );
}
