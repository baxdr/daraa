import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';
import {
  VAT,
  WHT_RULES,
  ZAKAT_RATE_PERCENT,
  CORPORATE_INCOME_TAX_PERCENT,
} from '@/knowledge/zatca';

/**
 * Tax-strategy specialist.
 *
 * Distinct from `zatca`: zatca handles registration + filing mechanics.
 * tax_strategy handles *strategic* decisions: VAT timing, foreign-share
 * treatment, withholding obligations, audit posture.
 *
 * Branches:
 *   - foreign partner present (Zakat-only vs blended Zakat+CIT)
 *   - capital tier (advisory tier — small/SMB/large)
 *
 * Outbox:
 *   1. Broadcast tax-load summary to ALL.
 *   2. Tell zatca about WHT obligations on foreign payments.
 *   3. Tell document agent to add a tax-summary section to deliverables.
 */
export class TaxStrategyAgent implements Agent {
  readonly id: AgentId = 'tax_strategy';
  readonly dependencies: readonly AgentId[] = ['mci', 'zatca'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    const zatca = inbox.find((m) => m.from === 'zatca' && m.payload?.taxRegistered === true);
    if (!mci || !zatca) {
      return { status: 'blocked', reason: 'بانتظار جاهزية السجل التجاري والتسجيل الضريبي' };
    }

    // Branch 1 — foreign vs Saudi/GCC ownership.
    const foreign = context.hasForeignPartner === true;

    // Branch 2 — capital tier (small / SMB / large).
    const capital = context.capitalSar ?? 0;
    const tier = capital >= 50_000_000 ? 'large' : capital >= 1_000_000 ? 'smb' : 'small';

    const taxLoadSummary = foreign
      ? `حصة الأجانب تخضع لضريبة الدخل ${CORPORATE_INCOME_TAX_PERCENT}%، حصة السعوديين/الخليجيين تخضع للزكاة ${ZAKAT_RATE_PERCENT}%.`
      : `كامل الحصص تخضع للزكاة بنسبة ${ZAKAT_RATE_PERCENT}% — لا ضريبة دخل.`;

    const whtCategories = WHT_RULES.slice(0, 4)
      .map((r) => `${r.category} ${r.ratePercent}%`)
      .join('، ');

    const requirements: string[] = [
      `راجع حد VAT (${VAT.mandatoryRegistrationSar.toLocaleString()} ريال) — التسجيل الإلزامي عند تجاوزه`,
      `استقطاع ضريبي على المدفوعات الدولية: ${whtCategories}...`,
      'إعداد ميزانية ضريبية مع تقدير الزكاة/CIT السنوية',
      'تجنّب التحويلات بين كيانات مرتبطة بدون توثيق سعر السوق (Transfer Pricing)',
    ];
    if (foreign) {
      requirements.push('عقد توزيع أرباح موثّق + إقرار سنوي لضريبة الدخل');
    }
    if (tier === 'large') {
      requirements.push('تدقيق ضريبي خارجي سنوي + استشاري ضريبي ثابت');
    }

    const explainAr = foreign
      ? `بسبب وجود شريك أجنبي، التخطيط الضريبي يحتاج جهداً أكبر: ${taxLoadSummary} كذلك يلزم احتساب الاستقطاع الضريبي على أي مدفوعات للخارج.`
      : `${taxLoadSummary} ركّز على تخطيط VAT (الحد ${VAT.mandatoryRegistrationSar.toLocaleString()}) واستقطاع المدفوعات الدولية للموردين الأجانب (AWS، Stripe، إلخ).`;

    const outbox: AgentMessage[] = [
      {
        from: 'tax_strategy',
        to: 'ALL',
        type: 'data_share',
        payload: {
          foreignPartner: foreign,
          tier,
          zakatRate: ZAKAT_RATE_PERCENT,
          citRate: foreign ? CORPORATE_INCOME_TAX_PERCENT : 0,
        },
        messageAr: taxLoadSummary,
      },
      {
        from: 'tax_strategy',
        to: 'zatca',
        type: 'dependency',
        payload: { whtRulesApplicable: foreign },
        messageAr: foreign
          ? 'ادمج الاستقطاع الضريبي على المدفوعات الدولية في إقرارات ZATCA الشهرية.'
          : 'الاستقطاع الضريبي مطلوب فقط على المدفوعات لجهات أجنبية — راقب ذلك في كل دفعة.',
      },
      {
        from: 'tax_strategy',
        to: 'document',
        type: 'data_share',
        payload: { sectionNeeded: 'tax_summary', includesWHT: true },
        messageAr:
          'يجهّز وكيل المستندات قسم "ملخّص الالتزامات الضريبية" في تقرير المشروع — يشمل VAT، الزكاة، الاستقطاع.',
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'tax_strategy',
        nameAr: 'التخطيط الضريبي',
        nameSimpleAr: 'استراتيجية الضرائب',
        explainAr,
        estimatedCostSar: { min: 0, max: tier === 'large' ? 30_000 : 5_000 },
        estimatedTimeAr: 'مراجعة أولية ساعة، تنفيذ ١-٢ أسبوع',
        officialUrl: 'https://zatca.gov.sa',
        renewalPeriodAr: 'مراجعة سنوية',
        requirements,
        commonMistakeAr:
          'كثير من المؤسسين يتفاجؤون بالاستقطاع الضريبي 5-15% على مدفوعاتهم لمزودين أجانب (AWS، Stripe، إلخ). خطّط لها من البداية.',
        ...(foreign
          ? {
              criticalWarningAr:
                'وجود شريك أجنبي يفعّل ضريبة الدخل 20% — لا تتأخر عن تقديم الإقرار، الغرامات تراكمية.',
            }
          : {}),
      },
      outbox,
    };
  }
}
