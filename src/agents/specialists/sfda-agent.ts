import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * SFDA (الهيئة العامة للغذاء والدواء) — restaurant/food specialist.
 * Activates only when Municipality hands off a pending licence message —
 * a real dependency read, not just `deps: ['municipality']`.
 *
 * Branches:
 *   - vertical (restaurant gets food rules; tech/salon gets a softer warning)
 *   - operational_compliance vs establishment (inspection-readiness vs renewal)
 *
 * Outbox:
 *   1. Broadcast SFDA status to ALL.
 *   2. Tell mohr_gosi about food-handler health certificate requirement.
 *   3. Tell document agent about the HACCP plan template to generate.
 */
export class SfdaAgent implements Agent {
  readonly id: AgentId = 'sfda';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
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

    const hasKitchen = context.vertical === 'restaurant' || context.vertical === 'coffee';

    const requirements: string[] = [
      'مطابقة مواصفات تجهيز المطبخ/منطقة التحضير (مواد، أسطح، مغاسل)',
      'شهادات صحية سارية لكل عامل يتعامل مع الغذاء',
      'نظام تبريد للمواد سريعة التلف (≤4°م) + مراقبة درجات الحرارة',
      'سجل دخول/خروج المخزون مع تواريخ الصلاحية',
    ];
    if (hasKitchen) {
      requirements.push('خطة سلامة غذائية HACCP مبسّط (نقاط حرجة موثّقة)');
    }

    const explainAr =
      'التجديد السنوي للـ SFDA يتطلب فحص ميداني للمنشأة + تحديث الشهادات الصحية. لا تتأخر — توقف الترخيص يعني إغلاق فوري.';

    const outbox: AgentMessage[] = [
      {
        from: 'sfda',
        to: 'mohr_gosi',
        type: 'dependency',
        payload: { foodHandlerCertsRequired: true },
        messageAr:
          'كل عامل يتعامل مع الغذاء يحتاج شهادة صحية للعاملين الغذائيين — أضفها في إجراءات التوظيف.',
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'sfda',
        nameAr: 'الهيئة العامة للغذاء والدواء',
        nameSimpleAr: 'ترخيص الغذاء (SFDA)',
        explainAr,
        estimatedCostSar: { min: 1_000, max: 3_000 },
        estimatedTimeAr: 'تجديد سنوي — ابدأ قبل الانتهاء بشهر',
        officialUrl: 'https://sfda.gov.sa',
        renewalMonths: 12,
        requirements,
        commonMistakeAr: hasKitchen
          ? 'كثير من المطاعم تفاجأ بفحص HACCP — جهّز نقاط التحكم الحرجة (التبريد، الطبخ، التخزين) موثّقة قبل الزيارة.'
          : 'تأكد من تواريخ صلاحية كل المنتجات على الرف قبل أي فحص ميداني — انتهاء الصلاحية أكثر أسباب المخالفات شيوعاً.',
      },
      outbox,
    };
  }
}
