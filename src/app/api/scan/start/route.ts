import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/chat-sessions';
import { createScan } from '@/lib/scan-store';
import { runOrchestrator } from '@/agents/orchestrator';
import { enforceRateLimit } from '@/lib/rate-limit';

export const runtime = 'nodejs';
// Fire-and-forget: the handler returns ~instantly after creating the scan
// record. The orchestrator runs in the background and writes activities +
// the final analysis into scan-store; the client polls /api/scan/[scanId]
// to observe progress.
export const maxDuration = 60;

const BodySchema = z.object({
  sessionId: z.string().min(1),
});

export async function POST(req: Request) {
  const limited = enforceRateLimit(req, { bucket: 'scan-start', max: 10, windowMs: 60_000 });
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

  const url = session.answers.q8_website_url ?? null;
  const scan = createScan(session.answers, url);

  // Fire-and-forget — the promise writes results into scan-store.
  // Unhandled rejections are logged inside runOrchestrator itself.
  void runOrchestrator(scan.id).catch((err) => {
    console.error('[scan/start] orchestrator rejected:', err);
  });

  return NextResponse.json({ scanId: scan.id, status: 'pending' });
}
