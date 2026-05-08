import Link from 'next/link';
import { DaraaMark } from '../primitives/daraa-mark';

export function NavHeader() {
  return (
    <>
      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 pt-6 md:px-10">
        <div className="flex items-center gap-3">
          <DaraaMark />
          <div className="leading-tight">
            <div className="font-display text-xl font-extrabold tracking-tight">درع</div>
            <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted">
              DARAA
            </div>
          </div>
        </div>
        <nav className="hidden items-center gap-6 text-sm text-ink-2 md:flex">
          <a href="#how" className="hover:text-ink">
            كيف يشتغل
          </a>
          <a href="#scenarios" className="hover:text-ink">
            السيناريوهات
          </a>
          <Link href="/agents" className="hover:text-ink">
            الوكلاء
          </Link>
          <Link href="/knowledge" className="hover:text-ink">
            قاعدة المعرفة
          </Link>
          <Link href="/return" className="hover:text-ink">
            مشاريعي
          </Link>
          <Link
            href="/auth/login"
            className="border border-ink px-3 py-1.5 text-xs font-bold tracking-wide text-ink hover:bg-ink hover:text-paper"
          >
            دخول
          </Link>
        </nav>
      </header>
      <div className="mx-auto mt-6 max-w-6xl px-6 md:px-10">
        <div className="rule animate-rule-draw" />
      </div>
    </>
  );
}
