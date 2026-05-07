/**
 * Document Agent — public type surface.
 *
 * Consumed by:
 *   - app/api/documents/generate/route.ts (DocumentKind, generateDocument)
 *   - components/documents-section.tsx (DocumentKind, DOCUMENT_META)
 *   - components/policy-document.tsx (placeholders + types)
 *   - core/repositories/document-repository.ts (GeneratedDocument)
 *   - lib/document-store.ts (GeneratedDocument)
 *   - infrastructure/persistence/{filesystem,supabase}/sb-document-repository.ts
 */

export type DocumentKind =
  | 'privacy_policy'
  | 'dpo_appointment'
  | 'processing_register'
  | 'incident_response';

export interface DocumentSection {
  heading: string;
  body: string;
  /** Optional bulleted items rendered after the body. */
  listItems?: string[];
  /** Optional tabular block — used for processing-register activities. */
  table?: DocumentTable;
}

export interface DocumentTable {
  headers: string[];
  rows: string[][];
}

export interface GeneratedDocument {
  kind: DocumentKind;
  /** Main Arabic title — appears in the document's masthead. */
  title: string;
  /** Optional English title (e.g. "PRIVACY POLICY") shown as a small eyebrow. */
  titleEn?: string;
  companyName: string;
  lastUpdatedAt: string;
  /** Extra top-of-document metadata (DPO name / address / ref number / etc.) */
  metadata?: Array<{ label: string; value: string }>;
  sections: DocumentSection[];
  disclaimerAr: string;
  fromFallbackTemplate: boolean;
}

export const COMPANY_NAME_PLACEHOLDER = '[اسم الشركة]';
export const DPO_NAME_PLACEHOLDER = '[اسم مسؤول حماية البيانات]';
export const DPO_EMAIL_PLACEHOLDER = 'dpo@[company].sa';

export const DOCUMENT_META: Record<
  DocumentKind,
  { titleAr: string; titleEn: string; blurbAr: string }
> = {
  privacy_policy: {
    titleAr: 'سياسة الخصوصية',
    titleEn: 'PRIVACY POLICY',
    blurbAr: 'وثيقة تنشرها الشركة على موقعها تشرح كيف تتعامل مع بيانات العملاء.',
  },
  dpo_appointment: {
    titleAr: 'خطاب تعيين مسؤول حماية البيانات',
    titleEn: 'DPO APPOINTMENT',
    blurbAr: 'خطاب رسمي من الإدارة يُعيّن شخصاً مسؤولاً عن الامتثال لنظام حماية البيانات.',
  },
  processing_register: {
    titleAr: 'سجل أنشطة معالجة البيانات الشخصية',
    titleEn: 'DATA PROCESSING REGISTER',
    blurbAr: 'جدول يوثّق كل نشاط تعالج فيه الشركة بيانات شخصية — مطلوب عند التفتيش.',
  },
  incident_response: {
    titleAr: 'خطة الاستجابة لحوادث اختراق البيانات',
    titleEn: 'INCIDENT RESPONSE PLAN',
    blurbAr: 'إجراء معتمد مسبقاً للتصرف إذا تعرّضت بيانات العملاء للاختراق.',
  },
};
