import Link from 'next/link';
import type { ProjectRecord } from '@/lib/project-store';

const MODE_LABEL: Record<ProjectRecord['mode'], string> = {
  establishment: 'تأسيس',
  compliance: 'فحص امتثال',
  operational_compliance: 'امتثال تشغيلي',
};

const MODE_STYLE: Record<ProjectRecord['mode'], string> = {
  establishment: 'border-accent/30 bg-accent-soft text-accent-strong',
  compliance: 'border-warn/30 bg-warn-soft text-warn-strong',
  operational_compliance: 'border-danger/30 bg-danger/5 text-danger',
};

const STATUS_LABEL: Record<ProjectRecord['status'], string> = {
  pending: 'قيد البدء',
  running: 'قيد المعالجة',
  complete: 'مكتمل',
  error: 'فشل',
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('ar-SA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ProjectRowCard({ project }: { project: ProjectRecord }) {
  const target =
    project.status === 'pending' || project.status === 'running'
      ? `/project/${project.id}/agents`
      : `/project/${project.id}`;

  return (
    <Link
      href={target}
      className="group block border border-rule bg-white p-5 transition-all hover:border-ink hover:shadow-card"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span
          className={`pill border text-[10px] font-bold tracking-widest ${MODE_STYLE[project.mode]}`}
        >
          {MODE_LABEL[project.mode]}
        </span>
        <span className="font-mono text-[11px] tabular-nums text-muted">
          {formatDate(project.createdAt)}
        </span>
      </div>
      <h3 className="mt-3 font-display text-xl font-extrabold tracking-tight text-ink">
        {project.companyName}
      </h3>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <span>الحالة: {STATUS_LABEL[project.status]}</span>
        {project.cityId && (
          <>
            <span aria-hidden className="text-rule">
              ·
            </span>
            <span>{project.cityId}</span>
          </>
        )}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs font-bold text-accent transition-all group-hover:gap-3">
        <span>افتح المشروع</span>
        <span aria-hidden>←</span>
      </div>
    </Link>
  );
}
