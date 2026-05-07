import { describe, it, expect } from 'vitest';
import { TERMS, type TermId } from '@/knowledge/terms';

describe('Arabic terms dictionary', () => {
  it('has 150+ entries (Phase 6 expansion target)', () => {
    expect(Object.keys(TERMS).length).toBeGreaterThanOrEqual(150);
  });

  it('every entry has an Arabic term name and a non-empty explanation', () => {
    for (const [id, entry] of Object.entries(TERMS)) {
      expect(entry.termAr.length, `empty termAr on ${id}`).toBeGreaterThan(2);
      expect(entry.simpleExplanation.length, `short explanation on ${id}`).toBeGreaterThan(20);
    }
  });

  it('preserves the original 15 terms (no regressions)', () => {
    const originals: TermId[] = [
      'PDPL',
      'DPO',
      'NCA_ECC',
      'ZATCA',
      'SDAIA',
      'SAMA',
      'privacy_policy',
      'consent',
      'data_breach',
      'cross_border_transfer',
      'data_retention',
      'third_party',
      'encryption_at_rest',
      'security_headers',
      'cookie_consent',
    ];
    for (const id of originals) {
      expect(TERMS[id], `missing original term: ${id}`).toBeDefined();
    }
  });

  it('includes new categories: government bodies, tax, security, IP, customs', () => {
    expect(TERMS.gov_MCI).toBeDefined();
    expect(TERMS.tax_VAT).toBeDefined();
    expect(TERMS.sec_MFA).toBeDefined();
    expect(TERMS.ip_trademark).toBeDefined();
    expect(TERMS.customs_HS_code).toBeDefined();
    expect(TERMS.emp_nitaqat).toBeDefined();
    expect(TERMS.audit_KYC).toBeDefined();
    expect(TERMS.risk_RTO).toBeDefined();
  });
});
