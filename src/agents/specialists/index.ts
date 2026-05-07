/**
 * Specialist factory.
 *
 * `getAgentsForVertical(v)` returns a FRESH set of specialist instances
 * every call (agents are stateless for now, but fresh instances avoid
 * cross-run state leakage once we add per-run caches).
 *
 * The roster per vertical:
 *
 *   restaurant:   mci → zatca → mohr_gosi → civil_defense → municipality → sfda
 *   salon:        mci → zatca → mohr_gosi → civil_defense → municipality → moh
 *   tech:         mci → zatca → zatca_einvoice → mohr_gosi → pdpl_nca
 *   ecommerce:    mci → zatca → zatca_einvoice → mohr_gosi → maroof → pdpl_nca
 *   construction: mci → zatca → mohr_gosi → civil_defense → municipality →
 *                 contractor_classification
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

export function getAgentsForVertical(vertical: VerticalId): Agent[] {
  // Baseline — every commercial activity.
  const base: Agent[] = [new MciAgent(), new ZatcaAgent(), new MohrGosiAgent()];

  switch (vertical) {
    case 'restaurant':
      return [...base, new CivilDefenseAgent(), new MunicipalityAgent(), new SfdaAgent()];
    case 'salon':
      return [...base, new CivilDefenseAgent(), new MunicipalityAgent(), new MohAgent()];
    case 'tech':
      return [...base, new ZatcaEinvoiceAgent(), new PdplNcaAgent()];
    case 'services':
      // "services" in the chat = ecommerce in the design.
      return [...base, new ZatcaEinvoiceAgent(), new MaroofAgent(), new PdplNcaAgent()];
    case 'construction':
      return [
        ...base,
        new CivilDefenseAgent(),
        new MunicipalityAgent(),
        new ContractorClassificationAgent(),
      ];
  }
}
