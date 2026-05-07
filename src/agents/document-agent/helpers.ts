/**
 * Shared helpers used by every document generator: wrapDoc, post-processing
 * (substituteCompanyName), and Claude-fallback logging.
 */

import { MissingApiKeyError } from '@/lib/claude';
import type { DocumentKind, DocumentSection, GeneratedDocument } from './types';
import { COMPANY_NAME_PLACEHOLDER, DOCUMENT_META } from './types';

export const DEFAULT_DISCLAIMER =
  'تمت صياغة هذه الوثيقة تلقائياً بواسطة أداة درع — يُنصح بمراجعتها قانونياً قبل الاعتماد أو النشر.';

export function logClaudeFallback(kind: DocumentKind, err: unknown): void {
  const reason =
    err instanceof MissingApiKeyError
      ? 'api_key_missing'
      : err instanceof Error
        ? err.message
        : 'unknown';
  console.warn(`[documents] falling back to template for ${kind}: ${reason}`);
}

export function wrapDoc(
  kind: DocumentKind,
  companyName: string,
  sections: DocumentSection[],
  fromFallback: boolean,
  metadata?: Array<{ label: string; value: string }>,
): GeneratedDocument {
  const meta = DOCUMENT_META[kind];
  return {
    kind,
    title: meta.titleAr,
    titleEn: meta.titleEn,
    companyName,
    lastUpdatedAt: new Date().toISOString(),
    sections,
    ...(metadata ? { metadata } : {}),
    disclaimerAr: DEFAULT_DISCLAIMER,
    fromFallbackTemplate: fromFallback,
  };
}

/**
 * Swap [اسم الشركة] placeholders throughout the generated document when the
 * caller passed a real name. Keeps the placeholder if `companyName` is
 * empty so the user still sees where to fill in.
 */
export function substituteCompanyName(
  doc: GeneratedDocument,
  companyName?: string,
): GeneratedDocument {
  const name = companyName?.trim();
  if (!name) return doc;
  const swap = (s: string) => s.split(COMPANY_NAME_PLACEHOLDER).join(name);
  return {
    ...doc,
    companyName: name,
    sections: doc.sections.map((s) => {
      const mappedTable = s.table
        ? {
            headers: s.table.headers.map(swap),
            rows: s.table.rows.map((row) => row.map(swap)),
          }
        : undefined;
      const mappedListItems = s.listItems?.map(swap);
      return {
        ...s,
        body: swap(s.body),
        ...(mappedListItems ? { listItems: mappedListItems } : {}),
        ...(mappedTable ? { table: mappedTable } : {}),
      };
    }),
    ...(doc.metadata
      ? { metadata: doc.metadata.map((m) => ({ label: m.label, value: swap(m.value) })) }
      : {}),
  };
}
