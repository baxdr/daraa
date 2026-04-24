'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Gap } from '@/agents/analysis-agent';

/**
 * Editorial gap card — severity is a left-edge bar (thick, unmissable),
 * hierarchy comes from typography and rules, not shadows or ring borders.
 */

const SEVERITY_STYLES: Record<
  Gap['severity'],
  { bar: string; labelAr: string; labelColor: string }
> = {
  critical: { bar: 'bg-danger',    labelAr: 'حرج',    labelColor: 'text-danger'   },
  medium:   { bar: 'bg-warn',      labelAr: 'متوسط',  labelColor: 'text-warn'     },
  // Low: use ink-2 for a darker bar — plain rule (#D9D1C3) on white falls
  // below WCAG 3:1 for non-text UI components. ink-2 at 30% alpha on white
  // is ~4.3:1, passes AA non-text.
  low:      { bar: 'bg-ink-2/30',  labelAr: 'منخفض',  labelColor: 'text-ink-2'    },
};

type AutoDocType = 'privacy_policy' | 'dpo_appointment';
const RULE_TO_DOC_TYPE: Record<string, AutoDocType | undefined> = {
  pdpl_privacy_policy_published: 'privacy_policy',
  pdpl_arabic_available:         'privacy_policy',
  pdpl_purpose_stated:           'privacy_policy',
  pdpl_retention_stated:         'privacy_policy',
  pdpl_cross_border_disclosed:   'privacy_policy',
  pdpl_third_party_disclosed:    'privacy_policy',
  pdpl_trackers_disclosed:       'privacy_policy',
  pdpl_dpo_required:             'dpo_appointment',
};

export function GapCard({ gap, scanId, index }: { gap: Gap; scanId: string; index: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const detailsId = useId();
  const style = SEVERITY_STYLES[gap.severity];
  const docType = RULE_TO_DOC_TYPE[gap.ruleId];
  const canFix = gap.canAutoGenerate && Boolean(docType);
  const fineLabel = gap.fineCeilingSar.toLocaleString('en-US');

  async function handleGenerate() {
    if (!docType || generating) return;
    setGenError(null);
    setGenerating(true);
    const controller = new AbortController();
    // 60s — Claude document generation is the slowest call in the app.
    const timeoutId = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch('/api/documents/generate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ scanId, docType }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        setGenError(`تعذّر توليد المستند (${res.status}) — حاول مجدداً`);
        return;
      }
      const data = (await res.json()) as { docId?: string; error?: string };
      if (data.docId) router.push(`/documents/${data.docId}`);
      else setGenError(data.error ?? 'تعذّر توليد المستند');
    } catch (e) {
      clearTimeout(timeoutId);
      setGenError(
        e instanceof Error && e.name === 'AbortError'
          ? 'انتهت المهلة — خدمة التوليد بطيئة. حاول مجدداً.'
          : e instanceof Error ? e.message : 'خطأ غير متوقع',
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <article
      className="grid grid-cols-[6px_1fr] overflow-hidden border border-rule bg-white animate-fade-rise"
      style={{ animationDelay: `${Math.min(index, 6) * 80}ms` }}
    >
      {/* Severity bar — full-height, unmissable */}
      <div className={`${style.bar}`} aria-hidden />

      <div className="px-5 py-5 md:px-6">
        {/* Metadata row: index, severity label, confidence tag */}
        <div className="flex items-baseline justify-between gap-4">
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-xs tabular-nums text-muted">
              {String(index + 1).padStart(2, '0')}
            </span>
            <span className={`text-[11px] font-bold tracking-widest ${style.labelColor}`}>
              · {style.labelAr}
            </span>
            {gap.confidence === 'low' && (
              <span className="pill text-[11px]">غير مؤكد</span>
            )}
          </div>
          {gap.fineCeilingSar > 0 && (
            <div
              className="text-left"
              role="group"
              aria-label={`سقف الغرامة: ${gap.fineCeilingSar.toLocaleString('en-US')} ريال`}
            >
              <div className="font-mono text-xs uppercase tracking-widest text-muted" aria-hidden="true">
                سقف الغرامة
              </div>
              <div className="font-display text-lg font-extrabold tabular-nums text-danger" aria-hidden="true">
                {fineLabel}
                <span className="text-xs font-medium text-muted"> ريال</span>
              </div>
            </div>
          )}
        </div>

        <h3 className="mt-3 font-display text-xl font-extrabold leading-snug tracking-tight text-ink">
          {gap.titleAr}
        </h3>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="mt-4 flex items-center gap-2 text-xs font-semibold text-ink-2 hover:text-accent"
          aria-expanded={open}
          aria-controls={detailsId}
        >
          <span>{open ? 'إخفاء التفاصيل' : 'وش المشكلة بالضبط'}</span>
          <span aria-hidden className={`transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
        </button>

        {open && (
          <div
            id={detailsId}
            className="mt-4 space-y-3 border-t border-rule pt-4 text-sm leading-relaxed text-ink-2 animate-fade-rise"
          >
            <p>{gap.explanationAr}</p>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1 text-xs">
              <span className="text-muted">
                <span className="font-mono tracking-widest">المرجع</span>
                <span className="mx-2">·</span>
                <span className="text-ink-2">{gap.legalRefAr}</span>
              </span>
              {gap.fineCeilingSar === 0 && (
                <span className="text-muted">
                  <span className="font-mono tracking-widest">المخاطر</span>
                  <span className="mx-2">·</span>
                  <span className="text-ink-2">فقدان عقود الجهات الحكومية أو تعرّض الأنظمة للاختراق</span>
                </span>
              )}
            </div>
          </div>
        )}

        {canFix && (
          <div className="mt-5 border-t border-rule pt-5">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={generating}
              aria-busy={generating}
              aria-live="polite"
              className="btn-outline w-full justify-between text-sm hover:bg-accent hover:border-accent hover:text-paper"
            >
              <span>{generating ? 'جاري التوليد…' : 'ولّد الحل تلقائياً'}</span>
              <span aria-hidden>{generating ? '…' : '←'}</span>
            </button>
            {genError && <p className="mt-2 text-xs text-danger">{genError}</p>}
          </div>
        )}
      </div>
    </article>
  );
}
