import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Customs / Import-Export specialist.
 *
 * Covers FASAH (clearance), Saber (CoC), GS1 (barcodes), HS-codes.
 * Required for businesses dealing in physical goods that cross borders.
 *
 * Branches:
 *   - vertical (ecommerce/construction expected; others advisory)
 *   - foreign partner flag (could indicate cross-border procurement)
 *
 * Outbox:
 *   1. Broadcast import-export readiness to ALL.
 *   2. Tell zatca about excise/customs duties to track.
 *   3. Tell document agent about CoC + commercial-invoice templates.
 */
export class CustomsAgent implements Agent {
  readonly id: AgentId = 'customs';
  readonly dependencies: readonly AgentId[] = ['mci', 'zatca'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    const zatca = inbox.find((m) => m.from === 'zatca' && m.payload?.taxRegistered === true);
    if (!mci || !zatca) {
      return { status: 'blocked', reason: 'بانتظار جاهزية السجل التجاري والتسجيل الضريبي' };
    }

    // Branch 1 — vertical drives prominence.
    const isImportHeavy = context.vertical === 'services' || context.vertical === 'construction';

    // Branch 2 — foreign partner often implies international procurement.
    const foreignPartner = context.hasForeignPartner === true;

    const requirements: string[] = [
      'فتح حساب FASAH للتخليص الجمركي (مجاني إلكترونياً)',
      'توكيل مخلّص جمركي معتمد لأول 3-6 شحنات حتى تتعلّم الإجراءات',
      'منصة Saber لتسجيل المنتجات المستوردة + شهادة المطابقة (CoC) لكل شحنة',
      'باركود GS1 لكل منتج مستورد قبل العرض في المتاجر',
      'تصنيف HS Code دقيق لكل منتج (تأكّد من المخلّص قبل أول شحنة)',
    ];
    if (foreignPartner) {
      requirements.push(
        'مراجعة اتفاقيات تجنّب الازدواج الضريبي مع بلد الشريك الأجنبي قبل اعتماد التحويلات',
      );
    }

    const explainAr = isImportHeavy
      ? 'كل ما تحتاجه لاستيراد البضائع: حساب FASAH للتخليص، Saber لتسجيل المنتجات، شهادة مطابقة CoC لكل شحنة، وباركود GS1 لكل منتج. تجاهل أي خطوة = شحنة مرفوضة في الميناء.'
      : 'حتى لو الاستيراد ليس نشاطك الأساسي، أي شحنة عبر الحدود تحتاج FASAH + CoC. خطّط لها من البداية لو في احتمال.';

    const outbox: AgentMessage[] = [
      {
        from: 'customs',
        to: 'ALL',
        type: 'data_share',
        payload: { isImportHeavy, foreignPartner },
        messageAr: isImportHeavy
          ? 'الاستيراد جزء أساسي من نشاطك — أنشئ حساب FASAH واطلب CoC من Saber قبل أي شراء.'
          : 'الاستيراد عرضي لنشاطك — لكن أي شحنة عبر الحدود لازم تمرّ عبر نفس المسار الرسمي.',
      },
      {
        from: 'customs',
        to: 'zatca',
        type: 'dependency',
        payload: { trackImportDuties: true, exciseAlertOnTobacco: true },
        messageAr:
          'الرسوم الجمركية والضريبة الانتقائية على المنتجات المستوردة تتعقّب في إقرار ZATCA — أدمجها في تقاريرك الشهرية.',
      },
      {
        from: 'customs',
        to: 'document',
        type: 'data_share',
        payload: {
          templatesNeeded: ['commercial_invoice_arabic', 'coc_request_form', 'hs_code_register'],
        },
        messageAr: 'يولّد وكيل المستندات: فاتورة تجارية بالعربي + نموذج طلب CoC + سجل تصنيفات HS.',
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'customs',
        nameAr: 'الجمارك السعودية + Saber/FASAH',
        nameSimpleAr: 'الاستيراد والتصدير',
        explainAr,
        estimatedCostSar: { min: 500, max: 3_000 },
        estimatedTimeAr: '٧ إلى ٢١ يوم لإكمال التسجيلات',
        officialUrl: 'https://customs.gov.sa',
        renewalPeriodAr: 'حسب نوع التسجيل',
        requirements,
        criticalWarningAr:
          'لكل منتج يدخل المملكة لازم شهادة مطابقة سعودية (CoC) عبر Saber — بدونها ترجع الشحنة من الميناء. تأكّد قبل أي طلب.',
        ...(isImportHeavy
          ? {
              commonMistakeAr:
                'كثير من التجار يطلبون شحنة كاملة قبل تسجيل المنتجات في Saber — وقتها يكون متأخر جداً. سجّل أول، اشحن ثاني.',
            }
          : {}),
      },
      outbox,
    };
  }
}
