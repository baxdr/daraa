import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * PDPL + NCA readiness specialist.
 *
 * Two modes:
 *   - establishment: tailors requirements for a *new* tech / ecommerce business
 *     based on whether it will serve government clients.
 *   - compliance: same baseline, plus reads chat-flow signals that indicate
 *     real risk on the existing business (processes personal data, DPO,
 *     data residency, large user base, government clients) and amplifies
 *     requirements + warnings accordingly.
 *
 * Also absorbs any research-agent update addressed to pdpl_nca / ALL and
 * tags it onto the requirement list with a "جديد —" prefix so the user
 * sees the regulatory delta.
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
    const processesPersonal = context.answers.q3_processes_personal_data === 'yes';
    const dpoAppointed = context.answers.q5_dpo_appointed;
    const dataLocation = context.answers.q6_data_location;
    const userBand = context.answers.q4_user_count;

    const requirements: string[] = [
      'نشر سياسة خصوصية باللغة العربية',
      'آلية موافقة صريحة قبل جمع البيانات',
      'سجل أنشطة المعالجة (يولّده درع)',
      'خطة الاستجابة لحوادث الاختراق',
    ];
    if (willServeGov) {
      requirements.push('تطبيق ضوابط NCA ECC الأساسية — HTTPS، CSP، HSTS، سجلات المراجعة');
    }

    const warnings: string[] = [];

    // Compliance-specific escalations.
    if (context.mode === 'compliance' && processesPersonal) {
      if (userBand === 'over_100k' || userBand === '10k_100k') {
        requirements.push('تعيين مسؤول حماية بيانات (DPO) موثّق لدى سدايا');
        if (dpoAppointed !== 'yes') {
          warnings.push(
            'عدد المستخدمين يتجاوز ١٠ آلاف بدون DPO معيّن — مخالفة جوهرية للمادة ٣٢ من اللائحة.',
          );
        }
      }
      if (dataLocation === 'outside') {
        requirements.push(
          'مراجعة عقود نقل البيانات خارج السعودية — النقل خارج المملكة يحتاج مبرّراً قانونياً',
        );
        warnings.push(
          'البيانات مُخزّنة خارج السعودية — راجع المادة ٢٩ من اللائحة قبل أي تدقيق رسمي.',
        );
      } else if (dataLocation === 'unknown') {
        warnings.push(
          'موقع تخزين البيانات غير محدّد — هذا في حد ذاته مؤشر امتثال ضعيف.',
        );
      }
    }

    // Absorb research updates targeted at pdpl_nca / ALL.
    const updates = inbox.filter(
      (m) => m.from === 'research' && m.type === 'update' && (m.to === 'pdpl_nca' || m.to === 'ALL'),
    );
    for (const u of updates) {
      const summary = String(u.payload?.summary ?? u.messageAr ?? '').trim();
      if (summary) requirements.push(`جديد — ${summary.slice(0, 140)}`);
    }

    const criticalWarningAr = warnings.length > 0 ? warnings.join(' ') : undefined;

    const nameAr = willServeGov
      ? 'حماية البيانات (PDPL) + الأمن السيبراني (NCA ECC)'
      : 'نظام حماية البيانات الشخصية (PDPL)';
    const nameSimpleAr = willServeGov ? 'PDPL + NCA' : 'جاهزية PDPL';

    const explainAr = context.mode === 'compliance'
      ? 'نراجع جاهزيتك الفعلية لنظام حماية البيانات الشخصية — السياسة، الموافقة، DPO، ' +
        'موقع التخزين، وخطة الحوادث — كلها مطلوبة فعلياً للامتثال الحالي.'
      : willServeGov
      ? 'لأن خدمتك ستتعامل مع جهات حكومية، يجب استيفاء متطلبات حماية البيانات (PDPL) ' +
        'إضافةً لضوابط الأمن السيبراني الأساسية (NCA ECC). الاثنان مطلوبان قبل أي عقد حكومي.'
      : 'لأن تطبيقك سيجمع بيانات مستخدمين سعوديين، لازم من اليوم الأول تكون عندك سياسة ' +
        'خصوصية ومسار موافقة وخطة استجابة. المخالفة غرامتها تصل ٥ ملايين ريال.';

    return {
      status: 'complete',
      data: {
        entityId: 'pdpl_nca',
        nameAr,
        nameSimpleAr,
        explainAr,
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: context.mode === 'compliance' ? 'مراجعة مستمرة' : 'مستمر — يبدأ قبل أول إطلاق',
        officialUrl: willServeGov ? 'https://nca.gov.sa' : 'https://sdaia.gov.sa',
        renewalPeriodAr: 'مستمر',
        criticalWarningAr,
        requirements,
      },
      outbox: [],
    };
  }
}
