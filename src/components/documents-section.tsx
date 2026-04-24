'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { DocumentKind } from '@/agents/document-agent';
import { DOCUMENT_META } from '@/agents/document-agent';

/**
 * "الوثائق الموصى بها" — shows all 4 generatable document types on the
 * report page with contextual blurbs and one-click generation. This is
 * the product's "we do it for you" moment, complementing the per-gap
 * ولّد-الحل CTA on critical gaps.
 */

interface DocSpec {
  kind: DocumentKind;
  priorityAr: string;
  whyAr: string;
}

interface Props {
  scanId: string;
  /** Which docs to highlight — driven by analysis.gaps and answers. */
  recommendations: DocSpec[];
}

export function DocumentsSection({ scanId, recommendations }: Props) {
  if (recommendations.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="mb-6 flex items-baseline justify-between">
        <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
          الوثائق الموصى بها
        </h2>
        <span className="font-mono text-xs tabular-nums text-muted">
          {recommendations.length.toString().padStart(2, '0')} وثيقة
        </span>
      </div>
      <div className="rule mb-6" />
      <div className="grid gap-4 md:grid-cols-2">
        {recommendations.map((rec) => (
          <DocumentTile key={rec.kind} scanId={scanId} rec={rec} />
        ))}
      </div>
    </section>
  );
}

function DocumentTile({ scanId, rec }: { scanId: string; rec: DocSpec }) {
  const router = useRouter();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meta = DOCUMENT_META[rec.kind];

  async function handleGenerate() {
    if (generating) return;
    setError(null);
    setGenerating(true);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scanId, docType: rec.kind }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        setError(`تعذّر توليد المستند (${res.status}) — حاول مجدداً`);
        return;
      }
      const data = (await res.json()) as { docId?: string; error?: string };
      if (data.docId) router.push(`/documents/${data.docId}`);
      else setError(data.error ?? 'تعذّر توليد المستند');
    } catch (e) {
      clearTimeout(timeoutId);
      setError(
        e instanceof Error && e.name === 'AbortError'
          ? 'انتهت المهلة — خدمة التوليد بطيئة. حاول مجدداً.'
          : e instanceof Error ? e.message : 'خطأ غير متوقع',
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <article className="border border-rule bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="font-mono text-[10px] uppercase tracking-widest text-muted">
          {meta.titleEn}
        </div>
        <span className="pill">{rec.priorityAr}</span>
      </div>
      <h3 className="mt-2 font-display text-lg font-extrabold leading-tight tracking-tight">
        {meta.titleAr}
      </h3>
      <p className="mt-2 text-xs leading-relaxed text-muted">{meta.blurbAr}</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-2">{rec.whyAr}</p>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={generating}
        aria-busy={generating}
        aria-live="polite"
        className="btn-outline mt-5 w-full justify-between text-sm hover:bg-accent hover:border-accent hover:text-paper disabled:opacity-50"
      >
        <span>{generating ? 'جاري التوليد…' : 'ولّد الوثيقة'}</span>
        <span aria-hidden>{generating ? '…' : '←'}</span>
      </button>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
    </article>
  );
}
