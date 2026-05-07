import { describe, it, expect } from 'vitest';
import { PDPL_RULES, PDPL_DATA_SUBJECT_RIGHTS } from '@/knowledge/pdpl';

describe('PDPL knowledge', () => {
  it('catalog has 35+ rules (Phase 6 expansion target)', () => {
    expect(PDPL_RULES.length).toBeGreaterThanOrEqual(35);
  });

  it('every rule has a unique id', () => {
    const ids = PDPL_RULES.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every rule has Arabic title + requirement + valid severity', () => {
    const validSeverities = new Set(['critical', 'medium', 'low']);
    for (const r of PDPL_RULES) {
      expect(r.titleAr.length).toBeGreaterThan(5);
      expect(r.requirementAr.length).toBeGreaterThan(20);
      expect(validSeverities.has(r.severity)).toBe(true);
    }
  });

  it('preserves canonical 5 data-subject rights (not GDPR 8)', () => {
    expect(PDPL_DATA_SUBJECT_RIGHTS).toHaveLength(5);
    const ids = PDPL_DATA_SUBJECT_RIGHTS.map((r) => r.id);
    expect(ids).toEqual(['informed', 'access', 'copy', 'correction', 'destruction']);
  });

  it('includes scanner-mapped rules (privacy_policy, consent, https)', () => {
    const ids = PDPL_RULES.map((r) => r.id);
    expect(ids).toContain('pdpl_privacy_policy_published');
    expect(ids).toContain('pdpl_consent_before_processing');
    expect(ids).toContain('nca_https_enforced');
  });

  it('includes operational rules (DPIA, breach 72h, processor contract)', () => {
    const ids = PDPL_RULES.map((r) => r.id);
    expect(ids).toContain('pdpl_dpia_required');
    expect(ids).toContain('pdpl_breach_notification_72h');
    expect(ids).toContain('pdpl_processor_contract');
  });

  it('cross-border rules apply only to cross_border profile', () => {
    const crossBorder = PDPL_RULES.filter((r) => r.appliesTo === 'cross_border');
    expect(crossBorder.length).toBeGreaterThan(0);
    for (const r of crossBorder) {
      expect(r.severity).toBe('critical');
    }
  });
});
