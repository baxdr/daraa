/**
 * Unit test for the form scanner — runs against the bundled Nova Tech demo
 * HTML without going through the HTTP / SSRF layer. Proves the detector
 * and violations list work end-to-end.
 *
 * Run with: npx tsx scripts/test-form-scanner.ts
 */

import { readFileSync } from 'node:fs';
import { analyseForms } from '../src/scanner/forms';

function main() {
  const html = readFileSync('./public/demo/novatech/contact.html', 'utf8');
  const result = analyseForms(html);

  console.log('forms found:', result.formsFound);
  for (const f of result.results) {
    console.log(`  form #${f.formIndex} action=${f.action || '(none)'}`);
    console.log(`    sensitive fields: ${f.sensitiveFields.join(', ')}`);
    console.log(`    consent: ${f.hasConsent}`);
    console.log(`    privacy link: ${f.hasPrivacyLink}`);
    for (const v of f.violations) console.log(`    ✗ ${v}`);
  }

  const issues = result.results.reduce((n, f) => n + f.violations.length, 0);
  if (issues < 2) {
    console.log('\n✗ expected at least 2 violations on Nova Tech contact form');
    process.exit(1);
  }
  console.log('\n✓ form scanner detected the Nova Tech contact-form gap correctly');
}

main();
