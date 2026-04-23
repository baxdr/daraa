import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Ministry of Health — salon-only. Waits for the Municipality licence
 * handoff before issuing the health permit.
 */
export class MohAgent implements Agent {
  readonly id: AgentId = 'moh';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  async run(_context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const municipality = inbox.find(
      (m) =>
        m.from === 'municipality' &&
        m.type === 'dependency' &&
        typeof m.payload?.municipalityLicense === 'string',
    );
    if (!municipality) {
      return { status: 'blocked', reason: 'بانتظار رخصة البلدية قبل الترخيص الصحي' };
    }

    return {
      status: 'complete',
      data: {
        entityId: 'moh',
        nameAr: 'وزارة الصحة',
        nameSimpleAr: 'الترخيص الصحي',
        explainAr:
          'الصالونات تتعامل مع البشرة والشعر — الوزارة تتأكد من النظافة وتعقيم الأدوات ' +
          'وتأهيل الكادر قبل منح الترخيص.',
        estimatedCostSar: { min: 500, max: 2000 },
        estimatedTimeAr: '٧ إلى ١٤ يوم',
        officialUrl: 'https://www.moh.gov.sa',
        renewalPeriodAr: 'سنوي',
        requirements: [
          'شهادات صحية للعاملين',
          'تعقيم أدوات القص/التجميل',
          'تصريف مياه منفصل للحمامات',
          'دورة تدريبية في الصحة العامة للمدير',
        ],
      },
      outbox: [],
    };
  }
}
