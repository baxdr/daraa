import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Ministry of Health — salon-only specialist. Waits for the Municipality
 * licence handoff before issuing the health permit.
 *
 * Branches:
 *   - salon vertical assertion (warn if context.vertical isn't salon)
 *   - operational_compliance vs establishment (renewal vs first issuance)
 *
 * Outbox:
 *   1. Broadcast health-license status to ALL.
 *   2. Tell mohr_gosi about staff health-cert requirement (interacts with hiring).
 *   3. Tell document agent about the inspection-readiness checklist.
 */
export class MohAgent implements Agent {
  readonly id: AgentId = 'moh';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const municipality = inbox.find(
      (m) =>
        m.from === 'municipality' &&
        m.type === 'dependency' &&
        typeof m.payload?.municipalityLicense === 'string',
    );
    if (!municipality) {
      return { status: 'blocked', reason: 'بانتظار رخصة البلدية قبل الترخيص الصحي' };
    }

    const isSalon = context.vertical === 'salon';

    const requirements: string[] = isSalon
      ? [
          'شهادات صحية سارية لكل العاملين (تجدد سنوياً)',
          'تعقيم أدوات القص والتجميل بأنظمة معتمدة (Autoclave مفضّل)',
          'تصريف صحي منفصل لمياه الحمامات + غرف العمليات',
          'دورة تدريبية معتمدة في الصحة العامة للمدير',
          'لوحة إرشادات الإسعافات الأولية في موقع ظاهر',
        ]
      : [
          'شهادات صحية سارية لكل العاملين في تحضير وتقديم الطعام',
          'فصل مساحة التحضير عن منطقة العملاء',
          'صرف صحي للنفايات الغذائية',
          'برنامج تنظيف يومي موثّق',
        ];

    const explainAr = isSalon
      ? 'تجديد الترخيص الصحي السنوي يتطلب فحص ميداني + تحديث الشهادات الصحية للعاملين. لا تنتظر آخر شهر.'
      : 'الترخيص الصحي للمطاعم يكمّل ترخيص SFDA — يركّز على نظافة الأماكن المشتركة والتدريب الصحي للعاملين.';

    const outbox: AgentMessage[] = [
      {
        from: 'moh',
        to: 'mohr_gosi',
        type: 'dependency',
        payload: { staffNeedHealthCerts: true },
        messageAr:
          'كل عامل يحتاج شهادة صحية سارية — لا توظف بدونها وضع التحقق ضمن إجراءات الـ onboarding.',
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'moh',
        nameAr: 'وزارة الصحة',
        nameSimpleAr: 'الترخيص الصحي',
        explainAr,
        estimatedCostSar: { min: 500, max: 2_000 },
        estimatedTimeAr: 'تجديد سنوي — ابدأ قبل انتهاء الترخيص بشهر',
        officialUrl: 'https://www.moh.gov.sa',
        renewalMonths: 12,
        requirements,
        commonMistakeAr: isSalon
          ? 'كثير من الصالونات تفوّت تجديد الشهادات الصحية للعاملين — وقتها يتعطّل العمل لأسبوعين بسبب توقّف الترخيص.'
          : 'الشهادات الصحية للعاملين تُجدَّد سنوياً — موظف بدون شهادة سارية يكفي لإيقاف نشاط المطعم.',
      },
      outbox,
    };
  }
}
