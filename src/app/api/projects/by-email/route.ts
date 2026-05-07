import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { enforceRateLimit } from '@/lib/rate-limit';
import { lookupProjectsByEmail } from '@/core/use-cases';
import { isDomainError } from '@/core/errors';

export const runtime = 'nodejs';

const BodySchema = z.object({
  email: z.string().email({ message: 'أدخل بريداً إلكترونياً صحيحاً' }).max(200),
});

/**
 * POST /api/projects/by-email
 *
 * Thin HTTP adapter around the LookupProjectsByEmail use-case.
 * Rate-limited to defeat email enumeration.
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

  try {
    const projects = await lookupProjectsByEmail(
      { projects: getRepositories().projects },
      { email: parsed.data.email },
    );
    return NextResponse.json({ count: projects.length, projects });
  } catch (err) {
    if (isDomainError(err) && err.code === 'validation_failed') {
      return NextResponse.json({ error: 'أدخل بريداً إلكترونياً صحيحاً' }, { status: 400 });
    }
    console.error('[projects/by-email] unexpected error:', err);
    return NextResponse.json({ error: 'خطأ غير متوقع' }, { status: 500 });
  }
}
