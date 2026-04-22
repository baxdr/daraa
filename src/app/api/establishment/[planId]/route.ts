import { NextResponse } from 'next/server';
import { getPlan } from '@/lib/plan-store';

export const runtime = 'nodejs';

export async function GET(
  _req: Request,
  { params }: { params: { planId: string } },
) {
  const plan = getPlan(params.planId);
  if (!plan) return NextResponse.json({ error: 'الخطة غير موجودة' }, { status: 404 });

  return NextResponse.json({
    planId: plan.id,
    status: plan.status,
    vertical: plan.vertical,
    verticalLabelAr: plan.verticalLabelAr,
    activities: plan.activities,
    messages: plan.messages,
    errorMessage: plan.errorMessage ?? null,
  });
}
