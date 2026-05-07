import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * ZATCA specialist.
 *
 * Behavior changes with the entity type that MCI broadcast. Partial company
 * (مؤسسة فردية) can defer VAT registration until revenue crosses the
 * 375k SAR threshold. LLC has to register from day one. This is real
 * inbox-driven reasoning — the payload MCI attaches to its broadcast
 * determines what ZATCA's requirements list looks like.
 */
export class ZatcaAgent implements Agent {
  readonly id: AgentId = 'zatca';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار السجل التجاري من متخصّص التجارة' };
    }
    const entityType = typeof mci.payload.entityType === 'string' ? mci.payload.entityType : '';
    const isSoleProprietor = entityType.includes('مؤسسة فردية');

    // Research agent may have broadcast a VAT-relevant update.
    const vatUpdate = inbox.find(
      (m) =>
        m.from === 'research' &&
        m.type === 'update' &&
        /فوترة|الفوترة|VAT|ضريبة/.test(String(m.payload?.summary ?? m.messageAr ?? '')),
    );

    // Compose requirements based on entity type + mode.
    const requirements: string[] = [
      'تسجيل المنشأة في بوابة ZATCA',
      'ربط عنوان وطني ورقم هوية مالك/مفوّض',
    ];
    if (isSoleProprietor) {
      requirements.push('تسجيل VAT يصير إلزامي عند تجاوز ٣٧٥,٠٠٠ ريال إيراد سنوي');
    } else {
      requirements.push(
        'تسجيل VAT إلزامي من اليوم الأول — الشركات ذات المسؤولية المحدودة لا يعفى عنها حد الإيراد',
      );
    }

    const explainAr = isSoleProprietor
      ? 'مؤسستك الفردية تسجّل في ZATCA، لكن VAT يصير إلزامي بس لو تجاوز إيرادك السنوي 375 ألف ريال. نوصي بالتسجيل مبكّراً لتفادي المتابعة الارتجاعية.'
      : 'بما إن شركتك ذ.م.م — التسجيل الضريبي وتسجيل ضريبة القيمة المضافة (VAT) إلزاميان من البداية. لا يعفى عنها حد الإيراد.';

    const commonMistakeAr = vatUpdate
      ? `تحديث جديد من ZATCA تجاهلته شركات كثيرة: ${String(vatUpdate.payload?.summary ?? vatUpdate.messageAr).slice(0, 160)}`
      : undefined;

    // Compliance mode: we don't check a real tax filing status (no API). But
    // we surface the same data with a renewal-flavoured framing.
    const estimatedTimeAr =
      context.mode === 'compliance'
        ? 'اشتراك سنوي مستمر — تأكّد من حالة التسجيل'
        : 'يوم واحد (إلكتروني)';

    return {
      status: 'complete',
      data: {
        entityId: 'zatca',
        nameAr: 'هيئة الزكاة والضريبة والجمارك',
        nameSimpleAr: 'التسجيل الضريبي',
        explainAr,
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr,
        officialUrl: 'https://zatca.gov.sa',
        renewalPeriodAr: 'سنوي',
        requirements,
        ...(commonMistakeAr !== undefined ? { commonMistakeAr } : {}),
      },
      outbox: [
        {
          from: 'zatca',
          to: 'zatca_einvoice',
          type: 'data_share',
          payload: { taxRegistered: true, entityType, vatRequired: !isSoleProprietor },
          messageAr: isSoleProprietor
            ? 'التسجيل الضريبي جاهز — VAT اختياري الآن، يصير إلزامي عند تجاوز حد الإيراد.'
            : 'التسجيل الضريبي جاهز + VAT إلزامي — ابدأ ربط الفوترة الإلكترونية (المرحلة الثانية).',
        },
      ],
    };
  }
}
