import type { Agent, AgentContext, AgentId, AgentResult } from '../runtime/types';

/**
 * MCI — وزارة التجارة.
 *
 * For a small physical shop, the CR is already issued (the user gave us its
 * date in `op3_cr_issue_date`). The agent surfaces the renewal cadence and
 * broadcasts the CR-ready signal so downstream specialists know they can
 * cite it (Civil Defense + Municipality both reference the CR).
 */
export class MciAgent implements Agent {
  readonly id: AgentId = 'mci';
  readonly dependencies: readonly AgentId[] = [];

  async run(_context: AgentContext): Promise<AgentResult> {
    return {
      status: 'complete',
      data: {
        entityId: 'mci',
        nameAr: 'وزارة التجارة',
        nameSimpleAr: 'السجل التجاري',
        explainAr:
          'السجل التجاري — الوثيقة الأم لأي نشاط، يُجدَّد سنوياً. عدم تجديده يوقف باقي الخدمات الحكومية.',
        estimatedCostSar: { min: 200, max: 400 },
        estimatedTimeAr: 'يوم واحد (إلكتروني عبر منصة الأعمال)',
        officialUrl: 'https://mc.gov.sa',
        renewalMonths: 12,
        requirements: [
          'هوية وطنية سارية للمالك',
          'اسم تجاري مسجَّل',
          'تحديث النشاط في المنشأة لو تغيّر',
        ],
      },
      outbox: [
        {
          from: 'mci',
          to: 'ALL',
          type: 'data_share',
          payload: { crReady: true },
          messageAr: 'السجل التجاري قائم — تقدرون تعتمدون على رقم السجل في بقية الطلبات.',
        },
      ],
    };
  }
}
