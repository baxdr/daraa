'use client';

/**
 * Global error boundary — catches errors in the root layout itself. This
 * renders an isolated <html> since the root layout has failed. Keep it
 * self-contained with inline styles so we don't depend on Tailwind loading.
 */

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F7F3EB',
          color: '#14110F',
          fontFamily: 'system-ui, sans-serif',
          padding: '1.5rem',
        }}
      >
        <div style={{ maxWidth: '40rem', textAlign: 'center' }}>
          <div style={{ fontSize: 11, letterSpacing: '0.24em', color: '#9B2C2C', fontWeight: 800 }}>
            FATAL ERROR
          </div>
          <h1 style={{ margin: '1rem 0', fontSize: '2rem', fontWeight: 800 }}>
            صار خطأ جوهري في التطبيق
          </h1>
          <p style={{ color: '#3A342E', lineHeight: 1.7, margin: '1rem 0' }}>
            المنصة واجهت خطأ أدى لتعطّل الصفحة الرئيسية. جرّب إعادة التحميل.
          </p>
          {error.digest && (
            <p style={{ fontFamily: 'monospace', fontSize: 11, color: '#635A4E' }}>
              المعرّف: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: '1.5rem',
              padding: '0.75rem 1.5rem',
              background: '#14110F',
              color: '#F7F3EB',
              border: 0,
              fontWeight: 700,
              cursor: 'pointer',
              borderRadius: 4,
            }}
          >
            إعادة التحميل
          </button>
        </div>
      </body>
    </html>
  );
}
