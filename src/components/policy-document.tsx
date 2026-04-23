'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { StoredDocument } from '@/lib/document-store';
import {
  COMPANY_NAME_PLACEHOLDER,
  DPO_NAME_PLACEHOLDER,
  type DocumentKind,
  type DocumentSection,
} from '@/agents/document-agent';

// Note on placeholders: we only substitute company name and DPO name in the
// rendered output. DPO_EMAIL_PLACEHOLDER (`dpo@[company].sa`) is intentionally
// left in the text — it's a prompt for the user to replace with their real
// address when editing the final copy before publishing.

/**
 * Unified document viewer — handles all 4 generated document types.
 *
 * Editorial "official document" register: running header, numbered section
 * hierarchy, hairline rules, generous A4 margins, serif on print. Browser's
 * `window.print()` produces a PDF with correct Arabic shaping (avoids the
 * broken server-side pdfkit/@react-pdf path).
 *
 * The renderer branches on `doc.kind` for top-of-page chrome (privacy_policy
 * gets a drop cap, dpo_appointment gets a formal letter block, etc.) but the
 * section body renderer is shared.
 */
/** Strip Unicode bidi / format / control characters from user-typed text —
 *  prevents bidi-override attacks that reorder surrounding Arabic glyphs. */
function sanitizeUserText(input: string): string {
  // \p{Cf} covers format chars (RLO, LRO, PDF, etc.); \p{Cc} covers controls.
  return input.replace(/[\p{Cf}\p{Cc}]/gu, '');
}

