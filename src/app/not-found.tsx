import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center">
        <div className="font-display text-[10px] font-extrabold uppercase tracking-[0.24em] text-muted">
          404
        </div>
        <h1 className="mt-4 font-display text-5xl font-extrabold leading-tight tracking-tighter md:text-6xl">
          ما لقينا الصفحة
        </h1>
        <div className="mx-auto my-6 h-px w-24 bg-accent" />
        <p className="text-base leading-relaxed text-ink-2">
          الرابط اللي تبحث عنه إما منتهي الصلاحية أو ما كان موجود من البداية.
          الجلسات والخطط عندنا تُحفظ لساعة واحدة فقط.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-ink text-sm">
            العودة للرئيسية
          </Link>
          <Link href="/chat" className="btn-outline text-sm">
            ابدأ استشارة جديدة
          </Link>
        </div>
      </div>
    </main>
  );
}
