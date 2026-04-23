import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * ZATCA — tax registration. Reads the MCI broadcast and emits a tax-ready
 * signal which the e-invoicing agent picks up in the next wave.
 */
export class ZatcaAgent implements Agent {
  readonly id: AgentId = 'zatca';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(_context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار السجل التجاري' };
    }

    return {
      status: 'complete',
      data: {
        entityId: 'zatca',
        nameAr: 'هيئة الزكاة والضريبة والجمارك',
        nameSimpleAr: 'التسجيل الضريبي',
        explainAr:
          'تسجّل ضريبياً عشان تصدر فواتير رسمية. التسجيل شرط لكل شركة ولإصدار فواتير القيمة المضافة.',
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'يوم واحد (إلكتروني)',
        officialUrl: 'https://zatca.gov.sa',
        renewalPeriodAr: 'سنوي',
      },
      outbox: [
        {
          from: 'zatca',
          to: 'zatca_einvoice',
          type: 'data_share',
          payload: { taxRegistered: true },
          messageAr: 'التسجيل الضريبي جاهز — تقدر تبدأ ربط الفوترة الإلكترونية (المرحلة الثانية).',
        },
      ],
    };
  }
}
