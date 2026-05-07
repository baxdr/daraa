/**
 * Project domain entity and types.
 *
 * Re-exports the canonical ProjectRecord from src/lib/project-store.ts
 * so we can gradually migrate to a core-focused location without breaking
 * existing callers. This bridge layer decouples the domain from infrastructure.
 */

export type {
  ProjectRecord,
  ProjectMode,
  ProjectStatus,
  ProjectPhase,
  RegulatoryUpdateRecord,
} from '@/lib/project-store';
