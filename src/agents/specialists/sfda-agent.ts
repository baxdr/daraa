/**
 * SFDA — LLM-powered specialist (food verticals only).
 *
 * Reads the municipality license handoff. Composes food-handling
 * requirements (with HACCP for kitchens), and emits a dependency to
 * mohr_gosi about food-handler health certificates.
 */

import type { AgentContext, AgentId, AgentMessage } from '../runtime/types';
import { LlmSpecialistAgent, parseAgentJson } from './llm-base/llm-specialist';
import type { LlmAgentOutput } from './llm-base/llm-specialist';
import type { AgentTool } from './llm-base/types';
import { getShopSummaryTool, summariseAnswers, verticalMeta } from './llm-base/shared-tools';

interface SfdaRawOutput {
  data: {
    explainAr: string;
    estimatedCostSar: { min: number; max: number };
    estimatedTimeAr: string;
    requirements: string[];
    criticalWarningAr?: string;
    commonMistakeAr?: string;
  };
  outbox: Array<{
    to: AgentId | 'ALL';
    type: AgentMessage['type'];
    payload: Record<string, unknown>;
    messageAr: string;
  }>;
}

export class SfdaAgent extends LlmSpecialistAgent {
  readonly id: AgentId = 'sfda';
  readonly dependencies: readonly AgentId[] = ['municipality'];

  protected override blockedReason(_ctx: AgentContext, inbox: AgentMessage[]): string | null {
    const muni = inbox.find(
      (m) =>
        m.from === 'municipality' &&
        m.type === 'dependency' &&
        typeof m.payload?.municipalityLicense === 'string',
    );
    return muni ? null : 'لم نستلم رقم رخصة البلدية من متخصّص البلدية';
  }

  protected systemPrompt(): string {
    return [
      'أنت متخصّص هيئة الغذاء والدواء (SFDA). توقيت تشغيلك: بعد ما تستلم رخصة البلدية.',
      '',
      'القواعد:',
      '- استدعِ get_shop_summary لقراءة hasKitchen والـ vertical.',
      '- استدعِ list_food_safety_requirements لجلب القاعدة (مع علم HACCP للمطابخ).',
      '- estimatedCostSar للمحل الصغير: ١٠٠٠–٣٠٠٠ ريال تقريبياً.',
      '- في outbox: dependency لـ mohr_gosi فيها foodHandlerCertsRequired=true.',
      '- لو research أرسل تحديث SFDA، أدمجه في commonMistakeAr.',
      '',
      'صيغة الإخراج النهائية: JSON واحد:',
      '{ "data": { "explainAr": "...", "estimatedCostSar": {"min":1000,"max":3000}, "estimatedTimeAr": "...", "requirements": ["..."], "commonMistakeAr": "...?" }, "outbox": [...] }',
    ].join('\n');
  }

