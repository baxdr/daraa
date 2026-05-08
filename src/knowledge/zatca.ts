/**
 * ZATCA — small-shop slice of the knowledge base.
 *
 * Post-pivot, درع targets small physical shops. The relevant ZATCA touch-
 * points for that audience are:
 *   - VAT registration thresholds (mandatory at 375K SAR / voluntary at 187.5K)
 *   - Standard rate (15%)
 *   - Six-year invoice retention obligation
 *
 * Phase-2 e-invoicing, withholding tax, excise tax, RETT, and corporate
 * income tax were dropped — they apply to larger or specialist businesses
 * outside the product's scope. If a shop crosses VAT threshold or grows,
 * we direct them to zatca.gov.sa rather than reproducing the rule catalog.
 *
 * IMPORTANT: All thresholds and rates here are public ZATCA documentation
 * as of 2024. They WILL change. UI must surface "تحقّق من zatca.gov.sa
 * للتحديثات" alongside any number quoted from this file.
 */

export interface VatThresholds {
  /** Mandatory registration threshold — annual taxable supplies SAR. */
  mandatoryRegistrationSar: number;
  /** Voluntary registration threshold — below mandatory but eligible. */
  voluntaryRegistrationSar: number;
  /** Standard VAT rate. */
  standardRatePercent: number;
}

export const VAT: VatThresholds = {
  mandatoryRegistrationSar: 375_000,
  voluntaryRegistrationSar: 187_500,
  standardRatePercent: 15,
};

/** Statutory minimum retention period for tax records (years). */
export const RECORD_RETENTION_YEARS = 6;
