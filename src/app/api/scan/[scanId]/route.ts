import { NextResponse } from 'next/server';
import { getScan } from '@/lib/scan-store';

export const runtime = 'nodejs';

/** GET /api/scan/:scanId — returns status, analysis (when complete), errors. */
export async function GET(
  _req: Request,
  { params }: { params: { scanId: string } },
) {
  const scan = getScan(params.scanId);
  if (!scan) return NextResponse.json({ error: 'الفحص غير موجود' }, { status: 404 });

  return NextResponse.json({
    scanId: scan.id,
    status: scan.status,
    url: scan.url,
    activities: scan.activities,
    messages: scan.messages,
    analysis: scan.analysis ?? null,
    errorMessage: scan.errorMessage ?? null,
    degradedMode: scan.analysis?.degradedMode ?? false,
    scanSkipped: scan.analysis?.scanSkipped ?? (scan.url === null),
  });
}
