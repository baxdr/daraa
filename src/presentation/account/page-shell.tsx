import Link from 'next/link';
import type { ProjectRecord } from '@/lib/project-store';
import { DeleteAccountButton } from '@/app/account/components/delete-account-button';
import { ProjectRowCard } from './project-row-card';

interface AccountPageShellProps {
  userEmail: string;
  projects: readonly ProjectRecord[];
  claimed: boolean;
}

export function AccountPageShell({ userEmail, projects, claimed }: AccountPageShellProps) {
  return (
    <main className="mx-auto max-w-5xl px-6 py-12 md:px-10 md:py-16">
      <nav aria-label="مسار التنقّل" className="mb-6 flex items-center gap-2 text-xs text-muted">
        <Link href="/" className="hover:text-ink">
          درع
        </Link>
        <span aria-hidden>›</span>
        <span className="font-medium text-ink-2">حسابي</span>
      </nav>

      <header className="mb-10">
        <span className="eyebrow">حسابي · Personal Workspace</span>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-[1.1] tracking-tighter md:text-5xl">
          أهلاً، {userEmail}
        </h1>
        <div className="rule-accent mt-6 w-16" />
        <p className="mt-6 max-w-2xl text-sm leading-relaxed text-ink-2">
          كل مشاريعك المحفوظة بحسابك. خاصة لك — لن يقدر أي زائر يفتحها بالرابط بدون تسجيل دخول.
        </p>
      </header>

      {claimed && (
        <div className="mb-8 border-s-2 border-accent bg-accent-soft px-5 py-3">
          <span className="text-sm font-semibold text-accent-strong">
            ✓ تم ربط مشاريعك السابقة بحسابك بنجاح.
          </span>
        </div>
      )}

      <section className="mb-12">
        <div className="mb-6 flex items-baseline justify-between">
          <h2 className="font-display text-2xl font-extrabold tracking-tight md:text-3xl">
            مشاريعي
          </h2>
          <span className="font-mono text-xs tabular-nums text-muted">
            {projects.length.toString().padStart(2, '0')} مشروع
          </span>
        </div>
        <div className="rule mb-6" />

        {projects.length === 0 ? (
          <div className="border border-dashed border-rule bg-paper-2/40 px-8 py-16 text-center">
            <h3 className="font-display text-2xl font-extrabold tracking-tight text-ink">
              لا توجد مشاريع بعد
            </h3>
            <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink-2">
              ابدأ مشروعك الأول — حدّد ما إذا كنت تأسّس شركة جديدة أو تفحص امتثال شركة قائمة. يقدر
              المنصة تحفظ المشروع تلقائياً في حسابك.
            </p>
            <Link href="/chat" className="btn-ink mt-6 inline-flex text-sm">
              ابدأ مشروع جديد
              <span aria-hidden className="ms-2">
                ←
              </span>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {projects.map((p) => (
              <ProjectRowCard key={p.id} project={p} />
            ))}
          </div>
        )}
      </section>

      <section className="border-t border-rule pt-10">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">إعدادات الحساب</h2>
        <div className="rule mt-3" />

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="border border-rule bg-white p-6">
            <div className="eyebrow !text-[10px]">البريد الإلكتروني</div>
            <p className="mt-2 font-mono text-sm" dir="ltr">
              {userEmail}
            </p>
          </div>

          <div className="border border-rule bg-white p-6">
            <div className="eyebrow !text-[10px]">تسجيل الخروج</div>
            <p className="mt-2 text-xs text-ink-2">إنهاء جلسة هذا المتصفح والعودة للزائر العام.</p>
            <Link href="/auth/logout" className="btn-outline mt-3 inline-flex text-xs">
              خروج
            </Link>
          </div>
        </div>

        <div className="mt-6 border-s-2 border-danger bg-danger/5 p-6">
          <div className="eyebrow !text-[10px] !text-danger">منطقة خطرة</div>
          <h3 className="mt-2 font-display text-lg font-extrabold tracking-tight text-ink">
            حذف الحساب نهائياً
          </h3>
          <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-2">
            حذف حسابك يحذف معه جميع مشاريعك المحفوظة. هذا الإجراء لا يمكن التراجع عنه — وفقاً للمادة
            25 من نظام حماية البيانات الشخصية (PDPL) لك الحق في الإتلاف.
          </p>
          <div className="mt-4">
            <DeleteAccountButton />
          </div>
        </div>
      </section>
    </main>
  );
}
