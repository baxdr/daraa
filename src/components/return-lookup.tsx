'use client';

import { useState } from 'react';
import Link from 'next/link';

interface ProjectSummary {
  id: string;
  createdAt: number;
  mode: 'establishment' | 'compliance' | 'operational_compliance';
  status: 'pending' | 'running' | 'complete' | 'error';
  companyName: string;
  vertical: string;
}

const VERTICAL_LABELS: Record<string, string> = {
  restaurant: 'مطعم / كوفي',
  salon: 'صالون',
  tech: 'شركة تقنية',
  services: 'متجر إلكتروني',
  construction: 'مقاولات',
};

export function ReturnLookup() {
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<ProjectSummary[] | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);
    try {
      const res = await fetch('/api/projects/by-email', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      if (!res.ok) {
        const body = await res.json().catch(() => ({} as { error?: string }));
        setError(body.error ?? `تعذّر البحث (${res.status})`);
        return;
      }
      const data = (await res.json()) as { count: number; projects: ProjectSummary[] };
      setResults(data.projects);
    } catch (e) {
      clearTimeout(timeoutId);
      setError(
        e instanceof Error && e.name === 'AbortError'
          ? 'انتهت المهلة — حاول مرة أخرى'
          : e instanceof Error ? e.message : 'خطأ غير متوقع',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row">
        <input
          type="email"
          required
          dir="ltr"
          placeholder="you@company.sa"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={submitting}
          className="flex-1 border border-ink bg-paper px-4 py-3 font-mono text-ink placeholder:text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={submitting || !email.trim()}
          className="btn-ink text-sm disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? '…' : 'ابحث عن مشاريعي'}
        </button>
      </form>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 border-s-2 border-danger bg-danger/5 px-3 py-2 text-sm text-danger"
        >
          <span>{error}</span>
        </div>
      )}

      {results && results.length === 0 && (
        <div className="mt-8 border border-rule bg-paper-2 px-5 py-6 text-center">
          <p className="text-sm text-ink-2">
            ما لقينا مشاريع مربوطة بهذا البريد.
          </p>
          <Link
            href="/chat"
            className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-accent hover:text-accent-strong"
          >
            <span>ابدأ مشروعاً جديداً</span>
            <span aria-hidden>←</span>
          </Link>
        </div>
      )}

      {results && results.length > 0 && (
        <div className="mt-8">
          <div className="eyebrow mb-3">
            {results.length.toString().padStart(2, '0')} مشروع
          </div>
          <ul className="space-y-3">
            {results.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/project/${p.id}`}
                  className="grid grid-cols-[1fr_auto] items-center gap-4 border border-rule bg-white px-5 py-4 transition-colors hover:border-ink hover:bg-paper-2/60"
                >
                  <div className="min-w-0">
                    <div className="font-display text-lg font-extrabold tracking-tight text-ink truncate">
                      {p.companyName || 'مشروع بدون اسم'}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span>{modeLabel(p.mode)}</span>
                      <span className="text-rule">·</span>
                      <span>{VERTICAL_LABELS[p.vertical] ?? p.vertical}</span>
                      <span className="text-rule">·</span>
                      <span>{new Date(p.createdAt).toLocaleDateString('ar-SA-u-ca-gregory', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                  </div>
                  <StatusPill status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function modeLabel(m: ProjectSummary['mode']): string {
  if (m === 'establishment') return 'تأسيس';
  if (m === 'operational_compliance') return 'امتثال تشغيلي';
  return 'امتثال رقمي';
}

function StatusPill({ status }: { status: ProjectSummary['status'] }) {
  const style =
    status === 'complete' ? 'border-accent/30 bg-accent-soft text-accent-strong' :
    status === 'running'  ? 'border-warn/30 bg-warn-soft text-warn-strong' :
    status === 'error'    ? 'border-danger/40 bg-danger/5 text-danger' :
                            'border-rule bg-paper-2 text-ink-2';
  const label =
    status === 'complete' ? '✓ جاهز' :
    status === 'running'  ? 'جارٍ' :
    status === 'error'    ? 'خطأ' :
                            'قيد التحضير';
  return (
    <span className={`shrink-0 border px-2.5 py-1 text-[11px] font-bold ${style}`}>
      {label}
    </span>
  );
}
