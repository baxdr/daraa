/**
 * Document Agent — main dispatcher.
 *
 * Routes a DocumentKind request to the right per-kind generator, then
 * post-processes the output to swap [اسم الشركة] for the real company name
 * (when the caller passed one).
 */

import type { Answers } from '../chat-flow';
import type { DocumentKind, GeneratedDocument } from './types';
import { buildCompanyContext } from './company-context';
import { substituteCompanyName } from './helpers';
import { generatePrivacyPolicy } from './kinds/privacy-policy';
import { generateDpoAppointment } from './kinds/dpo-appointment';
import { generateProcessingRegister } from './kinds/processing-register';
import { generateIncidentResponse } from './kinds/incident-response';

export async function generateDocument(
  kind: DocumentKind,
  answers: Answers,
  companyName?: string,
): Promise<GeneratedDocument> {
  const ctx = buildCompanyContext(answers);
  const base = await (async (): Promise<GeneratedDocument> => {
    switch (kind) {
      case 'privacy_policy':
        return generatePrivacyPolicy(ctx);
      case 'dpo_appointment':
        return generateDpoAppointment(ctx);
      case 'processing_register':
        return generateProcessingRegister(ctx);
      case 'incident_response':
        return generateIncidentResponse(ctx);
      default: {
        const _exhaustive: never = kind;
        throw new Error(`Unknown document kind: ${_exhaustive as string}`);
      }
    }
  })();
  return substituteCompanyName(base, companyName);
}
