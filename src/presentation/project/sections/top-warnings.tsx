export function TopWarnings({ warnings }: { warnings: string[] }) {
  if (warnings.length === 0) return null;
  return (
    <section className="mb-10 space-y-4">
      {warnings.map((w, i) => (
        <div key={i} className="border-s-4 border-warn bg-warn-soft px-6 py-5">
          <div className="flex items-center gap-3">
            <span aria-hidden className="text-xl">
              ⚠️
            </span>
            <span className="font-display text-xl font-extrabold tracking-tight text-warn-strong">
              تنبيه مهم
            </span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-ink">{w}</p>
        </div>
      ))}
    </section>
  );
}
