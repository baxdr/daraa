import { describe, it, expect } from 'vitest';
import { resolveEntities, VERTICALS, ALWAYS_REQUIRED } from '@/knowledge/entities';

describe('Knowledge — entities', () => {
  it('every vertical ships in MVP', () => {
    for (const v of Object.values(VERTICALS)) {
      expect(v.shipsInMvp).toBe(true);
    }
  });

  it('ALWAYS_REQUIRED includes the universal four entities', () => {
    const ids = ALWAYS_REQUIRED.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['mci', 'zatca', 'mol', 'gosi']));
  });

  it('resolveEntities returns merged + sorted list per vertical', () => {
    for (const v of Object.values(VERTICALS)) {
      const resolved = resolveEntities(v.id);
      expect(resolved.length).toBeGreaterThanOrEqual(ALWAYS_REQUIRED.length);
      // Sorted by order asc.
      for (let i = 1; i < resolved.length; i++) {
        expect(resolved[i]!.order).toBeGreaterThanOrEqual(resolved[i - 1]!.order);
      }
    }
  });

  it('tech vertical exposes the 4 new specialists (saip_ip, nca_ecc, tax_strategy)', () => {
    const ids = resolveEntities('tech').map((e) => e.id);
    expect(ids).toContain('saip_ip');
    expect(ids).toContain('nca_ecc');
    expect(ids).toContain('tax_strategy');
  });

  it('ecommerce gets customs in addition to tech specialists', () => {
    const ids = resolveEntities('services').map((e) => e.id);
    expect(ids).toContain('customs');
    expect(ids).toContain('saip_ip');
  });

  it('construction gets customs + tax_strategy', () => {
    const ids = resolveEntities('construction').map((e) => e.id);
    expect(ids).toContain('customs');
    expect(ids).toContain('tax_strategy');
  });

  it('restaurant + salon get tax_strategy but not nca_ecc', () => {
    const r = resolveEntities('restaurant').map((e) => e.id);
    const s = resolveEntities('salon').map((e) => e.id);
    expect(r).toContain('tax_strategy');
    expect(s).toContain('tax_strategy');
    expect(r).not.toContain('nca_ecc');
    expect(s).not.toContain('nca_ecc');
  });
});
