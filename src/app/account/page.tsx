/**
 * Account dashboard page.
 *
 * Lists all projects owned by the authenticated user.
 * Demo mode (no Supabase env): redirect to /auth/login → which itself
 * renders the demo notice.
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { getRepositoriesForRequest } from '@/infrastructure/persistence/persistence-router';
import { AccountPageShell } from '@/presentation/account/page-shell';

export const metadata = {
  title: 'حسابي — درع',
  description: 'إدارة حسابك ومشاريعك',
};

export const dynamic = 'force-dynamic';

const SUPABASE_ENABLED = Boolean(
  process.env['NEXT_PUBLIC_SUPABASE_URL'] && process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'],
);

export default async function AccountPage({
  searchParams,
}: {
  searchParams: { claimed?: string };
}) {
  if (!SUPABASE_ENABLED) {
    redirect('/auth/login');
  }

  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login?next=/account');
  }

  const repos = await getRepositoriesForRequest();
  const projects = await repos.projects.findByOwner(user.id);

  return (
    <AccountPageShell
      userEmail={user.email ?? ''}
      projects={projects}
      claimed={searchParams.claimed === '1'}
    />
  );
}
