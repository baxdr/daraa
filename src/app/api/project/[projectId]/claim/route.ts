/**
 * POST /api/project/[projectId]/claim
 *
 * Claim an anonymous project for the currently authenticated user.
 * Idempotent: if the project is already owned by this user, returns ok.
 * If owned by someone else, returns 403.
 *
 * This is the "Save to my account" path for the in-page save banner.
 * The other path — magic-link claim — runs through /auth/callback after
 * the user signs in via email.
 */

import { NextResponse } from 'next/server';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { getAuthPrincipal } from '@/infrastructure/auth/get-principal';
import { enforceRateLimit } from '@/infrastructure/rate-limit/rate-limit';

export const runtime = 'nodejs';

export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const limited = enforceRateLimit(req, { bucket: 'project-claim', max: 20, windowMs: 60_000 });
  if (limited) return limited;

  const principal = await getAuthPrincipal();
  if (!principal) {
    return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
  }

  if (params.projectId.startsWith('demo-')) {
    return NextResponse.json({ error: 'مشاريع الديمو غير قابلة للملكية' }, { status: 403 });
  }

  const repos = getRepositories();
  const project = await repos.projects.findById(params.projectId);
  if (!project) {
    return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });
  }

  if (project.ownerUserId && project.ownerUserId !== principal.userId) {
    return NextResponse.json({ error: 'المشروع يخصّ شخصاً آخر' }, { status: 403 });
  }

  if (project.ownerUserId === principal.userId) {
    return NextResponse.json({ ok: true, alreadyOwned: true });
  }

  await repos.projects.update(project.id, { ownerUserId: principal.userId });
  return NextResponse.json({ ok: true, claimed: true });
}
