import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from '../runtime/types';

/**
 * MOHR + GOSI combined — opens the establishment file and sets up GOSI
 * subscriptions. In compliance mode it also reasons about نطاقات (nitaqat)
 * based on the employee count and broadcasts a warning when the zone is
 * at risk, so Municipality can constrain its services and MCI can flag
 * the same risk on future trade-registry renewals.
 */
export class MohrGosiAgent implements Agent {
  readonly id: AgentId = 'mohr_gosi';
  readonly dependencies: readonly AgentId[] = ['mci'];

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    if (!mci) {
      return { status: 'blocked', reason: 'بانتظار إشعار جاهزية السجل التجاري' };
    }

    const employeeCount = this.readEmployeeCount(context);
    const nitaqatRisk = this.estimateNitaqatRisk(context, employeeCount);

    const requirements: string[] = [
      'رقم السجل التجاري',
      'عنوان وطني للمنشأة',
      'تحديد نسبة التوطين المستهدفة',
    ];
    if (context.mode === 'compliance' && employeeCount >= 10) {
      requirements.push(
        'تأكّد من نسبة التوطين الفعلية على منصّة قوى — النطاق الأحمر يوقف كثير من الخدمات',
      );
    }

    const criticalWarningAr = nitaqatRisk === 'red'
      ? 'تقديريّاً: نطاق المنشأة مرشّح للأحمر — راجع نسبة التوطين فوراً، لأن أغلب الخدمات الحكومية تتقيّد في النطاق الأحمر.'
      : nitaqatRisk === 'yellow'
      ? 'تقديريّاً: النطاق قد يكون أصفر — نسبة التوطين تحتاج مراجعة قبل أي تجديد.'
      : undefined;

    const outbox: AgentMessage[] = [];
    if (context.mode === 'compliance' && nitaqatRisk === 'red') {
      outbox.push({
        from: 'mohr_gosi',
        to: 'municipality',
        type: 'warning',
        payload: { nitaqatZone: 'red', employeeCount },
        messageAr:
          'تنبيه نطاقات: النطاق الأحمر — كثير من خدمات البلدية تتقيّد حتى يُصحَّح النطاق.',
      });
      outbox.push({
        from: 'mohr_gosi',
        to: 'mci',
        type: 'warning',
        payload: { nitaqatZone: 'red', employeeCount },
        messageAr:
          'تنبيه نطاقات: تجديد السجل التجاري قد يتعرقل لو ضل النطاق أحمر — عالج التوطين قبل موعد التجديد.',
      });
    }

    return {
      status: 'complete',
      data: {
        entityId: 'mohr_gosi',
        nameAr: 'وزارة الموارد البشرية + التأمينات الاجتماعية',
        nameSimpleAr: 'ملف المنشأة + تأمينات',
        explainAr:
          'فتح ملف منشأة في وزارة الموارد البشرية (مطلوب لتوظيف أي شخص سعودي أو غير سعودي) ' +
          'وتسجيل الاشتراك في التأمينات الاجتماعية. ' +
          (context.mode === 'compliance'
            ? 'في وضع الامتثال نراجع أيضاً تقدير نطاقات بناءً على عدد الموظفين.'
            : ''),
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'يوم واحد (إلكتروني لكل الخطوتين)',
        officialUrl: 'https://www.hrsd.gov.sa',
        renewalPeriodAr: 'اشتراك شهري (تأمينات)',
        criticalWarningAr,
        requirements,
      },
      outbox,
    };
  }

  private readEmployeeCount(context: AgentContext): number {
    const raw = context.answers.q2_employee_count;
    if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
    return 0;
  }

  /**
   * Very rough heuristic — we don't have nationality mix data in the chat,
   * so we flag risk purely by headcount thresholds. Teams with 50+ employees
   * almost always have a formal nitaqat classification; 10–49 sits in the
   * grey zone where small shifts change the colour.
   */
  private estimateNitaqatRisk(
    context: AgentContext,
    employeeCount: number,
  ): 'green' | 'yellow' | 'red' | null {
    if (context.mode !== 'compliance') return null;
    if (employeeCount >= 50) return 'red';
    if (employeeCount >= 10) return 'yellow';
    return 'green';
  }
}
