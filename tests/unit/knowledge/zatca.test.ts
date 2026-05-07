import { describe, it, expect } from 'vitest';
import {
  VAT,
  E_INVOICE_PHASES,
  WHT_RULES,
  EXCISE_PRODUCTS,
  ZATCA_RULES,
  ZATCA_TOTAL_RULES,
  getRulesForProfile,
  ZAKAT_RATE_PERCENT,
  CORPORATE_INCOME_TAX_PERCENT,
  RETT_RATE_PERCENT,
} from '@/knowledge/zatca';

describe('ZATCA knowledge', () => {
  describe('thresholds', () => {
    it('VAT mandatory threshold is 375,000 SAR', () => {
      expect(VAT.mandatoryRegistrationSar).toBe(375_000);
    });

    it('VAT voluntary threshold is 187,500 SAR', () => {
      expect(VAT.voluntaryRegistrationSar).toBe(187_500);
    });

    it('VAT standard rate is 15%', () => {
      expect(VAT.standardRatePercent).toBe(15);
    });

    it('Zakat rate is 2.5%', () => {
      expect(ZAKAT_RATE_PERCENT).toBe(2.5);
    });

    it('Corporate income tax (foreign) is 20%', () => {
      expect(CORPORATE_INCOME_TAX_PERCENT).toBe(20);
    });

    it('RETT is 5%', () => {
      expect(RETT_RATE_PERCENT).toBe(5);
    });
  });

  describe('E-invoicing phases', () => {
    it('lists exactly 2 phases', () => {
      expect(E_INVOICE_PHASES).toHaveLength(2);
    });

    it('each phase has at least 4 requirements', () => {
      for (const phase of E_INVOICE_PHASES) {
        expect(phase.requirementsAr.length).toBeGreaterThanOrEqual(4);
      }
    });
  });

  describe('Withholding tax', () => {
    it('contains key categories: rent, services, royalties', () => {
      const categories = WHT_RULES.map((r) => r.category);
      expect(categories.some((c) => c.includes('إيجار'))).toBe(true);
      expect(categories.some((c) => c.includes('استشارية'))).toBe(true);
      expect(categories.some((c) => c.includes('إتاوات'))).toBe(true);
    });
  });

  describe('Excise products', () => {
    it('includes tobacco at 100%', () => {
      const tobacco = EXCISE_PRODUCTS.find((p) => p.productAr.includes('التبغ'));
      expect(tobacco?.ratePercent).toBe(100);
    });

    it('includes soft drinks at 50%', () => {
      const soda = EXCISE_PRODUCTS.find((p) => p.productAr.includes('الغازية'));
      expect(soda?.ratePercent).toBe(50);
    });
  });

  describe('Rules catalog', () => {
    it('has at least 14 rules', () => {
      expect(ZATCA_TOTAL_RULES).toBeGreaterThanOrEqual(14);
    });

    it('every rule has a unique id', () => {
      const ids = ZATCA_RULES.map((r) => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('every rule has Arabic title and requirement', () => {
      for (const r of ZATCA_RULES) {
        expect(r.titleAr.length).toBeGreaterThan(5);
        expect(r.requirementAr.length).toBeGreaterThan(20);
      }
    });
  });

  describe('getRulesForProfile', () => {
    it('returns universal rules for an unregistered new business', () => {
      const rules = getRulesForProfile({ annualRevenueSar: 0 });
      const ids = rules.map((r) => r.id);
      expect(ids).toContain('zatca_vat_registration_mandatory');
      expect(ids).not.toContain('zatca_vat_filing_periodic'); // VAT-registered only
    });

    it('returns VAT-registered rules above threshold', () => {
      const rules = getRulesForProfile({ annualRevenueSar: 500_000 });
      const ids = rules.map((r) => r.id);
      expect(ids).toContain('zatca_vat_filing_periodic');
      expect(ids).toContain('zatca_einvoice_phase1');
    });

    it('adds foreign-owned rules when hasForeignOwner', () => {
      const rules = getRulesForProfile({
        annualRevenueSar: 1_000_000,
        hasForeignOwner: true,
      });
      const ids = rules.map((r) => r.id);
      expect(ids).toContain('zatca_corporate_tax_foreign');
    });

    it('adds excise rules when sellsExciseGoods', () => {
      const rules = getRulesForProfile({
        annualRevenueSar: 1_000_000,
        sellsExciseGoods: true,
      });
      const ids = rules.map((r) => r.id);
      expect(ids).toContain('zatca_excise_registration');
    });

    it('adds RETT for real-estate businesses', () => {
      const rules = getRulesForProfile({
        annualRevenueSar: 1_000_000,
        isRealEstate: true,
      });
      const ids = rules.map((r) => r.id);
      expect(ids).toContain('zatca_rett_payment');
    });
  });
});
