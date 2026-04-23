import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Municipality — WAITS for Civil Defense's safetyCertReady message.
 *
 * Dependency-graph satisfaction alone isn't enough: even if Civil Defense
 * completed, we require the explicit payload `safetyCertReady: true` on
 * the inbox before we publish our own data. If it's missing (e.g. CD
 * errored), we block and surface that reason.
 */
export class MunicipalityAgent implements Agent {
  readonly id: AgentId = 'municipality';
  readonly dependencies: readonly AgentId[] = ['civil_defense'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const safetyCert = inbox.find(
      (m) =>
        m.from === 'civil_defense' &&
        m.type === 'dependency' &&
        m.payload?.safetyCertReady === true,
    );
    if (!safetyCert) {
      return {
        status: 'blocked',
        reason: 'لم نستلم تأكيد شهادة السلامة من متخصّص الدفاع المدني بعد',
      };
    }

    const cost = this.estimateCost(context.vertical);
    const licenceLabel = this.licenceLabel(context.vertical);

    const commonMistakeAr = context.leaseStatus === 'not_signed'
      ? 'لا تعتمد على وعد شفهي من المالك إن الموقع "يطلع له رخصة". تحقّق من منصة بلدي بنفسك قبل التوقيع.'
      : undefined;

    const outbox: AgentMessage[] = [
      {
        from: 'municipality',
        to: 'sfda',
        type: 'dependency',
        payload: { municipalityLicense: 'pending-issuance', licenceLabel },
        messageAr: `${licenceLabel} قيد الإصدار — تقدر تبدأ ترخيص الغذاء بالتوازي.`,
      },
      {
        from: 'municipality',
        to: 'moh',
        type: 'dependency',
        payload: { municipalityLicense: 'pending-issuance', licenceLabel },
        messageAr: `${licenceLabel} قيد الإصدار — تقدر تبدأ الترخيص الصحي.`,
      },
      {
        from: 'municipality',
        to: 'contractor_classification',
        type: 'dependency',
        payload: { municipalityLicense: 'pending-issuance', licenceLabel },
        messageAr: `${licenceLabel} قيد الإصدار — تقدر تبدأ التصنيف.`,
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'municipality',
        nameAr: 'أمانة المنطقة (بلدي)',
        nameSimpleAr: licenceLabel,
        explainAr:
          'الرخصة اللي تسمح لك تفتح محلك في الموقع. بدونها ما تقدر تشغّل النشاط رسمياً.',
        estimatedCostSar: cost,
        estimatedTimeAr: '٣ إلى ٧ أيام',
        officialUrl: 'https://balady.gov.sa',
        renewalPeriodAr: 'سنوي',
        commonMistakeAr,
      },
      outbox,
    };
  }

  private licenceLabel(vertical: AgentContext['vertical']): string {
    switch (vertical) {
      case 'restaurant':   return 'رخصة بلدية (نشاط غذائي)';
      case 'salon':        return 'رخصة بلدية (صالون / تجميل)';
      case 'construction': return 'رخصة مكتب مقاولات';
      default:             return 'رخصة البلدية';
    }
  }

  private estimateCost(vertical: AgentContext['vertical']): { min: number; max: number } {
    switch (vertical) {
      case 'restaurant':   return { min: 500, max: 3000 };
      case 'salon':        return { min: 500, max: 2000 };
      case 'construction': return { min: 500, max: 2000 };
      default:             return { min: 500, max: 2500 };
    }
  }
}
