import type { NameCheckResult } from '@/agents/runtime/types';

function StatusIcon({ status }: { status: NameCheckResult['status'] }) {
  if (status === 'likely_available') {
    return (
      <svg aria-hidden className="h-5 w-5 shrink-0 text-accent" viewBox="0 0 20 20" fill="none">
        <path
          d="M5 10 L9 14 L15 7"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  if (status === 'likely_taken') {
    return (
      <svg aria-hidden className="h-5 w-5 shrink-0 text-danger" viewBox="0 0 20 20" fill="none">
        <path
          d="M6 6 L14 14 M14 6 L6 14"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  return (
    <svg aria-hidden className="h-5 w-5 shrink-0 text-ink-2" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 6 L10 11 M10 14 L10 14.01"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

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
            className={`mt-1 flex items-center gap-2 font-display text-xl font-extrabold tracking-tight md:text-2xl ${palette.accent}`}
          >
            <StatusIcon status={check.status} />
            <span>{palette.heading}</span>
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
        مبني على البحث الحيّ في سجلات الأسماء التجارية المنشورة.
      </p>
    </div>
  );
}
