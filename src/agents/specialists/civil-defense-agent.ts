/**
 * Civil Defense — LLM-powered specialist (Sonnet + tool use).
 *
 * Calls Claude with a focused tool palette: shop summary, vertical
 * fire-safety baseline, extinguisher math, regulatory updates from the
 * inbox. Claude composes the requirements list + Arabic explanation +
 * outbox messages. Falls back to deterministic logic if Claude is
 * unreachable.
 */

import type { AgentContext, AgentId, AgentMessage, EntityInfo } from '../runtime/types';
import { LlmSpecialistAgent, parseAgentJson } from './llm-base/llm-specialist';
import type { LlmAgentOutput } from './llm-base/llm-specialist';
import type { AgentTool } from './llm-base/types';
import {
  getShopSummaryTool,
  summariseAnswers,
  verticalMeta,
  type VerticalMeta,
} from './llm-base/shared-tools';

interface CivilDefenseRawOutput {
  data: Pick<
    EntityInfo,
    | 'explainAr'
    | 'estimatedCostSar'
    | 'estimatedTimeAr'
    | 'requirements'
    | 'criticalWarningAr'
    | 'commonMistakeAr'
  > & {
    /** Optional override; defaults to 12. */
    renewalMonths?: number;
  };
  outbox: Array<{
    to: AgentId | 'ALL';
    type: AgentMessage['type'];
    payload: Record<string, unknown>;
    messageAr: string;
  }>;
}

export class CivilDefenseAgent extends LlmSpecialistAgent {
  readonly id: AgentId = 'civil_defense';
  readonly dependencies: readonly AgentId[] = ['mci'];

  protected override blockedReason(_ctx: AgentContext, inbox: AgentMessage[]): string | null {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    return mci ? null : 'بانتظار إشعار جاهزية السجل التجاري';
  }

  protected systemPrompt(): string {
    return [
      'أنت متخصّص الدفاع المدني السعودي. مهمّتك تحديد متطلبات السلامة لمحلّ صغير (مطعم/كوفي/بقالة/مغسلة/صالون)',
      'ثم صياغة شهادة السلامة المطلوبة وتفسيرها بعربية واضحة للمالك.',
      '',
      'القواعد:',
      '- لا تخترع أرقاماً. كل عدد طفايات أو تكلفة أو متطلب يجي من الـ tools.',
      '- استخدم get_shop_summary أولاً لفهم المحل.',
      '- استخدم list_safety_requirements للقاعدة، ثم calculate_extinguisher_count لو في الإجابة عدد ناقص.',
      '- لو في رسالة من وكيل البحث (research) في الـ inbox فيها تحديث تنظيمي، أضفه كـ "جديد —" في requirements.',
      '- اكتب explainAr في جملتين بعربية بسيطة.',
      '- في outbox: أرسل dependency message لـ municipality فيها safetyCertReady + hasKitchen + estimatedTimeAr.',
      '',
      'صيغة الإخراج النهائية: JSON واحد بدون نص قبل أو بعد:',
      '{',
      '  "data": {',
      '    "explainAr": "...",',
      '    "estimatedCostSar": { "min": ١, "max": ٢ },',
      '    "estimatedTimeAr": "...",',
      '    "requirements": ["...", "..."],',
      '    "criticalWarningAr": "...",',
      '    "renewalMonths": 12',
      '  },',
      '  "outbox": [',
      '    { "to": "municipality", "type": "dependency", "payload": { "safetyCertReady": true, "hasKitchen": true, "nonGroundFloor": false, "estimatedTimeAr": "..." }, "messageAr": "..." }',
      '  ]',
      '}',
    ].join('\n');
  }

