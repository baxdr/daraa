import { notFound } from 'next/navigation';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { PolicyDocumentView } from '@/presentation/components/policy-document';

export const dynamic = 'force-dynamic';

export default async function DocumentPage({ params }: { params: { docId: string } }) {
  const repos = getRepositories();
  const doc = await repos.documents.findById(params.docId);
  if (!doc) notFound();
  return <PolicyDocumentView doc={doc} />;
}
