import type { NameCheckResult } from '@/agents/runtime/types';

function bannerPalette(check: NameCheckResult, companyName: string) {
  if (check.status === 'likely_available') {
    return {
      wrap: 'border-accent bg-accent-soft',
      accent: 'text-accent-strong',
      heading: `الاسم "${companyName}" — متاح على الأرجح`,
    };
  }
  if (check.status === 'likely_taken') {
    return {
      wrap: 'border-danger bg-danger/5',
      accent: 'text-danger',
      heading: `الاسم "${companyName}" — يبدو محجوزاً`,
    };
  }
  return {
    wrap: 'border-ink bg-paper-2',
    accent: 'text-ink-2',
    heading: `الاسم "${companyName}" — الفحص غير حاسم`,
  };
}

export function TradeNameBanner({
  check,
  companyName,
}: {
  check: NameCheckResult;
  companyName: string;
}) {
  const palette = bannerPalette(check, companyName);

  return (
    <div className={`border-s-4 px-6 py-5 ${palette.wrap}`}>
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <div className="eyebrow !text-[10px]">نتيجة فحص الاسم التجاري</div>
          <h2
            className={`mt-1 font-display text-xl font-extrabold tracking-tight md:text-2xl ${palette.accent}`}
          >
            {palette.heading}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink">{check.summaryAr}</p>
        </div>
        <a
          href="https://mc.gov.sa"
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 text-xs font-semibold text-accent underline decoration-rule decoration-2 underline-offset-4 hover:decoration-accent"
        >
          افتح mc.gov.sa ↗
        </a>
      </div>

      {check.alternatives && check.alternatives.length > 0 && (
        <div className="mt-4 border-t border-rule/70 pt-3">
          <div className="font-mono text-[11px] tracking-widest text-muted">بدائل مقترحة</div>
          <ul className="mt-2 flex flex-wrap gap-2">
            {check.alternatives.map((alt, i) => (
              <li
                key={i}
                className="border border-ink/20 bg-white px-3 py-1 text-sm font-semibold text-ink"
              >
                {alt}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-3 text-[11px] text-muted">
        نتيجة استرشادية — القرار النهائي لاسم المنشأة يحدد في منصة الأعمال.
      </p>
    </div>
  );
}
