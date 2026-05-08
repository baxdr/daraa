/**
 * Ministry of Health — LLM-powered specialist (salon + restaurant).
 *
 * Reads the municipality license handoff. Composes vertical-specific
 * health requirements, and emits a dependency to mohr_gosi about staff
 * health certificates.
 */

import type { AgentContext, AgentId, AgentMessage } from '../runtime/types';
import { LlmSpecialistAgent, parseAgentJson } from './llm-base/llm-specialist';
import type { LlmAgentOutput } from './llm-base/llm-specialist';
import type { AgentTool } from './llm-base/types';
import { getShopSummaryTool, summariseAnswers, verticalMeta } from './llm-base/shared-tools';

interface MohRawOutput {
  data: {
    explainAr: string;
    estimatedCostSar: { min: number; max: number };
    estimatedTimeAr: string;
    requirements: string[];
    commonMistakeAr?: string;
    criticalWarningAr?: string;
  };
  outbox: Array<{
    to: AgentId | 'ALL';
    type: AgentMessage['type'];
    payload: Record<string, unknown>;
    messageAr: string;
  }>;
}

export class MohAgent extends LlmSpecialistAgent {
  readonly id: AgentId = 'moh';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  protected override blockedReason(_ctx: AgentContext, inbox: AgentMessage[]): string | null {
    const muni = inbox.find(
      (m) =>
        m.from === 'municipality' &&
        m.type === 'dependency' &&
        typeof m.payload?.municipalityLicense === 'string',
    );
    return muni ? null : 'بانتظار رخصة البلدية قبل الترخيص الصحي';
  }

  protected systemPrompt(): string {
    return [
      'أنت متخصّص وزارة الصحة. توقيت تشغيلك: بعد رخصة البلدية. تخدم الصالونات والمطاعم.',
      '',
      'القواعد:',
      '- استدعِ get_shop_summary لمعرفة النوع.',
      '- استدعِ list_health_requirements (نوع: salon أو restaurant).',
      '- estimatedCostSar: ٥٠٠–٢٠٠٠ ريال.',
      '- في outbox: dependency لـ mohr_gosi فيها staffNeedHealthCerts=true.',
      '',
      'صيغة الإخراج النهائية:',
      '{ "data": { "explainAr": "...", "estimatedCostSar": {...}, "estimatedTimeAr": "...", "requirements": [...], "commonMistakeAr": "..." }, "outbox": [...] }',
    ].join('\n');
  }

  protected userPrompt(context: AgentContext): string {
    const meta = verticalMeta(context.vertical);
    return [
      `النشاط: ${meta.labelAr}`,
      `النوع للترخيص الصحي: ${meta.id === 'salon' ? 'salon' : 'restaurant'}`,
      'استخدم الـ tools ثم أخرج JSON النهائي.',
    ].join('\n');
  }

