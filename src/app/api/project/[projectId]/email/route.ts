import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProject, updateProject } from '@/lib/project-store';
import { enforceRateLimit } from '@/lib/rate-limit';

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
 */
export async function POST(
  req: Request,
  { params }: { params: { projectId: string } },
) {
  const limited = enforceRateLimit(req, { bucket: 'project-email', max: 20, windowMs: 60_000 });
  if (limited) return limited;

  const project = getProject(params.projectId);
  if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

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
  updateProject(project.id, { email: normalized });
  return NextResponse.json({ ok: true, email: normalized });
}
