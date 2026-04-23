import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Maroof — ecommerce-only merchant verification run by MCI. Depends on
 * the CR being issued.
 */
export class MaroofAgent implements Agent {
  readonly id: AgentId = 'maroof';
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
        entityId: 'maroof',
        nameAr: 'منصة معروف — وزارة التجارة',
        nameSimpleAr: 'توثيق المتجر (معروف)',
        explainAr:
          'توثيق المتجر الإلكتروني على منصة معروف — يزيد ثقة العملاء ويساعد في فضّ النزاعات.',
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'يوم واحد (إلكتروني)',
        officialUrl: 'https://maroof.sa',
        renewalPeriodAr: 'سنوي',
      },
      outbox: [],
    };
  }
}
