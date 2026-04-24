import { NextResponse } from 'next/server';
import { getProject } from '@/lib/project-store';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { projectId: string } },
) {
  try {
    const p = getProject(params.projectId);
    if (!p) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

    return NextResponse.json({
      projectId:         p.id,
      mode:              p.mode,
      status:            p.status,
      companyName:       p.companyName,
      vertical:          p.vertical,
      cityId:            p.cityId,
      url:               p.url,
      activities:        p.activities,
      messages:          p.messages,
      entities:          p.entities,
      roadmap:           p.roadmap,
      costSummary:       p.costSummary,
      topWarnings:       p.topWarnings,
      regulatoryUpdates: p.regulatoryUpdates,
      complianceScore:   p.complianceScore ?? null,
      totalFineCeilingSar: p.totalFineCeilingSar ?? null,
      gaps:              p.gaps ?? null,
      analysis:          p.analysis ?? null,
      scanResult:        p.scanResult ?? null,
      errorMessage:      p.errorMessage ?? null,
    });
  } catch (err) {
    // Any unexpected throw is surfaced as a stable 500 so the polling
    // client can retry with backoff instead of hanging on a hard error.
    console.error('[api/project/GET] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
