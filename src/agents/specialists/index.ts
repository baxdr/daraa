/**
 * Specialist factory.
 *
 * `getAgentsForVertical(v)` returns a FRESH set of specialist instances
 * every call (agents are stateless for now, but fresh instances avoid
 * cross-run state leakage once we add per-run caches).
 *
 * Roster per vertical (Phase 5c expanded):
 *
 *   restaurant:   mci → zatca → mohr_gosi → civil_defense → municipality → sfda → tax_strategy
 *   salon:        mci → zatca → mohr_gosi → civil_defense → municipality → moh → tax_strategy
 *   tech:         mci → zatca → mohr_gosi → zatca_einvoice → pdpl_nca → saip_ip → nca_ecc → tax_strategy
 *   ecommerce:    mci → zatca → mohr_gosi → zatca_einvoice → maroof → pdpl_nca → saip_ip → nca_ecc → customs → tax_strategy
 *   construction: mci → zatca → mohr_gosi → civil_defense → municipality → contractor_classification → customs → tax_strategy
 */

import type { VerticalId } from '@/knowledge/entities';
import type { Agent } from '../runtime/types';
import { MciAgent } from './mci-agent';
import { ZatcaAgent } from './zatca-agent';
import { ZatcaEinvoiceAgent } from './zatca-einvoice-agent';
import { MohrGosiAgent } from './mohr-gosi-agent';
import { CivilDefenseAgent } from './civil-defense-agent';
import { MunicipalityAgent } from './municipality-agent';
import { SfdaAgent } from './sfda-agent';
import { MohAgent } from './moh-agent';
import { MaroofAgent } from './maroof-agent';
import { PdplNcaAgent } from './pdpl-nca-agent';
import { ContractorClassificationAgent } from './contractor-classification-agent';
// Phase 5c — 4 new specialists.
import { TaxStrategyAgent } from './tax-strategy-agent';
import { SaipIpAgent } from './saip-ip-agent';
import { CustomsAgent } from './customs-agent';
import { NcaEccAgent } from './nca-ecc-agent';

export function getAgentsForVertical(vertical: VerticalId): Agent[] {
  // Baseline — every commercial activity.
  const base: Agent[] = [new MciAgent(), new ZatcaAgent(), new MohrGosiAgent()];
  const universalTax = new TaxStrategyAgent();

  switch (vertical) {
    case 'restaurant':
      return [
        ...base,
        new CivilDefenseAgent(),
        new MunicipalityAgent(),
        new SfdaAgent(),
        universalTax,
      ];
    case 'salon':
      return [
        ...base,
        new CivilDefenseAgent(),
        new MunicipalityAgent(),
        new MohAgent(),
        universalTax,
      ];
    case 'tech':
      return [
        ...base,
        new ZatcaEinvoiceAgent(),
        new PdplNcaAgent(),
        new SaipIpAgent(),
        new NcaEccAgent(),
        universalTax,
      ];
    case 'services':
      // "services" in the chat = ecommerce in the design.
      return [
        ...base,
        new ZatcaEinvoiceAgent(),
        new MaroofAgent(),
        new PdplNcaAgent(),
        new SaipIpAgent(),
        new NcaEccAgent(),
        new CustomsAgent(),
        universalTax,
      ];
    case 'construction':
      return [
        ...base,
        new CivilDefenseAgent(),
        new MunicipalityAgent(),
        new ContractorClassificationAgent(),
        new CustomsAgent(),
        universalTax,
      ];
  }
}
