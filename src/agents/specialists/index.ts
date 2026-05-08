/**
 * Specialist factory for small-shop verticals.
 *
 * `getAgentsForVertical(v)` returns a FRESH set of specialist instances
 * every call (agents are stateless for now, but fresh instances avoid
 * cross-run state leakage once we add per-run caches).
 *
 * Roster per vertical:
 *
 *   coffee:     mci → zatca → mohr_gosi → civil_defense → municipality → sfda
 *   restaurant: mci → zatca → mohr_gosi → civil_defense → municipality → sfda → moh
 *   grocery:    mci → zatca → mohr_gosi → civil_defense → municipality → sfda
 *   laundry:    mci → zatca → mohr_gosi → civil_defense → municipality
 *   salon:      mci → zatca → mohr_gosi → civil_defense → municipality → moh
 */

import type { VerticalId } from '@/knowledge/entities';
import type { Agent } from '../runtime/types';
import { MciAgent } from './mci-agent';
import { ZatcaAgent } from './zatca-agent';
import { MohrGosiAgent } from './mohr-gosi-agent';
import { CivilDefenseAgent } from './civil-defense-agent';
import { MunicipalityAgent } from './municipality-agent';
import { SfdaAgent } from './sfda-agent';
import { MohAgent } from './moh-agent';

export function getAgentsForVertical(vertical: VerticalId): Agent[] {
  const base: Agent[] = [
    new MciAgent(),
    new ZatcaAgent(),
    new MohrGosiAgent(),
    new CivilDefenseAgent(),
    new MunicipalityAgent(),
  ];

  switch (vertical) {
    case 'coffee':
    case 'grocery':
      return [...base, new SfdaAgent()];
    case 'restaurant':
      return [...base, new SfdaAgent(), new MohAgent()];
    case 'laundry':
      return [...base];
    case 'salon':
      return [...base, new MohAgent()];
  }
}