  protected userPrompt(context: AgentContext, inbox: AgentMessage[]): string {
    const updates = inbox
      .filter((m) => m.from === 'research' && m.type === 'update')
      .map((m) => `- ${m.messageAr}`)
      .join('\n');
    const updatesBlock = updates ? `\n\nتحديثات تنظيمية وصلتك من وكيل البحث:\n${updates}` : '';
    return [
      `النشاط: ${verticalMeta(context.vertical).labelAr}`,
      context.cityLabelAr ? `المدينة: ${context.cityLabelAr}` : '',
      'استخدم الـ tools لجمع الحقائق ثم أخرج JSON النهائي.',
      updatesBlock,
    ]
      .filter(Boolean)
      .join('\n');
  }

  protected tools(context: AgentContext): AgentTool[] {
    const summary = summariseAnswers(context.answers, context.vertical, context.cityLabelAr);
    return [
      getShopSummaryTool(summary),
      this.listSafetyRequirementsTool(),
      this.calculateExtinguisherCountTool(),
      this.estimateSafetyCostTool(),
    ];
  }

  protected parseOutput(finalText: string, context: AgentContext): LlmAgentOutput {
    const parsed = parseAgentJson<CivilDefenseRawOutput>(finalText);
    if (!parsed.data || !Array.isArray(parsed.data.requirements)) {
      throw new Error('civil_defense: missing data.requirements');
    }
    if (!Array.isArray(parsed.outbox)) {
      throw new Error('civil_defense: missing outbox array');
    }

    const meta = verticalMeta(context.vertical);
    return {
      data: {
        entityId: 'civil_defense',
        nameAr: 'الدفاع المدني',
        nameSimpleAr: 'شهادة السلامة',
        explainAr: parsed.data.explainAr,
        estimatedCostSar: parsed.data.estimatedCostSar,
        estimatedTimeAr: parsed.data.estimatedTimeAr,
        officialUrl: 'https://www.998.gov.sa',
        renewalMonths: parsed.data.renewalMonths ?? 12,
        ...(parsed.data.criticalWarningAr
          ? { criticalWarningAr: parsed.data.criticalWarningAr }
          : {}),
        ...(parsed.data.commonMistakeAr ? { commonMistakeAr: parsed.data.commonMistakeAr } : {}),
        requirements: parsed.data.requirements,
      },
      outbox: parsed.outbox.map((m) => ({
        from: 'civil_defense' as AgentId,
        to: m.to,
        type: m.type,
        payload: {
          // Ensure the canonical kitchen signal even if Claude forgot it.
          hasKitchen: meta.hasKitchen,
          nonGroundFloor: false,
          ...m.payload,
          safetyCertReady: true,
        },
        messageAr: m.messageAr,
      })),
    };
  }

  protected fallback(context: AgentContext, inbox: AgentMessage[]): LlmAgentOutput {
    const meta = verticalMeta(context.vertical);
    const baseRequirements = this.deterministicRequirements(meta);
    const updates = inbox.filter((m) => m.from === 'research' && m.type === 'update');
    for (const u of updates) {
      const summary = String(u.payload?.summary ?? u.messageAr ?? '').trim();
      if (summary) baseRequirements.push(`جديد — ${summary.slice(0, 120)}`);
    }
    const cost = this.deterministicCost(meta);
    const estimatedTimeAr = '٣ إلى ١٤ يوم (يحتاج زيارة ميدانية)';
    return {
      data: {
        entityId: 'civil_defense',
        nameAr: 'الدفاع المدني',
        nameSimpleAr: 'شهادة السلامة',
        explainAr:
          'يفحصون محلك ويتأكدون إن متطلبات السلامة مطبّقة — طفايات، مخارج طوارئ، كواشف دخان، ' +
          'وإجراءات خاصة حسب طبيعة النشاط.',
        estimatedCostSar: cost,
        estimatedTimeAr,
        officialUrl: 'https://www.998.gov.sa',
        renewalMonths: 12,
        criticalWarningAr:
          'شهادة السلامة غالباً تسبق رخصة البلدية — تأكّد من التسلسل الصحيح لحيّك على منصة بلدي قبل التقديم.',
        requirements: baseRequirements,
      },
      outbox: [
        {
          from: 'civil_defense',
          to: 'municipality',
          type: 'dependency',
          payload: {
            safetyCertReady: true,
            estimatedTimeAr,
            hasKitchen: meta.hasKitchen,
            nonGroundFloor: false,
          },
          messageAr: 'شهادة السلامة جاهزة للإصدار — تقدر تبدأ طلب رخصة البلدية.',
        },
      ],
    };
  }

