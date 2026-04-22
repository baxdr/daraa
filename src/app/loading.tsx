/**
 * Default loading UI for any route segment that doesn't override it.
 * Intentionally minimal — Next.js shows this during server-side data fetching.
 */
export default function Loading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
      aria-label="جاري التحميل"
    >
      <div className="flex items-center gap-3 text-muted">
        <span className="h-2 w-2 animate-pulse-subtle rounded-full bg-accent" aria-hidden />
        <span className="font-display text-sm font-extrabold tracking-tight">جاري التحميل…</span>
      </div>
    </div>
  );
}
