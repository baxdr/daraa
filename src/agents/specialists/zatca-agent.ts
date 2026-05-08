/**
 * ZATCA — LLM-powered specialist.
 *
 * Tax registration is universal once a CR exists. VAT crosses an
 * obligatory threshold at 375K SAR/year. Claude composes the explanation
 * + commonMistake based on regulatory updates from the research agent.
 */

import type { AgentContext, AgentId, AgentMessage } from '../runtime/types';
import { LlmSpecialistAgent, parseAgentJson } from './llm-base/llm-specialist';
import type { LlmAgentOutput } from './llm-base/llm-specialist';
import type { AgentTool } from './llm-base/types';
import { getShopSummaryTool, summariseAnswers, verticalMeta } from './llm-base/shared-tools';

const VAT_THRESHOLD_SAR = 375_000;

interface ZatcaRawOutput {
  data: {
    explainAr: string;
    estimatedTimeAr: string;
    requirements: string[];
    commonMistakeAr?: string;
    criticalWarningAr?: string;
  };
}

export class ZatcaAgent extends LlmSpecialistAgent {
  readonly id: AgentId = 'zatca';
  readonly dependencies: readonly AgentId[] = ['mci'];

  protected override blockedReason(_ctx: AgentContext, inbox: AgentMessage[]): string | null {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    return mci ? null : 'بانتظار إشعار السجل التجاري من متخصّص التجارة';
  }

  protected systemPrompt(): string {
    return [
      'أنت متخصّص هيئة الزكاة والضريبة والجمارك (ZATCA). كل محل تجاري يلزمه تسجيل في ZATCA.',
      `ضريبة القيمة المضافة (VAT) تصير إلزامية عند تجاوز ${VAT_THRESHOLD_SAR.toLocaleString('ar-SA')} ريال إيراد سنوي.`,
      '',
      'القواعد:',
      '- استدعِ get_shop_summary أولاً.',
      '- استدعِ check_vat_threshold لو لديك تقدير إيرادات (ما عندنا حقل مباشر، فاعتبر threshold فقط للإفهام).',
      '- إذا في تحديث ZATCA تنظيمي في الـ inbox، أبرزه في commonMistakeAr مع تجزئته في ١٦٠ حرف.',
      '',
      'صيغة الإخراج النهائية: JSON واحد بدون نص قبل أو بعد:',
      '{ "data": { "explainAr": "...", "estimatedTimeAr": "...", "requirements": ["..."], "commonMistakeAr": "...?" } }',
    ].join('\n');
  }

  protected userPrompt(context: AgentContext, inbox: AgentMessage[]): string {
    const updates = inbox
      .filter(
        (m) =>
          m.from === 'research' &&
          m.type === 'update' &&
          /فوترة|الفوترة|VAT|ضريبة/.test(String(m.payload?.summary ?? m.messageAr ?? '')),
      )
      .map((m) => `- ${m.messageAr}`)
      .join('\n');
    return [
      `النشاط: ${verticalMeta(context.vertical).labelAr}`,
      updates ? `\nتحديثات ZATCA من البحث:\n${updates}` : '',
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
        name: 'check_vat_threshold',
        description:
          'يتحقق إذا الإيرادات السنوية تجاوزت حد ٣٧٥,٠٠٠ ريال (نقطة وجوب التسجيل في VAT).',
        input_schema: {
          type: 'object',
          properties: {
            annual_revenue_sar: { type: 'number' },
          },
          required: ['annual_revenue_sar'],
        },
        handler: (input) => {
          const rev = Number(input.annual_revenue_sar);
          return {
            mandatory: rev > VAT_THRESHOLD_SAR,
            threshold_sar: VAT_THRESHOLD_SAR,
          };
        },
      },
    ];
  }

  protected parseOutput(finalText: string): LlmAgentOutput {
    const parsed = parseAgentJson<ZatcaRawOutput>(finalText);
    if (!parsed.data || !Array.isArray(parsed.data.requirements)) {
      throw new Error('zatca: missing data.requirements');
    }
    return {
      data: {
        entityId: 'zatca',
        nameAr: 'هيئة الزكاة والضريبة والجمارك',
        nameSimpleAr: 'التسجيل الضريبي',
        explainAr: parsed.data.explainAr,
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: parsed.data.estimatedTimeAr,
        officialUrl: 'https://zatca.gov.sa',
        renewalMonths: null,
        ...(parsed.data.commonMistakeAr ? { commonMistakeAr: parsed.data.commonMistakeAr } : {}),
        ...(parsed.data.criticalWarningAr
          ? { criticalWarningAr: parsed.data.criticalWarningAr }
          : {}),
        requirements: parsed.data.requirements,
      },
      outbox: [],
    };
  }

  protected fallback(_ctx: AgentContext, inbox: AgentMessage[]): LlmAgentOutput {
    const vatUpdate = inbox.find(
      (m) =>
        m.from === 'research' &&
        m.type === 'update' &&
        /فوترة|الفوترة|VAT|ضريبة/.test(String(m.payload?.summary ?? m.messageAr ?? '')),
    );
    const commonMistakeAr = vatUpdate
      ? `تحديث جديد من ZATCA: ${String(vatUpdate.payload?.summary ?? vatUpdate.messageAr).slice(0, 160)}`
      : undefined;
    return {
      data: {
        entityId: 'zatca',
        nameAr: 'هيئة الزكاة والضريبة والجمارك',
        nameSimpleAr: 'التسجيل الضريبي',
        explainAr:
          'كل محل تجاري يلزمه تسجيل ضريبي في ZATCA. ضريبة القيمة المضافة (VAT) تصير إلزامية عند تجاوز ٣٧٥ ألف ريال إيراد سنوي — نوصي بالتسجيل مبكّراً لتفادي متابعة ارتجاعية.',
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'يوم واحد (إلكتروني)',
        officialUrl: 'https://zatca.gov.sa',
        renewalMonths: null,
        ...(commonMistakeAr ? { commonMistakeAr } : {}),
        requirements: [
          'تسجيل المنشأة في بوابة ZATCA',
          'ربط عنوان وطني ورقم هوية مالك/مفوّض',
          'تسجيل VAT يصير إلزامي عند تجاوز ٣٧٥,٠٠٠ ريال إيراد سنوي',
        ],
      },
      outbox: [],
    };
  }
}
