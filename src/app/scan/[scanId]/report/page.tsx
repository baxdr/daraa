import { redirect } from 'next/navigation';

export default function LegacyReportRedirect({ params }: { params: { scanId: string } }) {
  redirect(`/project/${params.scanId}`);
}
