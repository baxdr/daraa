'use client';

/**
 * Route-level error boundary. Caught errors bubble here instead of showing
 * Next.js's default red overlay. We surface a friendly Arabic explanation
 * and a retry button while logging the actual stack to the console.
 */

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to the client console — in production, replace with Sentry / Vercel Observe.
    console.error('[route-error]', error);
  }, [error]);

  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center">
        <div className="font-display text-[10px] font-extrabold uppercase tracking-[0.24em] text-danger">
          ERROR
        </div>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tighter md:text-5xl">
          صار خطأ غير متوقع
        </h1>
        <div className="mx-auto my-6 h-px w-24 bg-danger" />
        <p className="text-base leading-relaxed text-ink-2">
          ضربنا عقبة أثناء تحضير الصفحة. جرّب مرة ثانية — وإذا استمرت المشكلة، ابدأ استشارة جديدة من
          البداية.
        </p>
        {error.digest && (
          <p className="mt-4 font-mono text-[11px] text-muted">
            معرّف الخطأ: <code dir="ltr">{error.digest}</code>
          </p>
        )}
        {/* Expose the actual message in dev so we can diagnose instead of
            staring at a generic "something broke" page. Hidden from
            typical users but present in the DOM for inspection. */}
        {error.message && (
          <details className="mt-4 text-start">
            <summary className="cursor-pointer text-[11px] text-muted">تفاصيل تقنية</summary>
            <pre
              dir="ltr"
              className="mt-2 max-h-48 overflow-auto border border-rule bg-paper-2 p-3 text-[11px] text-ink-2"
              style={{ whiteSpace: 'pre-wrap' }}
            >
              {error.message}
              {error.stack && '\n\n' + error.stack.split('\n').slice(0, 8).join('\n')}
            </pre>
          </details>
        )}
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <button type="button" onClick={reset} className="btn-ink text-sm">
            حاول مرة ثانية
          </button>
          <Link href="/" className="btn-outline text-sm">
            العودة للرئيسية
          </Link>
        </div>
      </div>
    </main>
  );
}