  /* ─── Tool handlers (also reused by fallback path) ────────────────────── */

  private deterministicRequirements(meta: VerticalMeta): string[] {
    const base = [
      'طفايات حريق بعدد يناسب المساحة',
      'مخارج طوارئ واضحة ومضاءة',
      'كواشف دخان عاملة',
      'لوحات إرشادية (مخرج، طفاية، نقطة تجمع)',
      'صندوق إسعافات أولية',
    ];
    if (meta.hasKitchen) return [...base, 'نظام إطفاء تلقائي للمطبخ', 'غطاء شفط مقاوم للحريق'];
    if (meta.id === 'salon') return [...base, 'تهوية مناسبة لمنع تراكم أبخرة المواد الكيميائية'];
    if (meta.id === 'laundry') return [...base, 'تأريض الأجهزة الكهربائية + عزل دوائر الغسالات'];
    return [...base, 'تخزين المنتجات بعيد عن مصادر الحرارة'];
  }

  private deterministicCost(meta: VerticalMeta): { min: number; max: number } {
    if (meta.id === 'restaurant' || meta.id === 'coffee') return { min: 200, max: 1000 };
    if (meta.id === 'salon') return { min: 200, max: 800 };
    return { min: 200, max: 700 };
  }

  private listSafetyRequirementsTool(): AgentTool {
    return {
      name: 'list_safety_requirements',
      description:
        'يرجع قائمة متطلبات السلامة الأساسية حسب نوع النشاط (طفايات، مخارج، كواشف، وإضافات حسب المطبخ/الكيماويات/الكهرباء).',
      input_schema: {
        type: 'object',
        properties: {
          vertical: {
            type: 'string',
            enum: ['coffee', 'restaurant', 'grocery', 'laundry', 'salon'],
          },
        },
        required: ['vertical'],
      },
      handler: (input) => {
        const v = String(input.vertical) as VerticalMeta['id'];
        return { requirements: this.deterministicRequirements(verticalMeta(v)) };
      },
    };
  }

  private calculateExtinguisherCountTool(): AgentTool {
    return {
      name: 'calculate_extinguisher_count',
      description:
        'يحسب الحد الأدنى للطفايات بناءً على المساحة (m²). كل ١٠٠م² تحتاج طفاية واحدة على الأقل، وأي محل لا يقل عن ٢ طفايات.',
      input_schema: {
        type: 'object',
        properties: {
          area_sqm: { type: 'number', description: 'مساحة المحل بالأمتار المربعة' },
        },
        required: ['area_sqm'],
      },
      handler: (input) => {
        const area = Number(input.area_sqm);
        const required = Math.max(2, Math.ceil(area / 100));
        return { required_minimum: required, formula: 'max(2, ceil(area / 100))' };
      },
    };
  }

  private estimateSafetyCostTool(): AgentTool {
    return {
      name: 'estimate_safety_cost',
      description: 'تقدير تكلفة شهادة الدفاع المدني بناءً على نوع النشاط (SAR).',
      input_schema: {
        type: 'object',
        properties: {
          vertical: {
            type: 'string',
            enum: ['coffee', 'restaurant', 'grocery', 'laundry', 'salon'],
          },
        },
        required: ['vertical'],
      },
      handler: (input) =>
        this.deterministicCost(verticalMeta(String(input.vertical) as VerticalMeta['id'])),
    };
  }
}
