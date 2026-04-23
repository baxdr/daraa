import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * SFDA — activates only when Municipality hands off a pending licence
 * message. Returns blocked otherwise — a real dependency read, not just
 * `deps: ['municipality']`.
 */
export class SfdaAgent implements Agent {
  readonly id: AgentId = 'sfda';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  async run(_context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const municipalitySignal = inbox.find(
      (m) =>
        m.from === 'municipality' &&
        m.type === 'dependency' &&
        typeof m.payload?.municipalityLicense === 'string',
    );
    if (!municipalitySignal) {
      return {
        status: 'blocked',
        reason: 'لم نستلم رقم رخصة البلدية من متخصّص البلدية',
      };
    }

    return {
      status: 'complete',
      data: {
        entityId: 'sfda',
        nameAr: 'الهيئة العامة للغذاء والدواء',
        nameSimpleAr: 'ترخيص الغذاء (SFDA)',
        explainAr:
          'بما إنك تقدم أكل ومشروبات — هالجهة تتأكد إن المكان نظيف وآمن صحياً. ' +
          'المفتش يزور الموقع ويفحص مطابقة الاشتراطات.',
        estimatedCostSar: { min: 1000, max: 3000 },
        estimatedTimeAr: '٧ إلى ١٤ يوم',
        officialUrl: 'https://sfda.gov.sa',
        renewalPeriodAr: 'سنوي',
        requirements: [
          'مطابقة مواصفات تجهيز المطبخ (إن وجد)',
          'شهادات صحية سارية للعاملين',
          'نظام تبريد للمواد سريعة التلف',
          'خطة سلامة غذائية (HACCP مبسّط)',
        ],
      },
      outbox: [],
    };
  }
}
