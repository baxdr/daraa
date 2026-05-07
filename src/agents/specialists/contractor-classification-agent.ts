import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * Contractor Classification (تصنيف المقاولين) from MOMRAH — construction only.
 * Requires a working municipality licence first (office licence).
 *
 * Branches:
 *   - capital level (drives recommended classification grade)
 *   - foreign-partner flag (changes documentation requirements)
 *
 * Outbox:
 *   1. Broadcast classification grade hint to ALL.
 *   2. Tell mohr_gosi that contractor classification needs evidence of
 *      a minimum-staff threshold per grade.
 *   3. Tell document agent that the application bundle includes
 *      financial statements + technical-staff CVs.
 */
export class ContractorClassificationAgent implements Agent {
  readonly id: AgentId = 'contractor_classification';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const municipality = inbox.find(
      (m) =>
        m.from === 'municipality' &&
        m.type === 'dependency' &&
        typeof m.payload?.municipalityLicense === 'string',
    );
    if (!municipality) {
      return { status: 'blocked', reason: 'بانتظار رخصة مكتب البلدية' };
    }

    // Branch 1 — capital tier maps to MOMRAH grade hint.
    const capital = context.capitalSar ?? 0;
    const gradeHint =
      capital >= 50_000_000
        ? 'الفئة الأولى (مشاريع تتجاوز 100 مليون)'
        : capital >= 10_000_000
          ? 'الفئة الثانية أو الثالثة (مشاريع 25-100 مليون)'
          : capital >= 1_000_000
            ? 'الفئة الرابعة أو الخامسة (مشاريع تحت 25 مليون)'
            : 'مقاول صغير — قد لا يحتاج تصنيف رسمي إلا للمنافسة على مشاريع حكومية محددة';

    // Branch 2 — foreign partner flag impacts paperwork.
    const foreign = context.hasForeignPartner === true;

    const requirements: string[] = [
      'قوائم مالية مدققة لآخر سنتين (ثلاث للفئات العليا)',
      'سير ذاتية مفصّلة للكوادر الفنية (مهندسون، فنيون) مع الشهادات',
      'قائمة المشاريع السابقة مع حجم كل مشروع وحالة التسليم',
      'سجل تجاري ساري + رخصة بلدية + شهادة الزكاة',
      'إثبات تأمينات اجتماعية للموظفين (GOSI active)',
    ];
    if (foreign) {
      requirements.push('شهادة أصلية موثّقة من سفارة بلد المنشأ للشركة الأم');
      requirements.push('عقود توظيف الكوادر الأجنبية + تصاريح إقامة سارية');
    }

    const outbox: AgentMessage[] = [
      {
        from: 'contractor_classification',
        to: 'ALL',
        type: 'data_share',
        payload: { recommendedGrade: gradeHint, capitalSar: capital },
        messageAr: `الفئة المقترحة بناءً على رأس المال: ${gradeHint}`,
      },
      {
        from: 'contractor_classification',
        to: 'mohr_gosi',
        type: 'dependency',
        payload: { needsMinimumStaffEvidence: true },
        messageAr:
          'المنح حسب الفئة يتطلب حد أدنى من الكوادر الفنية المسجّلة في GOSI — تأكّد من اكتمال التسجيل قبل التقديم.',
      },
      {
        from: 'contractor_classification',
        to: 'document',
        type: 'data_share',
        payload: {
          documentBundle: ['financial_statements', 'staff_cvs', 'project_history'],
        },
        messageAr:
          'حزمة طلب التصنيف تتضمّن قوائم مالية + سير ذاتية + سجل مشاريع — يولّد وكيل المستندات نموذج التغطية.',
      },
    ];

    return {
      status: 'complete',
      data: {
        entityId: 'contractor_classification',
        nameAr: 'تصنيف المقاولين — وزارة الشؤون البلدية والقروية والإسكان',
        nameSimpleAr: 'شهادة التصنيف',
        explainAr:
          'التصنيف يحدد الفئات والحدود المالية للمشاريع اللي تقدر تنافس عليها — خصوصاً في المشاريع الحكومية. ' +
          `بناءً على رأس المال (${capital.toLocaleString()} ريال): ${gradeHint}.`,
        estimatedCostSar: { min: 1_000, max: 5_000 },
        estimatedTimeAr: '١٤ إلى ٣٠ يوم',
        officialUrl: 'https://momrah.gov.sa',
        renewalPeriodAr: 'كل 3 سنوات',
        requirements,
        commonMistakeAr:
          'التصنيف يتطلب إثبات كفاءات فنية وإدارية ورأس مال — جهّز المستندات مسبقاً لتقليل دورات الاستكمال.',
        ...(foreign
          ? {
              criticalWarningAr:
                'وجود شريك أجنبي يضيف خطوة توثيق سفارة + اعتماد وزارة الخارجية على المستندات — احسبها في الزمن.',
            }
          : {}),
      },
      outbox,
    };
  }
}
