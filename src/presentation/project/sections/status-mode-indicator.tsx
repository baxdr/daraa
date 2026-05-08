/**
 * Single-mode badge for the project masthead.
 *
 * Post-pivot the platform only ships `operational_compliance`, so the
 * indicator shows a fixed pill. Kept as a component so future modes
 * (if any) plug in cleanly.
 */
export function StatusModeIndicator() {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded border border-accent/30 bg-accent-soft px-2 py-1 text-[11px] font-bold tracking-widest text-accent-strong"
      role="status"
      aria-label="الحالة: مراقبة تشغيلية"
    >
      <span aria-hidden className="h-2 w-2 rounded-full bg-current" />
      مراقبة تشغيلية
    </span>
  );
}
