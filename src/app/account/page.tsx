/**
 * Account dashboard page.
 * Lists workspaces and projects owned by the user.
 * Provides actions to delete projects or the entire account.
 */

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/infrastructure/auth/supabase-auth';
import { getRepositoriesForRequest } from '@/infrastructure/persistence/persistence-router';
// TODO(phase-7): use ProjectCard once the components/projects list is wired.
// import { ProjectCard } from '@/app/account/components/project-card';
import { DeleteAccountButton } from '@/app/account/components/delete-account-button';

export const metadata = {
  title: 'حسابي — درع',
  description: 'إدارة حسابك ومشاريعك',
};

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Get user's workspaces and projects
  const repos = await getRepositoriesForRequest();
  // TODO(phase-7): show workspace name + projects list. For now we just
  // verify the workspace lookup runs successfully under RLS.
  await repos.workspaces.findPrimaryForUser(user.id);

  // TODO: Query projects in workspace more efficiently
  // For now, this is a stub that would list projects

  return (
    <div className="space-y-8 px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="border-b border-gray-200 pb-8">
        <h1 className="text-3xl font-bold text-gray-900">حسابي</h1>
        <p className="mt-2 text-gray-600">مرحباً، {user.email}</p>
      </div>

      {/* Workspaces Section */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-gray-900">مشاريعي</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* TODO: Map workspace projects */}
          <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
            <p className="text-gray-500">لا توجد مشاريع حالياً</p>
            <a
              href="/"
              className="mt-4 inline-block text-sm font-semibold text-blue-600 hover:underline"
            >
              ابدأ مشروع جديد
            </a>
          </div>
        </div>
      </section>

      {/* Account Settings */}
      <section className="border-t border-gray-200 pt-8">
        <h2 className="mb-4 text-xl font-semibold text-gray-900">إعدادات الحساب</h2>
        <div className="space-y-4 rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900">البريد الإلكتروني</h3>
              <p className="mt-1 text-sm text-gray-600">{user.email}</p>
            </div>
          </div>

          <hr className="border-gray-200" />

          <div>
            <h3 className="font-medium text-gray-900">حذف الحساب</h3>
            <p className="mt-1 text-sm text-gray-600">
              حذف حسابك بشكل دائم مع جميع بيانات مشاريعك. هذا الإجراء لا يمكن التراجع عنه.
            </p>
            <div className="mt-4">
              <DeleteAccountButton />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
