/**
 * Unit tests for the operational-compliance analyzer. No test runner — just
 * a series of asserts that throw on failure. Run with:
 *   npm run test:operational
 */

import { runOperationalAnalysis } from '../src/agents/operational-analysis';
import type { Answers } from '../src/agents/chat-flow';

let passed = 0;
let failed = 0;

function expect(label: string, condition: boolean, detail?: string) {
  if (condition) {
    passed += 1;
    console.log(`  ✓ ${label}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${label}${detail ? ' — ' + detail : ''}`);
  }
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - n);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
function daysFromNow(n: number): string {
  return daysAgo(-n);
}

const TODAY = new Date(Date.UTC(2026, 3, 24)); // 2026-04-24 to match memory.currentDate

/* ------------------------------------------------------------------------- */
console.log('\n=== 1. Restaurant with everything overdue — 3 criticals expected ===');
{
  const answers: Answers = {
    q0_mode: 'operational_compliance',
    op1_vertical: 'restaurant',
    op2_city: 'riyadh',
    op3_cr_issue_date: '2024-01-01', // > 12mo old
    op4_municipal_last_renewed: '2024-03-15',
    op5_civil_defense_last: '2024-04-01',
    op6_sfda_cert_date: '2024-02-20',
    op7_employee_count: 8,
    op8_lease_expiry: daysFromNow(500),
    op9_has_website: 'no',
  };
  const r = runOperationalAnalysis({ answers, today: TODAY });
  const overdueIds = r.overdue.map((g) => g.id).sort();
  console.log(`  overdue ids: ${overdueIds.join(', ')}`);
  console.log(`  healthScore: ${r.healthScore}`);
  expect('cr is overdue', overdueIds.includes('op_cr_renewal'));
  expect(
    'civil defense is overdue (critical)',
    r.gaps.some((g) => g.id === 'op_civil_defense' && g.severity === 'critical'),
  );
  expect(
    'sfda is overdue (critical)',
    r.gaps.some((g) => g.id === 'op_sfda' && g.severity === 'critical'),
  );
  expect('healthScore < 40', r.healthScore < 40);
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 2. Salon all fresh — zero non-low gaps, healthScore 100 ===');
{
  const answers: Answers = {
    q0_mode: 'operational_compliance',
    op1_vertical: 'salon',
    op2_city: 'jeddah',
    op3_cr_issue_date: daysAgo(30),
    op4_municipal_last_renewed: daysAgo(15),
    op5_civil_defense_last: daysAgo(10),
    op7_employee_count: 4,
    op8_lease_expiry: daysFromNow(500),
    op9_has_website: 'no',
  };
  const r = runOperationalAnalysis({ answers, today: TODAY });
  expect('zero overdue', r.overdue.length === 0);
  expect('no meaningful upcoming', r.upcomingRenewals.length === 0);
  expect('health score 100', r.healthScore === 100);
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 3. Construction with 25 employees — nitaqat flag ===');
{
  const answers: Answers = {
    q0_mode: 'operational_compliance',
    op1_vertical: 'construction',
    op2_city: 'dammam',
    op3_cr_issue_date: daysAgo(30),
    op4_municipal_last_renewed: daysAgo(30),
    op5_civil_defense_last: daysAgo(10),
    op7_employee_count: 25,
    op8_lease_expiry: daysFromNow(400),
    op9_has_website: 'no',
  };
  const r = runOperationalAnalysis({ answers, today: TODAY });
  const nitaqat = r.gaps.find((g) => g.id === 'op_nitaqat_check');
  expect('nitaqat gap exists', Boolean(nitaqat));
  expect('nitaqat severity medium (< 50 emp)', nitaqat?.severity === 'medium');
  expect('no SFDA gap for construction', !r.gaps.some((g) => g.category === 'sfda'));
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 4. Missing dates — low severity info items ===');
{
  const answers: Answers = {
    q0_mode: 'operational_compliance',
    op1_vertical: 'retail',
    op2_city: 'riyadh',
    op3_cr_issue_date: daysAgo(30),
    op4_municipal_last_renewed: null,
    op5_civil_defense_last: null,
    op7_employee_count: 3,
    op8_lease_expiry: null,
    op9_has_website: 'no',
  };
  const r = runOperationalAnalysis({ answers, today: TODAY });
  const lowCount = r.gaps.filter((g) => g.severity === 'low').length;
  expect('at least 2 low-severity gaps from missing dates', lowCount >= 2);
}

/* ------------------------------------------------------------------------- */
console.log('\n=== 5. Lease expires in 30 days — critical ===');
{
  const answers: Answers = {
    q0_mode: 'operational_compliance',
    op1_vertical: 'retail',
    op2_city: 'khobar',
    op3_cr_issue_date: daysAgo(30),
    op7_employee_count: 3,
    op8_lease_expiry: daysFromNow(25),
    op9_has_website: 'no',
  };
  const r = runOperationalAnalysis({ answers, today: TODAY });
  const lease = r.gaps.find((g) => g.id === 'op_lease_notice');
  expect('lease gap surfaces', Boolean(lease));
  expect('lease severity critical (≤30d)', lease?.severity === 'critical');
  expect(
    'lease in upcoming window',
    r.upcomingRenewals.some((g) => g.id === 'op_lease_notice'),
  );
}

/* ------------------------------------------------------------------------- */

console.log(`\n${passed} passed · ${failed} failed`);
if (failed > 0) process.exit(1);
