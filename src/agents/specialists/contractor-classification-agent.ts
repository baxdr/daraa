import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Contractor classification (تصنيف المقاولين) from MOMRAH — construction
 * only. Requires a working municipality licence first (office licence).
 */
export class ContractorClassificationAgent implements Agent {
  readonly id: AgentId = 'contractor_classification';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  async run(_context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const municipality = inbox.find(
      (m) =>
        m.from === 'municipality' &&
        m.type === 'dependency' &&
        typeof m.payload?.municipalityLicense === 'string',
    );
    if (!municipality) {
      return { status: 'blocked', reason: 'بانتظار رخصة مكتب البلدية' };
    }

    return {
      status: 'complete',
      data: {
        entityId: 'contractor_classification',
        nameAr: 'تصنيف المقاولين — وزارة الشؤون البلدية والقروية والإسكان',
        nameSimpleAr: 'شهادة التصنيف',
        explainAr:
          'التصنيف يحدد الفئات والحدود المالية للمشاريع اللي تقدر تاخذها — خصوصاً ' +
          'للمشاريع الحكومية. بدون تصنيف، المنافسة على مشاريع كبيرة محدودة جداً.',
        estimatedCostSar: { min: 1000, max: 5000 },
        estimatedTimeAr: '١٤ إلى ٣٠ يوم',
        officialUrl: 'https://momrah.gov.sa',
        renewalPeriodAr: 'كل 3 سنوات',
        commonMistakeAr:
          'التصنيف يتطلب إثبات كفاءات فنية وإدارية ورأس مال — جهّز المستندات مسبقاً لتقليل دورات الاستكمال.',
      },
      outbox: [],
    };
  }
}
