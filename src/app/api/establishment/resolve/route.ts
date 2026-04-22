import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/chat-sessions';
import { VERTICALS, type VerticalId } from '@/knowledge/entities';
import { createPlan } from '@/lib/plan-store';
import { runEstablishmentOrchestrator } from '@/agents/establishment-orchestrator';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const maxDuration = 60;

const BodySchema = z.object({ sessionId: z.string().min(1) });

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'est-resolve', max: 10, windowMs: 60_000 });
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
  if (session.answers.q0_mode !== 'establishment') {
    return NextResponse.json({ error: 'هذه الجلسة ليست لمسار التأسيس' }, { status: 400 });
  }

  const verticalId = session.answers.est1_vertical as VerticalId | undefined;
  if (!verticalId) return NextResponse.json({ error: 'نوع المشروع غير محدد' }, { status: 400 });

  const vertical = VERTICALS[verticalId];
  const plan = createPlan({
    vertical: verticalId,
    verticalLabelAr: vertical.labelAr,
    verticalShipsInMvp: vertical.shipsInMvp,
    answers: session.answers,
  });

  // Fire-and-forget orchestrator — client polls /api/establishment/[planId].
  void runEstablishmentOrchestrator(plan.id).catch((err) => {
    console.error('[establishment/resolve] orchestrator rejected:', err);
  });

  return NextResponse.json({ planId: plan.id, status: 'pending' });
}
