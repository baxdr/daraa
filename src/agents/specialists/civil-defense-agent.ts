import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Civil Defense — reads the MCI broadcast and tailors requirements to the
 * vertical. Returns a structured list + sends a `safetyCertReady` message
 * for Municipality to observe.
 */
export class CivilDefenseAgent implements Agent {
  readonly id: AgentId = 'civil_defense';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    // Real inbox read — not a hardcoded branch. If MCI's data_share didn't
    // arrive, we block, and the orchestrator retries us in the next wave
    // once messages flow.
    const mciSignal = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mciSignal) {
      return { status: 'blocked', reason: 'بانتظار إشعار جاهزية السجل التجاري' };
    }

    const requirements = this.requirementsFor(context.vertical);
    const cost = this.estimateCost(context.vertical);
    const estimatedTimeAr = '٣ إلى ١٤ يوم (يحتاج زيارة ميدانية)';

    const criticalWarningAr =
      context.vertical === 'restaurant' || context.vertical === 'salon'
        ? 'شهادة السلامة غالباً تسبق رخصة البلدية — تأكّد من التسلسل الصحيح لحيّك على منصة بلدي قبل التقديم.'
        : undefined;

    return {
      status: 'complete',
      data: {
        entityId: 'civil_defense',
        nameAr: 'الدفاع المدني',
        nameSimpleAr: 'شهادة السلامة',
        explainAr:
          'يفحصون محلك ويتأكدون إن متطلبات السلامة مطبّقة — طفايات، مخارج طوارئ، كواشف دخان، ' +
          'وإجراءات خاصة حسب طبيعة النشاط.',
        estimatedCostSar: cost,
        estimatedTimeAr,
        officialUrl: 'https://www.998.gov.sa',
        renewalPeriodAr: 'سنوي',
        criticalWarningAr,
        requirements,
      },
      outbox: [
        {
          from: 'civil_defense',
          to: 'municipality',
          type: 'dependency',
          payload: { safetyCertReady: true, estimatedTimeAr },
          messageAr: 'شهادة السلامة جاهزة للإصدار — تقدر تبدأ طلب رخصة البلدية.',
        },
      ],
    };
  }

  private requirementsFor(vertical: AgentContext['vertical']): string[] {
    const base = [
      'طفايات حريق بعدد يناسب المساحة',
      'مخارج طوارئ واضحة ومضاءة',
      'كواشف دخان عاملة',
      'لوحات إرشادية (مخرج، طفاية، نقطة تجمع)',
      'صندوق إسعافات أولية',
    ];
    switch (vertical) {
      case 'restaurant':
        return [...base, 'نظام إطفاء تلقائي للمطبخ', 'غطاء شفط مقاوم للحريق'];
      case 'salon':
        return [...base, 'تهوية مناسبة لمنع تراكم أبخرة المواد الكيميائية'];
      case 'construction':
        return [...base, 'خطة إخلاء للمكتب + تدريب دوري'];
      default:
        return base;
    }
  }

  private estimateCost(vertical: AgentContext['vertical']): { min: number; max: number } {
    switch (vertical) {
      case 'restaurant':   return { min: 200, max: 1000 };
      case 'salon':        return { min: 200, max: 800 };
      case 'construction': return { min: 150, max: 500 };
      default:             return { min: 200, max: 700 };
    }
  }
}
