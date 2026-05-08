import { notFound, redirect } from 'next/navigation';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { ProjectPageShell } from '@/presentation/project/page-shell';
import { ProjectErrorState } from '@/presentation/project/error-state';

export const dynamic = 'force-dynamic';

export default async function ProjectPage({ params }: { params: { projectId: string } }) {
  const repos = getRepositories();
  const project = await repos.projects.findById(params.projectId);
  if (!project) notFound();
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
  return <ProjectPageShell project={project} />;
}
