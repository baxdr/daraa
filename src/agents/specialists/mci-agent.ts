import type { Agent, AgentContext, AgentId, AgentResult, NameCheckResult } from '../runtime/types';
import { checkTradeName } from '../name-check';

/**
 * MCI — وزارة التجارة.
 * First in every establishment path. No dependencies; no inbox to read.
 * Decides the appropriate entity type from the user's capital + partners +
 * foreign-partner flag, and broadcasts the entity type + CR-ready signal.
 *
 * In establishment mode we also attempt a trade-name availability check
 * against the web — advisory only, since mc.gov.sa doesn't expose a public
 * availability API. Results surface on the MCI entity card.
 */
export class MciAgent implements Agent {
  readonly id: AgentId = 'mci';
  readonly dependencies: readonly AgentId[] = [];

  async run(context: AgentContext): Promise<AgentResult> {
    const partners = context.partnerCount ?? 1;
    const capital = context.capitalSar ?? 0;
    const foreign = context.hasForeignPartner === true;

    const entityType = this.recommendEntityType(partners, capital, foreign);
    const cost = this.estimateCost(partners, capital, foreign);

    // Trade-name check — only for establishment mode (new project). In
    // compliance mode the company already exists, so a name check would
    // mislead.
    let nameCheck: NameCheckResult | undefined;
    const requestedName = context.answers.q_company_name?.trim();
    if (context.mode === 'establishment' && requestedName) {
      nameCheck = await checkTradeName(requestedName);
    }

    // Foreign partner adds a pre-step (MISA investment licence); we don't
    // model it as a separate agent yet, but we flag it in the warning.
    const criticalWarningAr = foreign
      ? 'وجود شريك أجنبي يتطلب ترخيص استثمار من وزارة الاستثمار (MISA) قبل السجل التجاري — خطوة إضافية.'
      : undefined;

    return {
      status: 'complete',
      data: {
        entityId: 'mci',
        nameAr: 'وزارة التجارة',
        nameSimpleAr: 'السجل التجاري',
        explainAr:
          'أول خطوة لأي مشروع — تسجّل شركتك رسمياً. مثل شهادة الميلاد للمشروع. ' +
          `بناءً على معطياتكم، النوع المقترح: ${entityType}.`,
        estimatedCostSar: cost,
        estimatedTimeAr: 'يوم واحد (إلكتروني عبر منصة الأعمال)',
        officialUrl: 'https://mc.gov.sa',
        renewalPeriodAr: 'سنوي',
        criticalWarningAr,
        requirements: [
          'هوية وطنية سارية لكل الشركاء',
          'اسم تجاري مقترح (٣ خيارات احتياطية)',
          'عقد تأسيس (يولّده درع تلقائياً)',
        ],
        nameCheck,
      },
      outbox: [
        {
          from: 'mci',
          to: 'ALL',
          type: 'data_share',
          payload: {
            entityType,
            crReady: true,
            foreignPartner: foreign,
          },
          messageAr: `السجل التجاري جاهز — نوع الكيان: ${entityType}. تقدرون تعتمدون على رقم السجل في بقية الطلبات.`,
        },
      ],
    };
  }

  private recommendEntityType(partners: number, capital: number, foreign: boolean): string {
    if (foreign) return 'شركة ذات مسؤولية محدودة (ذ.م.م) — برأس مال أجنبي';
    if (partners === 1 && capital < 500_000) return 'مؤسسة فردية';
    if (partners === 1) return 'شركة شخص واحد (ذ.م.م)';
    return 'شركة ذات مسؤولية محدودة (ذ.م.م)';
  }

  private estimateCost(partners: number, capital: number, foreign: boolean): { min: number; max: number } {
    if (foreign) return { min: 2000, max: 6000 }; // MISA licence + CR
    if (partners === 1 && capital < 500_000) return { min: 200, max: 400 };
    return { min: 1000, max: 1600 };
  }
}
