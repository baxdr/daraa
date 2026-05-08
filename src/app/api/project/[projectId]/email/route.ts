import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { enforceRateLimit } from '@/infrastructure/rate-limit/rate-limit';
import { getAuthPrincipal } from '@/infrastructure/auth/get-principal';

export const runtime = 'nodejs';

const BodySchema = z.object({
  email: z.string().email({ message: 'أدخل بريداً إلكترونياً صحيحاً' }).max(200),
});

/**
 * POST /api/project/[projectId]/email
 *
 * Attach an email to an existing project so the user can retrieve it later
 * via /return. Idempotent — calling again with the same email is a no-op,
 * with a different email rewrites the attachment.
 *
 * Access policy:
 * - Demo projects (`demo-*`): forbidden (immutable)
 * - Anonymous projects (no owner): any visitor may attach an email — this
 *   is the first step of the save-and-claim flow
 * - Owned projects: only the owner may rewrite the email
 */
export async function POST(req: Request, { params }: { params: { projectId: string } }) {
  const limited = enforceRateLimit(req, { bucket: 'project-email', max: 20, windowMs: 60_000 });
  if (limited) return limited;

  const repos = getRepositories();
  const project = await repos.projects.findById(params.projectId);
  if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

  if (project.id.startsWith('demo-')) {
    return NextResponse.json({ error: 'مشاريع الديمو لا تُعدّل' }, { status: 403 });
  }

  if (project.ownerUserId) {
    const principal = await getAuthPrincipal();
    if (!principal) {
      return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
    }
    if (principal.userId !== project.ownerUserId) {
      return NextResponse.json({ error: 'لا تملك صلاحية تعديل هذا المشروع' }, { status: 403 });
    }
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? 'طلب غير صالح';
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const normalized = parsed.data.email.trim().toLowerCase();
  await repos.projects.update(project.id, { email: normalized });
  return NextResponse.json({ ok: true, email: normalized });
}
