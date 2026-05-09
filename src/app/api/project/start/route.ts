import { NextResponse } from 'next/server';
import { z } from 'zod';
import { waitUntil } from '@vercel/functions';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { runProjectOrchestrator } from '@/agents/project-orchestrator';
import { enforceRateLimit } from '@/infrastructure/rate-limit/rate-limit';
import { startProject } from '@/core/use-cases';
import { isDomainError } from '@/core/errors';
import { getAuthPrincipal } from '@/infrastructure/auth/get-principal';

export const runtime = 'nodejs';
export const maxDuration = 300;

const BodySchema = z.object({ sessionId: z.string().min(1) });

/**
 * POST /api/project/start
 *
 * Thin HTTP adapter around the StartProject use-case. Validation, mode/vertical
 * resolution, and persistence live in `core/use-cases/start-project.use-case.ts`.
 */
export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'project-start', max: 10, windowMs: 60_000 });
  if (limited) return limited;

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
  const parsed = BodySchema.safeParse(json);
  if (!parsed.success) return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });

  const repos = getRepositories();
  const principal = await getAuthPrincipal();

  try {
    const project = await startProject(
      { chatSessions: repos.chatSessions, projects: repos.projects },
      { sessionId: parsed.data.sessionId, principal },
    );

    // Keep the lambda alive while the orchestrator runs after the response
    // has been sent. Without waitUntil, Vercel can reap the function as
    // soon as we return the JSON below, killing the pipeline mid-flight.
    waitUntil(
      runProjectOrchestrator(project.id).catch((err) => {
        console.error('[project/start] orchestrator rejected:', err);
      }),
    );

    return NextResponse.json({ projectId: project.id, status: 'pending' });
  } catch (err) {
    return mapDomainError(err);
  }
}

function mapDomainError(err: unknown): NextResponse {
  if (!isDomainError(err)) {
    console.error('[project/start] unexpected error:', err);
    return NextResponse.json({ error: 'خطأ غير متوقع' }, { status: 500 });
  }
  switch (err.code) {
    case 'not_found':
      return NextResponse.json({ error: 'جلسة غير معروفة' }, { status: 404 });
    case 'validation_failed':
      return NextResponse.json({ error: arabicForValidation(err.message) }, { status: 400 });
    default:
      return NextResponse.json({ error: 'طلب غير صالح' }, { status: 400 });
  }
}

function arabicForValidation(message: string): string {
  if (message.includes('not complete')) return 'المحادثة لم تكتمل بعد';
  if (message.includes('mode')) return 'لم يُحدَّد نوع المسار';
  if (message.includes('vertical')) return 'نوع النشاط غير معروف';
  if (message.includes('company name')) return 'اسم المشروع مفقود';
  return 'طلب غير صالح';
}
