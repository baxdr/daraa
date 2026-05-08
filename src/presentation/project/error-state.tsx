import Link from 'next/link';

export function ProjectErrorState({ projectId, message }: { projectId: string; message?: string }) {
  return (
    <main className="mx-auto max-w-xl px-6 py-20 text-center">
      <span className="eyebrow">خطأ</span>
      <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight">
        تعذّر إكمال المشروع
      </h1>
      {message && <p className="mt-3 text-sm text-ink-2">{message}</p>}
      <p className="mt-3 font-mono text-xs text-muted">
        المعرّف: <code dir="ltr">{projectId}</code>
      </p>
      <Link href="/" className="btn-outline mt-8 inline-flex">
        ابدأ مشروع جديد
      </Link>
    </main>
  );
}