export function PolicyDocumentView({ doc }: { doc: StoredDocument }) {
  // Server-side substitution already filled real company names into section
  // bodies. Seed the editor input so the masthead matches; the placeholder
  // fallback only kicks in if the project had no name (shouldn't happen now).
  const initialCompanyName =
    doc.companyName && doc.companyName !== COMPANY_NAME_PLACEHOLDER ? doc.companyName : '';
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [dpoName, setDpoName] = useState('');
  const effectiveCompany = sanitizeUserText(companyName).trim() || COMPANY_NAME_PLACEHOLDER;
  const effectiveDpo = sanitizeUserText(dpoName).trim() || DPO_NAME_PLACEHOLDER;
  const needsDpoName = doc.kind === 'dpo_appointment' || doc.kind === 'incident_response';

  const lastUpdatedLabel = useMemo(
    () =>
      new Date(doc.lastUpdatedAt).toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [doc.lastUpdatedAt],
  );

  return (
    <div className="min-h-screen bg-paper-3/40 py-10 print:bg-white print:py-0">
      {/* Breadcrumb */}
      <nav
        aria-label="مسار التنقّل"
        className="mx-auto mb-4 flex max-w-[210mm] items-center gap-2 px-4 text-xs text-muted print:hidden"
      >
        <Link href="/" className="hover:text-ink">درع</Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">المستندات</span>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">{doc.title}</span>
      </nav>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-10 mx-auto mb-6 flex max-w-[210mm] flex-wrap items-center justify-between gap-3 border border-rule bg-white/95 px-4 py-3 shadow-sm backdrop-blur print:hidden">
        <Link
          href="/"
          className="text-xs text-muted underline decoration-rule decoration-2 underline-offset-4 hover:text-ink"
        >
          ← العودة
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            aria-label="اسم الشركة"
            placeholder="اكتب اسم شركتك"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            className="border border-ink bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
          {needsDpoName && (
            <input
              type="text"
              aria-label="اسم مسؤول حماية البيانات"
              placeholder="اسم مسؤول حماية البيانات"
              value={dpoName}
              onChange={(e) => setDpoName(e.target.value)}
              className="border border-ink bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          )}
          <button type="button" onClick={() => window.print()} className="btn-ink text-sm py-2 px-5">
            حمّل PDF
          </button>
        </div>
      </div>

      {doc.fromFallbackTemplate && (
        <div className="mx-auto mb-4 max-w-[210mm] border-s-2 border-warn bg-warn-soft/70 px-4 py-3 text-xs text-ink-2 print:hidden">
          النسخة الحالية من قالب جاهز (مفتاح الـ AI غير مُعدّ) — النص صالح للاستخدام بعد مراجعة قانونية.
        </div>
      )}

      {/* A4 sheet — tighter padding on mobile so the document fits the viewport. */}
      <article className="mx-auto w-full max-w-[210mm] bg-white p-6 shadow-card sm:p-10 md:p-12 print:m-0 print:max-w-none print:p-[20mm] print:shadow-none print:font-serif">
        <Masthead
          kind={doc.kind}
          title={doc.title}
          titleEn={doc.titleEn}
          companyName={effectiveCompany}
          dateLabel={lastUpdatedLabel}
          metadata={doc.metadata}
          effectiveDpoName={effectiveDpo}
        />

        <div className="space-y-10 text-[15px] leading-[1.85] text-ink">
          {doc.sections.map((section, i) => (
            <SectionBlock
              key={i}
              index={i}
              total={doc.sections.length}
              kind={doc.kind}
              section={substituteInSection(section, effectiveCompany, effectiveDpo)}
            />
          ))}
        </div>

        {/* Signature block — only for dpo_appointment */}
        {doc.kind === 'dpo_appointment' && (
          <div className="mt-16 grid grid-cols-2 gap-12 border-t border-ink pt-8 text-sm">
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                المُصدر
              </div>
              <div className="mt-3 font-display text-base font-extrabold">{effectiveCompany}</div>
              <div className="mt-12 border-t border-rule pt-2 text-xs text-muted">التوقيع والختم</div>
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
                المُعيَّن
              </div>
              <div className="mt-3 font-display text-base font-extrabold">{effectiveDpo}</div>
              <div className="mt-12 border-t border-rule pt-2 text-xs text-muted">التوقيع</div>
            </div>
          </div>
        )}

        <footer className="mt-12 border-t border-ink pt-4 text-[11px] leading-relaxed text-muted">
          <div className="flex flex-wrap justify-between gap-2">
            <span>{doc.disclaimerAr}</span>
            <span className="font-mono">© {new Date().getFullYear()} درع</span>
          </div>
        </footer>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

function Masthead({
  kind,
  title,
  titleEn,
  companyName,
  dateLabel,
  metadata,
  effectiveDpoName,
}: {
  kind: DocumentKind;
  title: string;
  titleEn?: string;
  companyName: string;
  dateLabel: string;
  metadata?: Array<{ label: string; value: string }>;
  effectiveDpoName: string;
}) {
  return (
    <header className="mb-10 border-b border-ink pb-5">
      <div className="flex items-baseline justify-between">
        <div>
          {titleEn && (
            <div className="font-display text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted">
              {titleEn}
            </div>
          )}
          <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight tracking-tight text-ink">
            {title}
          </h1>
        </div>
        <div className="text-left">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
            {dateLabel}
          </div>
          <div className="mt-2 font-display text-lg font-extrabold tracking-tight">
            {companyName}
          </div>
        </div>
      </div>

      {/* Optional metadata strip — used by dpo_appointment, register, incident */}
      {metadata && metadata.length > 0 && (
        <dl className="mt-5 grid grid-cols-1 gap-x-6 gap-y-2 border-t border-rule pt-4 text-[12px] sm:grid-cols-3">
          {metadata.map((m, i) => (
            <div key={i}>
              <dt className="font-mono text-[10px] uppercase tracking-widest text-muted">{m.label}</dt>
              <dd className="mt-0.5 font-display text-sm font-extrabold tracking-tight">
                {/* Substitute placeholder values where applicable */}
                {m.value === '[اسم مسؤول حماية البيانات]' ? effectiveDpoName : m.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {/* Document-kind context blurb */}
      <p className="mt-4 text-xs leading-relaxed text-muted">{KIND_BLURB[kind]}</p>
    </header>
  );
}

function SectionBlock({
  index,
  total,
  kind,
  section,
}: {
  index: number;
  total: number;
  kind: DocumentKind;
  section: DocumentSection;
}) {
  // Skip the section entirely if Claude returned an empty shell — a bare
  // heading with nothing under it would just render a "broken" header.
  const hasBody = Boolean(section.body && section.body.trim());
  const hasList = Boolean(section.listItems && section.listItems.length);
  const hasTable = Boolean(section.table && section.table.rows.length);
  if (!hasBody && !hasList && !hasTable) return null;

  // Privacy policy opens with a drop cap on the intro paragraph.
  const useDropCap = kind === 'privacy_policy' && index === 0 && hasBody;
  // Processing register's first section is usually the table — skip numbering.
  const showNumber = kind !== 'processing_register' || total > 1;

  return (
    <section>
      <h2 className="mb-3 flex items-baseline gap-3 font-display text-lg font-extrabold tracking-tight text-ink">
        {showNumber && (
          <span className="font-mono text-xs text-muted tabular-nums">
            {String(index + 1).padStart(2, '0')}
          </span>
        )}
        <span>{section.heading}</span>
      </h2>
      <div className="rule mb-3" />
      {section.body && (
        <p
          className={
            useDropCap
              ? 'whitespace-pre-line first-letter:float-start first-letter:font-display first-letter:text-5xl first-letter:font-extrabold first-letter:leading-none first-letter:pe-2 first-letter:pt-1'
              : 'whitespace-pre-line'
          }
        >
          {section.body}
        </p>
      )}
      {section.listItems && section.listItems.length > 0 && (
        <ul className="mt-3 space-y-2">
          {section.listItems.map((item, j) => (
            <li key={j} className="grid grid-cols-[auto_1fr] gap-x-3">
              <span className="pt-1 font-mono text-xs text-accent">
                {String.fromCharCode(1632 + j + 1)}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
      {section.table && <DocTable table={section.table} captionAr={section.heading} />}
    </section>
  );
}

function DocTable({
  table,
  captionAr,
}: {
  table: NonNullable<DocumentSection['table']>;
  captionAr: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px] leading-normal">
        <caption className="sr-only">{captionAr}</caption>
        <thead>
          <tr>
            {table.headers.map((h, i) => (
              <th
                key={i}
                scope="col"
                className="border-b-2 border-ink bg-paper-2/50 px-3 py-2 text-right font-display text-xs font-extrabold tracking-tight text-ink"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-b border-rule last:border-b-0">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-3 align-top text-ink-2">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ------------------------------------------------------------------------- */

const KIND_BLURB: Record<DocumentKind, string> = {
  privacy_policy:
    'وثيقة تُنشر على موقع الشركة لبيان كيفية جمع ومعالجة وحماية البيانات الشخصية.',
  dpo_appointment:
    'خطاب رسمي من الإدارة بتعيين مسؤول حماية البيانات، معتمَد ومحفوظ في سجلات الشركة.',
  processing_register:
    'سجل مُلزِم بموجب نظام حماية البيانات الشخصية، يُقدَّم للهيئة السعودية للبيانات والذكاء الاصطناعي (SDAIA) عند الطلب.',
  incident_response:
    'إجراء معتمَد مسبقاً لاحتواء حوادث اختراق البيانات والإبلاغ عنها خلال ٧٢ ساعة.',
};

function substituteInSection(
  section: DocumentSection,
  companyName: string,
  dpoName: string,
): DocumentSection {
  // Ordering note: COMPANY is substituted before DPO. If a user ever enters a
  // literal "[اسم مسؤول حماية البيانات]" as the company name (extremely
  // unlikely), the second pass would rewrite it — accepted risk; reversing
  // the order would swap the failure mode not eliminate it.
  const swap = (t: string) =>
    t
      .split(COMPANY_NAME_PLACEHOLDER)
      .join(companyName)
      .split(DPO_NAME_PLACEHOLDER)
      .join(dpoName);

  return {
    ...section,
    body: swap(section.body),
    listItems: section.listItems?.map(swap),
    table: section.table
      ? {
          headers: section.table.headers.map(swap),
          rows: section.table.rows.map((r) => r.map(swap)),
        }
      : undefined,
  };
}
