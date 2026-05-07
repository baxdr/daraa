import { describe, it, expect } from 'vitest';
import {
  ECC_CONTROLS,
  ECC_DOMAINS,
  ECC_TOTAL_CONTROLS,
  getControlsForDomain,
  getControlsByApplicability,
  getCriticalControlCount,
  type EccDomainId,
} from '@/knowledge/nca-ecc';

describe('NCA-ECC catalog', () => {
  it('contains exactly 114 controls (the canonical count)', () => {
    expect(ECC_TOTAL_CONTROLS).toBe(114);
    expect(ECC_CONTROLS).toHaveLength(114);
  });

  it('has 5 domains', () => {
    expect(ECC_DOMAINS).toHaveLength(5);
  });

  it('every control has a unique id', () => {
    const ids = ECC_CONTROLS.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every control id matches the ECC-N-N-N format', () => {
    const re = /^ECC-[1-5]-\d+-\d+$/;
    for (const c of ECC_CONTROLS) {
      expect(c.id, `bad id: ${c.id}`).toMatch(re);
    }
  });

  it('every control belongs to a known domain', () => {
    const known: ReadonlySet<EccDomainId> = new Set(ECC_DOMAINS.map((d) => d.id));
    for (const c of ECC_CONTROLS) {
      expect(known.has(c.domain), `unknown domain on ${c.id}`).toBe(true);
    }
  });

  it('every control has non-empty Arabic title and requirement', () => {
    for (const c of ECC_CONTROLS) {
      expect(c.titleAr.length, `empty title on ${c.id}`).toBeGreaterThan(5);
      expect(c.requirementAr.length, `empty req on ${c.id}`).toBeGreaterThan(20);
    }
  });

  it('domain control counts match the canonical breakdown', () => {
    expect(getControlsForDomain('governance')).toHaveLength(25);
    expect(getControlsForDomain('defence')).toHaveLength(50);
    expect(getControlsForDomain('resilience')).toHaveLength(10);
    expect(getControlsForDomain('third_party')).toHaveLength(10);
    expect(getControlsForDomain('ics')).toHaveLength(19);
  });

  it('getControlsByApplicability returns subset for each applicability', () => {
    const all = getControlsByApplicability('all');
    const ics = getControlsByApplicability('ics_only');
    expect(all.length).toBeGreaterThan(0);
    expect(ics.length).toBe(19);
    expect(all.length + ics.length).toBeLessThanOrEqual(114);
  });

  it('majority of controls are critical or medium severity', () => {
    expect(getCriticalControlCount()).toBeGreaterThan(60);
  });
});
