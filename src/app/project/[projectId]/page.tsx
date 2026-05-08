import { notFound, redirect } from 'next/navigation';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { getAuthPrincipal } from '@/infrastructure/auth/get-principal';
import { checkProjectReadAccess } from '@/infrastructure/auth/check-project-access';
import { ForbiddenError, UnauthorizedError } from '@/core/errors';
import { ProjectPageShell } from '@/presentation/project/page-shell';
import { ProjectErrorState } from '@/presentation/project/error-state';
import { PrivateProjectNotice } from '@/presentation/project/private-project-notice';

export const dynamic = 'force-dynamic';

const AUTH_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const repos = getRepositories();
  const project = await repos.projects.findById(params.projectId);
  if (!project) notFound();

  const principal = await getAuthPrincipal();
  try {
    checkProjectReadAccess(principal, project);
  } catch (e) {
    if (e instanceof UnauthorizedError) {
      redirect(`/auth/login?next=/project/${project.id}`);
    }
    if (e instanceof ForbiddenError) {
      return <PrivateProjectNotice projectId={project.id} />;
    }
    throw e;
  }

  if (project.status === 'pending' || project.status === 'running') {
    redirect(`/project/${project.id}/agents`);
  }
  if (project.status === 'error') {
    return (
      <ProjectErrorState
        projectId={project.id}
        {...(project.errorMessage !== undefined ? { message: project.errorMessage } : {})}
      />
    );
  }
  return (
    <ProjectPageShell
      project={project}
      viewerUserId={principal?.userId ?? null}
      authEnabled={AUTH_ENABLED}
    />
  );
}
