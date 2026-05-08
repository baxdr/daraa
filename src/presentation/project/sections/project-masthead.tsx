import Link from 'next/link';
import { StatusModeIndicator } from './status-mode-indicator';

interface ProjectMastheadProps {
  projectId: string;
  companyName: string;
  verticalLabel: string;
  cityLabel: string | null;
  url: string | null;
  isCompliance: boolean;
  isOperational: boolean;
}

export function ProjectMasthead({
  projectId,
  companyName,
  verticalLabel,
  cityLabel,
  url,
  isCompliance,
  isOperational,
}: ProjectMastheadProps) {
  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="مسار التنقّل" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          درع
        </Link>
        <span aria-hidden>›</span>
        <Link href="/chat" className="hover:text-ink">
          المحادثة
        </Link>
        <span aria-hidden>›</span>
        <Link href={`/project/${projectId}/agents`} className="hover:text-ink">
          الوكلاء
        </Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">
          {isOperational ? 'الامتثال التشغيلي' : isCompliance ? 'تقرير الامتثال' : 'خريطة التأسيس'}
        </span>
      </nav>

      {/* Masthead */}
      <header className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="pill border-accent/30 bg-accent-soft text-[11px] font-bold tracking-widest text-accent-strong">
                {isOperational
                  ? '◉ الامتثال التشغيلي'
                  : isCompliance
                    ? '◉ تقرير الامتثال'
                    : '◉ خريطة التأسيس'}
              </span>
              <StatusModeIndicator
                mode={isOperational ? 'operational' : isCompliance ? 'compliance' : 'establishment'}
              />
            </div>
            <h1 className="font-display text-4xl font-extrabold leading-[1.08] tracking-tighter md:text-6xl">
              {companyName}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-2">
              <span>{verticalLabel}</span>
              {cityLabel && (
                <>
                  <span className="text-rule">·</span>
                  <span>{cityLabel}</span>
                </>
              )}
              {url && (
                <>
                  <span className="text-rule">·</span>
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    dir="ltr"
                    className="border-b border-rule pb-0.5 font-mono text-xs hover:border-accent hover:text-accent"
                  >
                    {url}
                  </a>
                </>
              )}
            </div>
          </div>
          <Link
            href="/"
            className="shrink-0 border border-rule bg-white px-4 py-2 text-xs font-semibold text-ink-2 hover:border-ink hover:text-ink"
          >
            مشروع جديد +
          </Link>
        </div>
      </header>
    </>
  );
}
