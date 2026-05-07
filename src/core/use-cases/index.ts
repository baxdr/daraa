/**
 * Use-case barrel exports.
 *
 * Phase 4b extracted the high-value use-cases where logic was scattered
 * between routes and helpers. The remaining use-cases listed in the
 * Phase 4 plan are deferred to the phases that naturally touch their
 * flows:
 *   - process-chat-message  -> Phase 5 (agent system deepening)
 *   - generate-document     -> Phase 9 (document expansion + versioning)
 *   - invite-workspace-member -> Phase 8 (workspaces + multi-tenant)
 *   - claim-projects-by-email -> Phase 8 (needs ownerUserId on entity)
 */

export { startProject, resolveVertical } from './start-project.use-case';
export type { StartProjectInput, StartProjectDeps } from './start-project.use-case';

export { lookupProjectsByEmail } from './lookup-projects-by-email.use-case';
export type {
  LookupProjectsByEmailInput,
  LookupProjectsByEmailDeps,
  ProjectSummary,
} from './lookup-projects-by-email.use-case';
