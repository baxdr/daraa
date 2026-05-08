import Link from 'next/link';

export function PrivateProjectNotice({ projectId }: { projectId: string }) {
  return (
    <main className="mx-auto flex min-h-[80vh] max-w-xl flex-col items-center justify-center px-6 py-20 text-center">
      <span className="eyebrow">مشروع خاص</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight md:text-4xl">
        هذا المشروع لا يخصّك
      </h1>
      <p className="mt-4 text-sm leading-relaxed text-ink-2">
        مالك هذا المشروع حفظه في حسابه الخاص — يحتاج يشاركه معك مباشرةً عبر دعوة من حسابه. لو كان
        المشروع لك، سجّل الدخول من الحساب اللي حفظته فيه.
      </p>
      <p className="mt-3 font-mono text-xs text-muted">
        المعرّف: <code dir="ltr">{projectId}</code>
      </p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/" className="btn-outline">
          العودة للرئيسية
        </Link>
        <Link href="/auth/login" className="btn-ink">
          تسجيل الدخول
          <span aria-hidden className="ms-2">
            ←
          </span>
        </Link>
      </div>
    </main>
  );
}
