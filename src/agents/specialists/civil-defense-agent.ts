import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Civil Defense — tailors requirements to the vertical AND forwards the
 * physical-site signals (kitchen presence, floor) on the safety-cert
 * message so Municipality can reason about them in the next wave.
 *
 * Also absorbs any research-agent regulatory update addressed to
 * civil_defense and tags it as "new" on the requirement list.
 */
export class CivilDefenseAgent implements Agent {
  readonly id: AgentId = 'civil_defense';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mciSignal = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mciSignal) {
      return { status: 'blocked', reason: 'بانتظار إشعار جاهزية السجل التجاري' };
    }

    const requirements = this.requirementsFor(context.vertical);

    // Absorb any research update targeted at civil_defense.
    const updates = inbox.filter((m) => m.from === 'research' && m.type === 'update');
    for (const u of updates) {
      const summary = String(u.payload?.summary ?? u.messageAr ?? '').trim();
      if (summary) requirements.push(`جديد — ${summary.slice(0, 120)}`);
    }

    const cost = this.estimateCost(context.vertical);
    const estimatedTimeAr = '٣ إلى ١٤ يوم (يحتاج زيارة ميدانية)';

    const criticalWarningAr =
      context.vertical === 'restaurant' || context.vertical === 'salon'
        ? 'شهادة السلامة غالباً تسبق رخصة البلدية — تأكّد من التسلسل الصحيح لحيّك على منصة بلدي قبل التقديم.'
        : undefined;

    // Forward the kitchen/floor signals to Municipality.
    const hasKitchen = context.vertical === 'restaurant';
    const nonGroundFloor = false; // reserved — not collected yet in chat

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
          payload: {
            safetyCertReady: true,
            estimatedTimeAr,
            hasKitchen,
            nonGroundFloor,
          },
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
