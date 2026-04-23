import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * PDPL + NCA readiness specialist — for tech / ecommerce verticals.
 * Reads the MCI signal, then tailors recommendations based on whether the
 * project will deal with government clients (triggers NCA ECC in addition
 * to PDPL).
 */
export class PdplNcaAgent implements Agent {
  readonly id: AgentId = 'pdpl_nca';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار السجل التجاري' };
    }

    const willServeGov = context.answers.q7_government_clients === 'yes';
    const requirements: string[] = [
      'نشر سياسة خصوصية باللغة العربية',
      'آلية موافقة صريحة قبل جمع البيانات',
      'سجل أنشطة المعالجة (يولّده درع)',
      'خطة الاستجابة لحوادث الاختراق',
    ];
    if (willServeGov) {
      requirements.push('تطبيق ضوابط NCA ECC الأساسية — HTTPS، CSP، HSTS، سجلات المراجعة');
    }

    return {
      status: 'complete',
      data: {
        entityId: 'pdpl_nca',
        nameAr: willServeGov
          ? 'حماية البيانات (PDPL) + الأمن السيبراني (NCA ECC)'
          : 'نظام حماية البيانات الشخصية (PDPL)',
        nameSimpleAr: willServeGov ? 'PDPL + NCA' : 'جاهزية PDPL',
        explainAr:
          willServeGov
            ? 'لأن خدمتك ستتعامل مع جهات حكومية، يجب استيفاء متطلبات حماية البيانات (PDPL) ' +
              'إضافةً لضوابط الأمن السيبراني الأساسية (NCA ECC). الاثنان مطلوبان قبل أي عقد حكومي.'
            : 'لأن تطبيقك سيجمع بيانات مستخدمين سعوديين، لازم من اليوم الأول تكون عندك سياسة ' +
              'خصوصية ومسار موافقة وخطة استجابة. المخالفة غرامتها تصل ٥ ملايين ريال.',
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'مستمر — يبدأ قبل أول إطلاق',
        officialUrl: willServeGov ? 'https://nca.gov.sa' : 'https://sdaia.gov.sa',
        renewalPeriodAr: 'مستمر',
        requirements,
      },
      outbox: [],
    };
  }
}
