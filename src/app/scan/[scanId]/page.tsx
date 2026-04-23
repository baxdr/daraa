import { redirect } from 'next/navigation';

export default function LegacyScanRedirect({ params }: { params: { scanId: string } }) {
  redirect(`/project/${params.scanId}/agents`);
}