  protected userPrompt(context: AgentContext, inbox: AgentMessage[]): string {
    const meta = verticalMeta(context.vertical);
    const sfdaUpdate = inbox.find(
      (m) =>
        m.from === 'research' &&
        m.type === 'update' &&
        /SFDA|الغذاء|دواء|سعرات/.test(String(m.payload?.summary ?? m.messageAr ?? '')),
    );
    return [
      `النشاط: ${meta.labelAr} (hasKitchen=${meta.hasKitchen})`,
      sfdaUpdate ? `تحديث SFDA: ${sfdaUpdate.messageAr}` : '',
      'استخدم الـ tools ثم أخرج JSON النهائي.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  protected tools(context: AgentContext): AgentTool[] {
    const summary = summariseAnswers(context.answers, context.vertical, context.cityLabelAr);
    return [
      getShopSummaryTool(summary),
      {
        name: 'list_food_safety_requirements',
        description: 'يرجع قائمة متطلبات السلامة الغذائية الأساسية + HACCP إذا hasKitchen=true.',
        input_schema: {
          type: 'object',
          properties: { has_kitchen: { type: 'boolean' } },
          required: ['has_kitchen'],
        },
        handler: (input) => {
          const reqs = [
            'مطابقة مواصفات تجهيز المطبخ/منطقة التحضير (مواد، أسطح، مغاسل)',
            'شهادات صحية سارية لكل عامل يتعامل مع الغذاء',
            'نظام تبريد للمواد سريعة التلف (≤4°م) + مراقبة درجات الحرارة',
            'سجل دخول/خروج المخزون مع تواريخ الصلاحية',
          ];
          if (Boolean(input.has_kitchen)) {
            reqs.push('خطة سلامة غذائية HACCP مبسّط (نقاط حرجة موثّقة)');
          }
          return { requirements: reqs };
        },
      },
    ];
  }

  protected parseOutput(finalText: string): LlmAgentOutput {
    const parsed = parseAgentJson<SfdaRawOutput>(finalText);
    if (!parsed.data || !Array.isArray(parsed.data.requirements)) {
      throw new Error('sfda: missing data.requirements');
    }
    if (!Array.isArray(parsed.outbox)) {
      throw new Error('sfda: missing outbox array');
    }
    return {
      data: {
        entityId: 'sfda',
        nameAr: 'الهيئة العامة للغذاء والدواء',
        nameSimpleAr: 'ترخيص الغذاء (SFDA)',
        explainAr: parsed.data.explainAr,
        estimatedCostSar: parsed.data.estimatedCostSar,
        estimatedTimeAr: parsed.data.estimatedTimeAr,
        officialUrl: 'https://sfda.gov.sa',
        renewalMonths: 12,
        ...(parsed.data.criticalWarningAr
          ? { criticalWarningAr: parsed.data.criticalWarningAr }
          : {}),
        ...(parsed.data.commonMistakeAr ? { commonMistakeAr: parsed.data.commonMistakeAr } : {}),
        requirements: parsed.data.requirements,
      },
      outbox: parsed.outbox.map((m) => ({
        from: 'sfda' as AgentId,
        to: m.to,
        type: m.type,
        payload: { foodHandlerCertsRequired: true, ...m.payload },
        messageAr: m.messageAr,
      })),
    };
  }

  protected fallback(context: AgentContext): LlmAgentOutput {
    const meta = verticalMeta(context.vertical);
    const requirements: string[] = [
      'مطابقة مواصفات تجهيز المطبخ/منطقة التحضير (مواد، أسطح، مغاسل)',
      'شهادات صحية سارية لكل عامل يتعامل مع الغذاء',
      'نظام تبريد للمواد سريعة التلف (≤4°م) + مراقبة درجات الحرارة',
      'سجل دخول/خروج المخزون مع تواريخ الصلاحية',
    ];
    if (meta.hasKitchen) {
      requirements.push('خطة سلامة غذائية HACCP مبسّط (نقاط حرجة موثّقة)');
    }
    return {
      data: {
        entityId: 'sfda',
        nameAr: 'الهيئة العامة للغذاء والدواء',
        nameSimpleAr: 'ترخيص الغذاء (SFDA)',
        explainAr:
          'التجديد السنوي للـ SFDA يتطلب فحص ميداني للمنشأة + تحديث الشهادات الصحية. لا تتأخر — توقف الترخيص يعني إغلاق فوري.',
        estimatedCostSar: { min: 1000, max: 3000 },
        estimatedTimeAr: 'تجديد سنوي — ابدأ قبل الانتهاء بشهر',
        officialUrl: 'https://sfda.gov.sa',
        renewalMonths: 12,
        commonMistakeAr: meta.hasKitchen
          ? 'كثير من المطاعم تفاجأ بفحص HACCP — جهّز نقاط التحكم الحرجة (التبريد، الطبخ، التخزين) موثّقة قبل الزيارة.'
          : 'تأكد من تواريخ صلاحية كل المنتجات على الرف قبل أي فحص ميداني — انتهاء الصلاحية أكثر أسباب المخالفات شيوعاً.',
        requirements,
      },
      outbox: [
        {
          from: 'sfda',
          to: 'mohr_gosi',
          type: 'dependency',
          payload: { foodHandlerCertsRequired: true },
          messageAr:
            'كل عامل يتعامل مع الغذاء يحتاج شهادة صحية للعاملين الغذائيين — أضفها في إجراءات التوظيف.',
        },
      ],
    };
  }
}
