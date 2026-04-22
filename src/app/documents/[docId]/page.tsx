import { notFound } from 'next/navigation';
import { getDocument } from '@/lib/document-store';
import { PolicyDocumentView } from '@/components/policy-document';

export const dynamic = 'force-dynamic';

export default function DocumentPage({ params }: { params: { docId: string } }) {
  const doc = getDocument(params.docId);
  if (!doc) notFound();
  return <PolicyDocumentView doc={doc} />;
}
