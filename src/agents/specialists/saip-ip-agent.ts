import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * SAIP — Saudi Authority for Intellectual Property.
 *
 * Branches:
 *   - vertical (tech/ecommerce mainstream; others optional)
 *   - has-existing-brand (suggests trademark filing urgency)
 *
 * Outbox:
 *   1. Broadcast IP recommendations to ALL.
 *   2. Tell document agent about NDA/employment-IP-clauses templates.
 *   3. Tell research agent to flag any name conflict via web check.
 */
export class SaipIpAgent implements Agent {
  readonly id: AgentId = 'saip_ip';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار السجل التجاري' };
    }

    // Branch 1 — vertical relevance.
    const isHighIp = context.vertical === 'tech' || context.vertical === 'services';

    // Branch 2 — has-trade-name-from-MCI signal.
    const hasBrand =
      typeof context.answers.q_company_name === 'string' &&
      context.answers.q_company_name.trim().length > 0;

    const requirements: string[] = [
      'تسجيل العلامة التجارية (الاسم + الشعار) — حماية لـ 10 سنوات قابلة للتجديد',
      'مراجعة قاعدة بيانات SAIP لاكتشاف تعارض مسبق قبل التقديم',
      'حقوق المصنفات للكود البرمجي والمحتوى الإبداعي (تنشأ تلقائياً، التسجيل يقوّيها)',
      'إدراج بنود الملكية الفكرية في عقود الموظفين والمتعاقدين (work-for-hire)',
    ];
    if (isHighIp) {
      requirements.push('تقييم براءة اختراع للمكونات التقنية الفريدة (إن وُجدت)');
      requirements.push('استراتيجية NDAs قبل أي محادثات شراكة أو استثمار');
    }

    const explainAr = isHighIp
      ? 'الملكية الفكرية أصل أساسي لشركتك التقنية/الإلكترونية: سجّل علامتك التجارية قبل الإطلاق العلني، احمِ الكود بحقوق المصنفات، وادرس براءات الاختراع للمكونات الفريدة.'
      : 'حتى لو نشاطك ليس تقنياً، حماية اسم وشعار شركتك تستحق الاستثمار — تكلفة بسيطة الآن أرخص من نزاع قانوني لاحق.';

    const outbox: AgentMessage[] = [
      {
        from: 'saip_ip',
        to: 'ALL',
        type: 'data_share',
        payload: { highIpVertical: isHighIp, hasBrand },
        messageAr: isHighIp
          ? 'الملكية الفكرية أولوية — سجّل علامتك التجارية فور إطلاق السجل التجاري لتفادي أي مزاحمة.'
          : 'سجّل العلامة التجارية لاسم/شعار الشركة — حماية احتياطية مهمة حتى للنشاطات غير التقنية.',
      },
      {
        from: 'saip_ip',
        to: 'document',
        type: 'data_share',
        payload: {
          templatesNeeded: ['nda_template', 'employment_ip_clause', 'trademark_filing_form'],
        },
        messageAr:
          'يولّد وكيل المستندات: قالب NDA + بنود ملكية فكرية لعقود الموظفين + نموذج تقديم العلامة التجارية.',
      },
    ];
    if (hasBrand) {
      outbox.push({
        from: 'saip_ip',
        to: 'research',
        type: 'dependency',
        payload: {
          checkBrandConflict: true,
          brandName: context.answers.q_company_name,
        },
        messageAr:
          'الاسم التجاري المقترح لازم يتم فحصه ضد قاعدة SAIP والمواقع المنافسة قبل التقديم الرسمي.',
      });
    }

    return {
      status: 'complete',
      data: {
        entityId: 'saip_ip',
        nameAr: 'الهيئة السعودية للملكية الفكرية',
        nameSimpleAr: 'حماية الملكية الفكرية',
        explainAr,
        estimatedCostSar: { min: 1_000, max: 7_000 },
        estimatedTimeAr: '٣ إلى ٦ أشهر للاعتماد',
        officialUrl: 'https://saip.gov.sa',
        renewalPeriodAr: 'كل ١٠ سنوات للعلامات التجارية',
        requirements,
        commonMistakeAr:
          'سجّل علامتك التجارية قبل الإطلاق العام — لو أحد سجّلها قبلك (حتى لو سيئ النية)، استرجاعها يتطلب نزاعاً قانونياً مكلفاً.',
        ...(isHighIp
          ? {
              criticalWarningAr:
                'في النشاط التقني/الإلكتروني، السبق في تسجيل العلامة التجارية ≠ ميزة، بل خط دفاع حاسم.',
            }
          : {}),
      },
      outbox,
    };
  }
}
