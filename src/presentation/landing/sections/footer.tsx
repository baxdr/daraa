export function LandingFooter() {
  return (
    <footer className="relative border-t border-rule bg-paper-2/60">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-8 text-xs text-muted md:flex-row md:items-center md:px-10">
        <div>
          <span className="font-display text-sm font-bold text-ink">درع</span>
          <span className="mx-2">·</span>
          مستشار التأسيس والامتثال السعودي
        </div>
        <div className="max-w-md text-[11px] leading-relaxed">
          مبني على الأنظمة الرسمية للجهات السعودية · بدر العمري · سفر الدوسري
        </div>
      </div>
    </footer>
  );
}
