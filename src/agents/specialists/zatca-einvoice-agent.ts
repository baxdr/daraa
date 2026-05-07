import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';
import { E_INVOICE_PHASES } from '@/knowledge/zatca';

/**
 * ZATCA Phase-2 (Fatoora) e-invoicing integration. Separate from base ZATCA
 * registration — this is a *technical* onboarding (CSID + cryptographic
 * stamp + clearance/reporting integration), not a form.
 *
 * Branches:
 *   - VAT-required vs VAT-optional (from base ZATCA's payload)
 *   - establishment vs operational_compliance (different framing)
 *
 * Outbox:
 *   1. Broadcast technical readiness signal to chat/document.
 *   2. Tell pdpl_nca about the 6-year invoice retention rule (PDPL retention
 *      compliance interacts with this).
 *   3. Warn document agent that invoice templates need XML-compatible fields.
 */
export class ZatcaEinvoiceAgent implements Agent {
  readonly id: AgentId = 'zatca_einvoice';
  readonly dependencies: readonly AgentId[] = ['zatca'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const zatcaSignal = inbox.find((m) => m.from === 'zatca' && m.payload?.taxRegistered === true);
    if (!zatcaSignal) {
      return { status: 'blocked', reason: 'بانتظار إنجاز التسجيل الضريبي الأساسي' };
    }

    // Branch 1 — VAT-required (LLC) vs VAT-optional (مؤسسة فردية under threshold).
    const vatRequired = zatcaSignal.payload?.vatRequired === true;

    // Branch 2 — operational compliance gets renewal framing; establishment gets onboarding framing.
    const isOperational = context.mode === 'operational_compliance';

    const phase1Bullets = E_INVOICE_PHASES[0]?.requirementsAr ?? [];
    const phase2Bullets = E_INVOICE_PHASES[1]?.requirementsAr ?? [];

    const explainAr = vatRequired
      ? isOperational
        ? 'بما إنك مسجّل VAT — لازم نظام الفوترة عندك يكون مربوط مع منصة فاتورة (المرحلة الثانية). راجع شهادة CSID وآلية إرسال B2B/B2C.'
        : 'منصّتك تتربط تقنياً مع نظام ZATCA Fatoora: إصدار XML، ختم رقمي معتمد (CSID)، وربط مباشر للفواتير. هذا غير التسجيل الضريبي العادي.'
      : 'لأن مؤسستك الفردية تحت حد VAT حالياً، الربط الإلكتروني ليس ملزماً اليوم. لكن ابدأ التحضير الفني — عند تجاوز 375 ألف ريال يصبح إلزامياً خلال أيام.';

    const requirements: string[] = [...phase1Bullets.slice(0, 3), ...phase2Bullets.slice(0, 4)];
    if (vatRequired) {
      requirements.push('اختبار شامل في بيئة ZATCA التجريبية قبل التحويل للإنتاج');
    }

    const outbox: AgentMessage[] = [
      {
        from: 'zatca_einvoice',
        to: 'ALL',
        type: 'data_share',
        payload: {
          phase2Required: vatRequired,
          retentionYears: 6,
        },
        messageAr: vatRequired
          ? 'الربط الإلكتروني مع فاتورة إلزامي — جهّز الشهادة الرقمية CSID وفصل بيئة الاختبار عن الإنتاج.'
          : 'الربط الإلكتروني اختياري لمؤسستك حالياً — تحضّر فنياً لكن لا تطلق الربط حتى تجاوز حد VAT.',
      },
      {
        from: 'zatca_einvoice',
        to: 'pdpl_nca',
        type: 'dependency',
        payload: { invoiceRetentionYears: 6, dataCategory: 'transactional_financial' },
        messageAr:
          'فواتير إلكترونية تحفظ 6 سنوات — احرص على اتساق هذه المدة مع سياسة الاحتفاظ في PDPL وتغطية البيانات المالية.',
      },
      {
        from: 'zatca_einvoice',
        to: 'document',
        type: 'data_share',
        payload: { templateRequiresXml: true, qrRequired: true },
        messageAr:
          'قوالب الفواتير لازم تدعم XML/QR Code — راجع قالب الفاتورة الذي يولّده وكيل المستندات.',
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'zatca_einvoice',
        nameAr: 'ZATCA — الفوترة الإلكترونية (المرحلة الثانية)',
        nameSimpleAr: 'ربط الفوترة الإلكترونية',
        explainAr,
        estimatedCostSar: { min: 500, max: 3_000 },
        estimatedTimeAr: vatRequired ? '٧ إلى ١٤ يوم (تطوير + اعتماد)' : 'تحضير مبدئي 3-5 أيام',
        officialUrl: 'https://zatca.gov.sa',
        renewalPeriodAr: 'مستمر',
        requirements,
        commonMistakeAr:
          'الربط ليس مجرد تسجيل — هو تطوير تقني فعلي في الـ POS أو نظام الفوترة، واختبار مع بيئة ZATCA التجريبية قبل الإنتاج.',
      },
      outbox,
    };
  }
}
