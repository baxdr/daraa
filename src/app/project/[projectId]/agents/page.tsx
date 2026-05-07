import { notFound } from 'next/navigation';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { ProjectAgentsView } from '@/components/project-agents-view';

export const dynamic = 'force-dynamic';

export default async function ProjectAgentsPage({ params }: { params: { projectId: string } }) {
  const repos = getRepositories();
  const project = await repos.projects.findById(params.projectId);
  if (!project) notFound();
  return <ProjectAgentsView projectId={project.id} />;
}
