import Link from 'next/link';
import { ArrowLeft } from '../primitives/arrow-left';

export function Hero() {
  return (
    <section className="relative mx-auto max-w-6xl px-6 pb-16 pt-16 md:px-10 md:pb-24 md:pt-24">
      <div className="grid items-center gap-12 md:grid-cols-12">
        <div className="md:col-span-7">
          <h1 className="font-display text-5xl font-extrabold leading-[1.05] tracking-tighter text-ink md:text-6xl lg:text-7xl">
            <span className="block animate-fade-rise">أسّس شركتك بثقة،</span>
            <span
              className="block animate-fade-rise text-accent"
              style={{ animationDelay: '160ms' }}
            >
              وامتثل بذكاء
            </span>
          </h1>

          <div className="mt-8 max-w-xl animate-fade-rise" style={{ animationDelay: '320ms' }}>
            <div className="rule-accent mb-5 w-16" />
            <p className="text-lg leading-relaxed text-ink-2 md:text-xl">
              مستشار AI يرتّب لك ١١ جهة حكومية بالتسلسل الصحيح، ويفحص امتثالك لـ{' '}
              <span className="font-bold">PDPL</span> و <span className="font-bold">NCA</span> في
              ثوانٍ
            </p>
          </div>

          <div
            className="mt-10 flex animate-fade-rise flex-col gap-3 sm:flex-row sm:gap-4"
            style={{ animationDelay: '480ms' }}
          >
            <Link href="/chat" className="btn-ink text-base">
              أفتح شركة جديدة
              <ArrowLeft />
            </Link>
            <Link href="/chat?mode=compliance" className="btn-outline text-base">
              أفحص امتثال شركتي
              <ArrowLeft />
            </Link>
          </div>

          <p
            className="mt-6 animate-fade-rise text-xs text-muted"
            style={{ animationDelay: '600ms' }}
          >
            <span className="font-mono font-bold text-ink">١٩</span> وكيل AI · يفهم العربي الخليجي ·
            مجاني للتجربة
          </p>
        </div>

        <aside
          className="relative animate-fade-rise md:col-span-5"
          style={{ animationDelay: '700ms' }}
        >
          <div className="relative rounded-lg border border-rule bg-gradient-to-b from-white to-paper-2 p-8 md:p-10">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 animate-pulse rounded-full bg-accent" />
                <span className="text-sm text-ink-2">تحليل فوري</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-3/4 rounded bg-rule" />
                <div className="h-2 w-1/2 rounded bg-rule" />
              </div>
              <div className="mt-6 flex items-center gap-3">
                <div className="h-3 w-3 rounded-full bg-accent/50" />
                <span className="text-sm text-ink-2">١١ جهة حكومية</span>
              </div>
              <div className="space-y-2">
                <div className="h-2 w-full rounded bg-rule" />
                <div className="h-2 w-4/5 rounded bg-rule" />
              </div>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-muted">
            الوكلاء يعملون بالتوازي — تسلسل ذكي لأولويات جهاتك
          </p>
        </aside>
      </div>
    </section>
  );
}