  protected tools(context: AgentContext): AgentTool[] {
    const summary = summariseAnswers(context.answers, context.vertical, context.cityLabelAr);
    return [
      getShopSummaryTool(summary),
      {
        name: 'list_health_requirements',
        description: 'يرجع قائمة متطلبات الترخيص الصحي حسب نوع المنشأة (صالون أو مطعم).',
        input_schema: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['salon', 'restaurant'] },
          },
          required: ['type'],
        },
        handler: (input) => {
          const t = String(input.type);
          if (t === 'salon') {
            return {
              requirements: [
                'شهادات صحية سارية لكل العاملين (تجدد سنوياً)',
                'تعقيم أدوات القص والتجميل بأنظمة معتمدة (Autoclave مفضّل)',
                'تصريف صحي منفصل لمياه الحمامات + غرف العمليات',
                'دورة تدريبية معتمدة في الصحة العامة للمدير',
                'لوحة إرشادات الإسعافات الأولية في موقع ظاهر',
              ],
            };
          }
          return {
            requirements: [
              'شهادات صحية سارية لكل العاملين في تحضير وتقديم الطعام',
              'فصل مساحة التحضير عن منطقة العملاء',
              'صرف صحي للنفايات الغذائية',
              'برنامج تنظيف يومي موثّق',
            ],
          };
        },
      },
    ];
  }

  protected parseOutput(finalText: string): LlmAgentOutput {
    const parsed = parseAgentJson<MohRawOutput>(finalText);
    if (!parsed.data || !Array.isArray(parsed.data.requirements)) {
      throw new Error('moh: missing data.requirements');
    }
    if (!Array.isArray(parsed.outbox)) {
      throw new Error('moh: missing outbox array');
    }
    return {
      data: {
        entityId: 'moh',
        nameAr: 'وزارة الصحة',
        nameSimpleAr: 'الترخيص الصحي',
        explainAr: parsed.data.explainAr,
        estimatedCostSar: parsed.data.estimatedCostSar,
        estimatedTimeAr: parsed.data.estimatedTimeAr,
        officialUrl: 'https://www.moh.gov.sa',
        renewalMonths: 12,
        ...(parsed.data.commonMistakeAr ? { commonMistakeAr: parsed.data.commonMistakeAr } : {}),
        ...(parsed.data.criticalWarningAr
          ? { criticalWarningAr: parsed.data.criticalWarningAr }
          : {}),
        requirements: parsed.data.requirements,
      },
      outbox: parsed.outbox.map((m) => ({
        from: 'moh' as AgentId,
        to: m.to,
        type: m.type,
        payload: { staffNeedHealthCerts: true, ...m.payload },
        messageAr: m.messageAr,
      })),
    };
  }

  protected fallback(context: AgentContext): LlmAgentOutput {
    const isSalon = context.vertical === 'salon';
    const requirements = isSalon
      ? [
          'شهادات صحية سارية لكل العاملين (تجدد سنوياً)',
          'تعقيم أدوات القص والتجميل بأنظمة معتمدة (Autoclave مفضّل)',
          'تصريف صحي منفصل لمياه الحمامات + غرف العمليات',
          'دورة تدريبية معتمدة في الصحة العامة للمدير',
          'لوحة إرشادات الإسعافات الأولية في موقع ظاهر',
        ]
      : [
          'شهادات صحية سارية لكل العاملين في تحضير وتقديم الطعام',
          'فصل مساحة التحضير عن منطقة العملاء',
          'صرف صحي للنفايات الغذائية',
          'برنامج تنظيف يومي موثّق',
        ];
    return {
      data: {
        entityId: 'moh',
        nameAr: 'وزارة الصحة',
        nameSimpleAr: 'الترخيص الصحي',
        explainAr: isSalon
          ? 'تجديد الترخيص الصحي السنوي يتطلب فحص ميداني + تحديث الشهادات الصحية للعاملين. لا تنتظر آخر شهر.'
          : 'الترخيص الصحي للمطاعم يكمّل ترخيص SFDA — يركّز على نظافة الأماكن المشتركة والتدريب الصحي للعاملين.',
        estimatedCostSar: { min: 500, max: 2_000 },
        estimatedTimeAr: 'تجديد سنوي — ابدأ قبل انتهاء الترخيص بشهر',
        officialUrl: 'https://www.moh.gov.sa',
        renewalMonths: 12,
        commonMistakeAr: isSalon
          ? 'كثير من الصالونات تفوّت تجديد الشهادات الصحية للعاملين — وقتها يتعطّل العمل لأسبوعين بسبب توقّف الترخيص.'
          : 'الشهادات الصحية للعاملين تُجدَّد سنوياً — موظف بدون شهادة سارية يكفي لإيقاف نشاط المطعم.',
        requirements,
      },
      outbox: [
        {
          from: 'moh',
          to: 'mohr_gosi',
          type: 'dependency',
          payload: { staffNeedHealthCerts: true },
          messageAr:
            'كل عامل يحتاج شهادة صحية سارية — لا توظف بدونها وضع التحقق ضمن إجراءات الـ onboarding.',
        },
      ],
    };
  }
}
