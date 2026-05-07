import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { generateDocument } from '@/agents/document-agent';
import { enforceRateLimit } from '@/infrastructure/rate-limit/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({
  scanId: z.string().min(1),
  docType: z.enum([
    'privacy_policy',
    'dpo_appointment',
    'processing_register',
    'incident_response',
  ]),
});

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'doc-gen', max: 15, windowMs: 60_000 });
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
  const project = await repos.projects.findById(parsed.data.scanId);
  if (!project) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

  try {
    const doc = await generateDocument(parsed.data.docType, project.answers, project.companyName);
    const stored = await repos.documents.create({ scanId: project.id, document: doc });
    return NextResponse.json({
      docId: stored.id,
      kind: stored.kind,
      fromFallback: stored.fromFallbackTemplate,
    });
  } catch (err) {
    // Log the real error server-side for debugging, but return a generic
    // Arabic message to the client so we don't leak prompt text or model
    // output fragments (parseJsonResponse can include up to 500 chars).
    console.error('[documents] generate failed:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'تعذّر توليد المستند — جرّب مرة أخرى.' }, { status: 500 });
  }
}
