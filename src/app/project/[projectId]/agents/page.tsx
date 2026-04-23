import { notFound } from 'next/navigation';
import { getProject } from '@/lib/project-store';
import { ProjectAgentsView } from '@/components/project-agents-view';

export const dynamic = 'force-dynamic';

export default function ProjectAgentsPage({ params }: { params: { projectId: string } }) {
  const project = getProject(params.projectId);
  if (!project) notFound();
  return <ProjectAgentsView projectId={project.id} />;
}
