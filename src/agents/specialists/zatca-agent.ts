import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * ZATCA specialist for a small physical shop.
 *
 * Tax registration is universal — every CR holder must register with ZATCA.
 * VAT only kicks in once annual revenue crosses 375,000 SAR; below that the
 * shop can defer registration but must opt in voluntarily once they cross.
 */
export class ZatcaAgent implements Agent {
  readonly id: AgentId = 'zatca';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(_context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار السجل التجاري من متخصّص التجارة' };
    }

    // Research agent may have broadcast a VAT-relevant update.
    const vatUpdate = inbox.find(
      (m) =>
        m.from === 'research' &&
        m.type === 'update' &&
        /فوترة|الفوترة|VAT|ضريبة/.test(String(m.payload?.summary ?? m.messageAr ?? '')),
    );

    const requirements: string[] = [
      'تسجيل المنشأة في بوابة ZATCA',
      'ربط عنوان وطني ورقم هوية مالك/مفوّض',
      'تسجيل VAT يصير إلزامي عند تجاوز ٣٧٥,٠٠٠ ريال إيراد سنوي',
    ];

    const explainAr =
      'كل محل تجاري يلزمه تسجيل ضريبي في ZATCA. ضريبة القيمة المضافة (VAT) تصير إلزامية عند تجاوز ٣٧٥ ألف ريال إيراد سنوي — نوصي بالتسجيل مبكّراً لتفادي متابعة ارتجاعية.';

    const commonMistakeAr = vatUpdate
      ? `تحديث جديد من ZATCA تجاهلته شركات كثيرة: ${String(vatUpdate.payload?.summary ?? vatUpdate.messageAr).slice(0, 160)}`
      : undefined;

    return {
      status: 'complete',
      data: {
        entityId: 'zatca',
        nameAr: 'هيئة الزكاة والضريبة والجمارك',
        nameSimpleAr: 'التسجيل الضريبي',
        explainAr,
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'يوم واحد (إلكتروني)',
        officialUrl: 'https://zatca.gov.sa',
        renewalMonths: null,
        requirements,
        ...(commonMistakeAr !== undefined ? { commonMistakeAr } : {}),
      },
      outbox: [],
    };
  }
}
