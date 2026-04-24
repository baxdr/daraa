import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getProjectsByEmail } from '@/lib/project-store';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';

const BodySchema = z.object({
  email: z.string().email({ message: 'أدخل بريداً إلكترونياً صحيحاً' }).max(200),
});

/**
 * POST /api/projects/by-email
 *
 * Return-by-email lookup. Rate-limited to prevent enumeration — we don't
 * leak which addresses have projects, we just return the user's own list.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'projects-by-email', max: 10, windowMs: 60_000 });
  if (limited) return limited;

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

  const projects = getProjectsByEmail(parsed.data.email);
  return NextResponse.json({
    count: projects.length,
    projects: projects.map((p) => ({
      id: p.id,
      createdAt: p.createdAt,
      mode: p.mode,
      status: p.status,
      companyName: p.companyName,
      vertical: p.vertical,
    })),
  });
}
