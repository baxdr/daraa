import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/chat-sessions';
import { createProject } from '@/lib/project-store';
import { runProjectOrchestrator } from '@/agents/project-orchestrator';
import { enforceRateLimit } from '@/lib/rate-limit';
import { VERTICALS, type VerticalId } from '@/knowledge/entities';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({ sessionId: z.string().min(1) });

/**
 * POST /api/project/start
 *
 * Unified entry point for both establishment and compliance paths. The
 * session's collected answers determine which mode runs; a single
 * orchestrator handles both and produces a ProjectRecord the client can
 * poll via GET /api/project/[projectId].
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

  const session = getSession(parsed.data.sessionId);
  if (!session) return NextResponse.json({ error: 'جلسة غير معروفة' }, { status: 404 });
  if (session.currentQuestion !== null) {
    return NextResponse.json({ error: 'المحادثة لم تكتمل بعد' }, { status: 400 });
  }

  const answers = session.answers;
  const mode = answers.q0_mode;
  if (!mode) {
    return NextResponse.json({ error: 'لم يُحدَّد نوع المسار' }, { status: 400 });
  }

  // Determine vertical. For establishment, the user picked explicitly.
  // For compliance, we map q1_company_type onto the existing VerticalId
  // union — SaaS / fintech / other ecommerce all → 'tech' or 'services'.
  const vertical: VerticalId = resolveVertical(answers);
  if (!VERTICALS[vertical]) {
    return NextResponse.json({ error: 'نوع النشاط غير معروف' }, { status: 400 });
  }

  const companyName = (answers.q_company_name ?? '').trim();
  if (!companyName) {
    return NextResponse.json({ error: 'اسم المشروع مفقود' }, { status: 400 });
  }
  // URL source depends on mode: digital compliance uses q8, operational uses op10.
  const url = mode === 'operational_compliance'
    ? (answers.op10_website_url ?? null)
    : (answers.q8_website_url ?? null);
  const cityId = answers.est2_city ?? answers.op2_city;

  const project = createProject({
    mode,
    vertical,
    companyName,
    cityId,
    url,
    answers,
  });

  // Fire-and-forget. Client polls /api/project/[id] for progress.
  void runProjectOrchestrator(project.id).catch((err) => {
    console.error('[project/start] orchestrator rejected:', err);
  });

  return NextResponse.json({ projectId: project.id, status: 'pending' });
}

type ResolveInput = {
  q0_mode?: 'establishment' | 'compliance' | 'operational_compliance';
  est1_vertical?: VerticalId;
  q1_company_type?: 'saas' | 'ecommerce' | 'fintech' | 'services' | 'other';
  op1_vertical?: 'restaurant' | 'salon' | 'construction' | 'retail';
};
function resolveVertical(answers: ResolveInput): VerticalId {
  if (answers.q0_mode === 'establishment') {
    return (answers.est1_vertical ?? 'tech') as VerticalId;
  }
  if (answers.q0_mode === 'operational_compliance') {
    // Operational verticals map 1:1 to the establishment vertical set,
    // with `retail` folded to `services` (closest existing vertical).
    switch (answers.op1_vertical) {
      case 'restaurant':   return 'restaurant';
      case 'salon':        return 'salon';
      case 'construction': return 'construction';
      case 'retail':       return 'services';
      default:             return 'services';
    }
  }
  // Digital compliance — map q1 to closest vertical.
  switch (answers.q1_company_type) {
    case 'saas':      return 'tech';
    case 'fintech':   return 'tech';
    case 'ecommerce': return 'services';
    case 'services':  return 'tech';
    case 'other':     return 'tech';
    default:          return 'tech';
  }
}
