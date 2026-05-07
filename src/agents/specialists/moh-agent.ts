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

    // Branch 1 — vertical sanity check.
    const isSalon = context.vertical === 'salon';

    // Branch 2 — first license vs renewal framing.
    const isRenewal = context.mode === 'operational_compliance';

    const requirements: string[] = [
      'شهادات صحية سارية لكل العاملين (تجدد سنوياً)',
      'تعقيم أدوات القص والتجميل بأنظمة معتمدة (Autoclave مفضّل)',
      'تصريف صحي منفصل لمياه الحمامات + غرف العمليات',
      'دورة تدريبية معتمدة في الصحة العامة للمدير',
      'لوحة إرشادات الإسعافات الأولية في موقع ظاهر',
    ];
    if (!isSalon) {
      requirements.push('ملاحظة: الترخيص الصحي مرتبط بنشاط الصالون — راجع تطابق نشاطك المسجّل');
    }

    const explainAr = isRenewal
      ? 'تجديد الترخيص الصحي السنوي يتطلب فحص ميداني + تحديث الشهادات الصحية للعاملين. لا تنتظر آخر شهر.'
      : 'الصالون يتعامل مع البشرة والشعر — الوزارة تتأكد من النظافة وتعقيم الأدوات وتأهيل الكادر قبل منح الترخيص.';

    const outbox: AgentMessage[] = [
      {
        from: 'moh',
        to: 'ALL',
        type: 'data_share',
        payload: { healthLicenseRequired: isSalon, isRenewal },
        messageAr: isSalon
          ? 'الترخيص الصحي إلزامي قبل التشغيل — رتّب الفحص الميداني مع البلدية بالتنسيق.'
          : 'الترخيص الصحي مرتبط بنشاط الصالون — تحقّق من أن نشاطك المسجّل يتطلبه فعلاً.',
      },
      {
        from: 'moh',
        to: 'mohr_gosi',
        type: 'dependency',
        payload: { staffNeedHealthCerts: true },
        messageAr:
          'كل عامل في الصالون يحتاج شهادة صحية سارية — لا توظف بدونها وضع التحقق ضمن إجراءات الـ onboarding.',
      },
      {
        from: 'moh',
        to: 'document',
        type: 'data_share',
        payload: { inspectionChecklist: true },
        messageAr:
          'قبل زيارة المفتش — يجهّز وكيل المستندات قائمة جاهزية تشمل التعقيم، الشهادات، التهوية، ومخزن الأدوات.',
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
        estimatedTimeAr: isRenewal ? 'تجديد سنوي — ابدأ قبل انتهاء الترخيص بشهر' : '٧ إلى ١٤ يوم',
        officialUrl: 'https://www.moh.gov.sa',
        renewalPeriodAr: 'سنوي',
        requirements,
        commonMistakeAr:
          'كثير من الصالونات تفوّت تجديد الشهادات الصحية للعاملين — وقتها يتعطّل العمل لأسبوعين بسبب توقّف الترخيص.',
      },
      outbox,
    };
  }
}
