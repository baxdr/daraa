import Link from 'next/link';
import { ReturnLookup } from '@/presentation/components/return-lookup';

export const dynamic = 'force-dynamic';

export default function ReturnPage() {
  return (
    <main className="relative min-h-screen">
      <header className="relative mx-auto flex max-w-3xl items-center justify-between px-6 pt-6 md:px-10">
        <Link href="/" className="group flex items-center gap-2.5">
          <svg
            width="22"
            height="22"
            viewBox="0 0 34 34"
            aria-hidden="true"
            className="text-accent"
          >
            <path
              d="M17 3 L29 9 L29 19 Q29 27 17 31 Q5 27 5 19 L5 9 Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M11 17 L15 21 L23 13"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-display text-lg font-extrabold tracking-tight group-hover:text-accent">
            درع
          </span>
        </Link>
        <Link href="/chat" className="text-xs text-muted hover:text-ink">
          مشروع جديد +
        </Link>
      </header>

      <section className="mx-auto mt-16 max-w-xl px-6 md:mt-24 md:px-10">
        <span className="eyebrow">العودة لمشاريعك</span>
        <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight md:text-5xl">
          عندك مشروع؟
        </h1>
        <p className="mt-4 max-w-md text-base leading-relaxed text-ink-2 md:text-lg">
          أدخل بريدك الإلكتروني — نستعرض لك مشاريعك المحفوظة وتقدر ترجع لنفس الداشبورد بلا ما تعيد
          من البداية.
        </p>

        <div className="rule-accent my-8 w-16" />

        <ReturnLookup />

        <p className="mt-10 text-xs text-muted">
          ما لديك مشروع بعد؟{' '}
          <Link
            href="/chat"
            className="underline decoration-rule decoration-2 underline-offset-4 hover:text-ink hover:decoration-accent"
          >
            ابدأ الآن ←
          </Link>
        </p>
      </section>
    </main>
  );
}
