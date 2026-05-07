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

    // Branch 1 — vertical relevance (restaurant has full requirements, others optional).
    const isRestaurant = context.vertical === 'restaurant';

    // Branch 2 — first issuance vs renewal.
    const isRenewal = context.mode === 'operational_compliance';

    const requirements: string[] = [
      'مطابقة مواصفات تجهيز المطبخ (مواد، أسطح، مغاسل)',
      'شهادات صحية سارية لكل عامل غذائي (يومياً يدخل مطبخ)',
      'نظام تبريد للمواد سريعة التلف (≤4°م) + مراقبة درجات الحرارة',
      'خطة سلامة غذائية HACCP مبسّط (نقاط حرجة موثّقة)',
      'سجل دخول/خروج المخزون مع تواريخ الصلاحية',
    ];
    if (!isRestaurant) {
      requirements.push('ملاحظة: SFDA مرتبط أساساً بالأنشطة الغذائية — راجع تطابق نشاطك');
    }

    const explainAr = isRenewal
      ? 'التجديد السنوي للـ SFDA يتطلب فحص ميداني للمطبخ + تحديث الشهادات الصحية. لا تتأخر — توقف الترخيص يعني إغلاق فوري.'
      : 'بما إنك تقدم أكل ومشروبات — الهيئة تتأكد إن المكان نظيف وآمن صحياً. المفتش يزور الموقع ويفحص مطابقة الاشتراطات.';

    const outbox: AgentMessage[] = [
      {
        from: 'sfda',
        to: 'ALL',
        type: 'data_share',
        payload: {
          sfdaRequired: isRestaurant,
          isRenewal,
        },
        messageAr: isRestaurant
          ? 'ترخيص SFDA إلزامي قبل التشغيل — جهّز المطبخ ومستندات HACCP قبل زيارة المفتش.'
          : 'SFDA مرتبط بالأنشطة الغذائية أساساً — راجع نشاطك المسجّل قبل التقديم.',
      },
      {
        from: 'sfda',
        to: 'mohr_gosi',
        type: 'dependency',
        payload: { foodHandlerCertsRequired: true },
        messageAr:
          'كل عامل في المطبخ يحتاج شهادة صحية للعاملين الغذائيين — أضفها في إجراءات التوظيف.',
      },
      {
        from: 'sfda',
        to: 'document',
        type: 'data_share',
        payload: { templateNeeded: 'haccp_plan_simplified' },
        messageAr:
          'يجهّز وكيل المستندات خطة HACCP مبسّطة جاهزة للتعديل — ضع نقاطك الحرجة قبل الفحص.',
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
        estimatedTimeAr: isRenewal ? 'تجديد سنوي — ابدأ قبل الانتهاء بشهر' : '٧ إلى ١٤ يوم',
        officialUrl: 'https://sfda.gov.sa',
        renewalPeriodAr: 'سنوي',
        requirements,
        commonMistakeAr:
          'كثير من المطاعم تفاجأ بفحص HACCP — جهّز نقاط التحكم الحرجة (التبريد، الطبخ، التخزين) موثّقة قبل الزيارة.',
      },
      outbox,
    };
  }
}
