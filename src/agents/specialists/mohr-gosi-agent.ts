import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * MOHR + GOSI combined — opens the establishment file (MOHR) and sets up
 * GOSI subscriptions. One specialist covers both because the workflows
 * are coupled in practice (you can't register employees in GOSI until
 * the MOHR file exists).
 */
export class MohrGosiAgent implements Agent {
  readonly id: AgentId = 'mohr_gosi';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(_context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار جاهزية السجل التجاري' };
    }

    return {
      status: 'complete',
      data: {
        entityId: 'mohr_gosi',
        nameAr: 'وزارة الموارد البشرية + التأمينات الاجتماعية',
        nameSimpleAr: 'ملف المنشأة + تأمينات',
        explainAr:
          'فتح ملف منشأة في وزارة الموارد البشرية (مطلوب لتوظيف أي شخص سعودي أو غير سعودي) ' +
          'وتسجيل الاشتراك في التأمينات الاجتماعية.',
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'يوم واحد (إلكتروني لكل الخطوتين)',
        officialUrl: 'https://www.hrsd.gov.sa',
        renewalPeriodAr: 'اشتراك شهري (تأمينات)',
        requirements: [
          'رقم السجل التجاري',
          'عنوان وطني للمنشأة',
          'تحديد نسبة التوطين المستهدفة',
        ],
      },
      outbox: [],
    };
  }
}
