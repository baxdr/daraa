import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * ZATCA Phase-2 (Fatoora) e-invoicing integration. Separate from the base
 * ZATCA registration — this is a technical onboarding, not a form.
 */
export class ZatcaEinvoiceAgent implements Agent {
  readonly id: AgentId = 'zatca_einvoice';
  readonly dependencies: readonly AgentId[] = ['zatca'];

  async run(_context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const zatcaSignal = inbox.find((m) => m.from === 'zatca' && m.payload?.taxRegistered === true);
    if (!zatcaSignal) {
      return { status: 'blocked', reason: 'بانتظار إنجاز التسجيل الضريبي الأساسي' };
    }

    return {
      status: 'complete',
      data: {
        entityId: 'zatca_einvoice',
        nameAr: 'ZATCA — الفوترة الإلكترونية (المرحلة الثانية)',
        nameSimpleAr: 'ربط الفوترة الإلكترونية',
        explainAr:
          'منصّتك تتربط تقنياً مع نظام ZATCA (Fatoora) — إصدار XML، ختم رقمي معتمد، ' +
          'وربط مباشر في المرحلة الثانية. هذا غير التسجيل الضريبي العادي.',
        estimatedCostSar: { min: 500, max: 3000 },
        estimatedTimeAr: '٧ إلى ١٤ يوم (تطوير + اعتماد)',
        officialUrl: 'https://zatca.gov.sa',
        renewalPeriodAr: 'مستمر',
        commonMistakeAr:
          'الربط ليس مجرد تسجيل — هو تطوير تقني فعلي في الـ POS أو نظام الفوترة، واختبار مع بيئة ZATCA التجريبية قبل الإنتاج.',
      },
      outbox: [],
    };
  }
}
