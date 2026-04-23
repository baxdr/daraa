import { redirect } from 'next/navigation';

/**
 * Legacy path — redirect to the unified project URL. Any old link still
 * works, but the planId is treated as a projectId (new runs always use
 * /project/[id] directly so the lookup will 404 if it was a real old plan).
 */
export default function LegacyEstablishmentRedirect({ params }: { params: { planId: string } }) {
  redirect(`/project/${params.planId}`);
}
