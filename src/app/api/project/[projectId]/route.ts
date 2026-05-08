import { NextResponse } from 'next/server';
import { getRepositories } from '@/infrastructure/persistence/persistence-router';
import { getAuthPrincipal } from '@/infrastructure/auth/get-principal';
import { checkProjectReadAccess } from '@/infrastructure/auth/check-project-access';
import { ForbiddenError, UnauthorizedError } from '@/core/errors';

export const runtime = 'nodejs';

export async function GET(_req: Request, { params }: { params: { projectId: string } }) {
  try {
    const repos = getRepositories();
    const p = await repos.projects.findById(params.projectId);
    if (!p) return NextResponse.json({ error: 'المشروع غير موجود' }, { status: 404 });

    const principal = await getAuthPrincipal();
    try {
      checkProjectReadAccess(principal, p);
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return NextResponse.json({ error: 'يجب تسجيل الدخول' }, { status: 401 });
      }
      if (e instanceof ForbiddenError) {
        return NextResponse.json({ error: 'لا تملك صلاحية الوصول لهذا المشروع' }, { status: 403 });
      }
      throw e;
    }

    return NextResponse.json({
      projectId: p.id,
      mode: p.mode,
      status: p.status,
      companyName: p.companyName,
      vertical: p.vertical,
      cityId: p.cityId,
      url: p.url,
      activities: p.activities,
      messages: p.messages,
      entities: p.entities,
      roadmap: p.roadmap,
      costSummary: p.costSummary,
      topWarnings: p.topWarnings,
      regulatoryUpdates: p.regulatoryUpdates,
      complianceScore: p.complianceScore ?? null,
      totalFineCeilingSar: p.totalFineCeilingSar ?? null,
      gaps: p.gaps ?? null,
      analysis: p.analysis ?? null,
      scanResult: p.scanResult ?? null,
      operationalReport: p.operationalReport ?? null,
      email: p.email ?? null,
      errorMessage: p.errorMessage ?? null,
    });
  } catch (err) {
    // Any unexpected throw is surfaced as a stable 500 so the polling
    // client can retry with backoff instead of hanging on a hard error.
    console.error('[api/project/GET] unexpected error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'خطأ داخلي' }, { status: 500 });
  }
}
