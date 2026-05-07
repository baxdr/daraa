/**
 * Document Agent — public barrel.
 *
 * Consumers import from `@/agents/document-agent` (no path change required by
 * Phase 5d split — the original file became this directory).
 */

export { generateDocument } from './generator';
export {
  COMPANY_NAME_PLACEHOLDER,
  DPO_EMAIL_PLACEHOLDER,
  DPO_NAME_PLACEHOLDER,
  DOCUMENT_META,
  type DocumentKind,
  type DocumentSection,
  type DocumentTable,
  type GeneratedDocument,
} from './types';
// Back-compat named export — some callers still import generatePrivacyPolicy.
export { generatePrivacyPolicy } from './kinds/privacy-policy';
