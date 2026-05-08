/**
 * MCI (وزارة التجارة) — LLM-powered specialist.
 *
 * The CR is the root entity for every shop. Claude composes the rich
 * Arabic explanation + renewal urgency note based on the user's CR
 * issue date. Broadcasts crReady to ALL so downstream specialists can
 * unblock.
 */

import type { AgentContext, AgentId } from '../runtime/types';
import { LlmSpecialistAgent, parseAgentJson } from './llm-base/llm-specialist';
import type { LlmAgentOutput } from './llm-base/llm-specialist';
import type { AgentTool } from './llm-base/types';
import {
  checkRenewalUrgencyTool,
  getShopSummaryTool,
  summariseAnswers,
  verticalMeta,
} from './llm-base/shared-tools';

interface MciRawOutput {
  data: {
    explainAr: string;
    estimatedTimeAr: string;
    requirements: string[];
    criticalWarningAr?: string;
    commonMistakeAr?: string;
  };
}

export class MciAgent extends LlmSpecialistAgent {
  readonly id: AgentId = 'mci';
  readonly dependencies: readonly AgentId[] = [];

  protected systemPrompt(): string {
    return [
      'أنت متخصّص وزارة التجارة (MCI) السعودية. السجل التجاري (CR) هو الوثيقة الأم لأي محل،',
      'يُجدَّد سنوياً وعدم تجديده يوقف باقي الخدمات الحكومية.',
      '',
      'القواعد:',
      '- استخدم get_shop_summary لقراءة بيانات المحل.',
      '- لو في تاريخ إصدار للسجل التجاري (crIssueDate)، استخدم check_renewal_urgency لمعرفة إذا كان قارب على الانتهاء (٣٦٥ يوم بعد آخر إصدار).',
      '- الحقل criticalWarningAr يلتقط فقط الحالات الخطرة (تجديد متأخر أو وشيك).',
      '- اكتب explainAr كجملتين بسيطتين بدون لغة قانونية.',
      '',
      'صيغة الإخراج النهائية: JSON واحد بدون نص قبل أو بعد:',
      '{ "data": { "explainAr": "...", "estimatedTimeAr": "...", "requirements": ["..."], "criticalWarningAr": "...", "commonMistakeAr": "..." } }',
    ].join('\n');
  }

  protected userPrompt(context: AgentContext): string {
    return [
      `النشاط: ${verticalMeta(context.vertical).labelAr}`,
      context.cityLabelAr ? `المدينة: ${context.cityLabelAr}` : '',
      'استدعِ get_shop_summary، وإذا توفّر تاريخ إصدار CR استدعِ check_renewal_urgency لتاريخ التجديد المتوقَّع (تاريخ الإصدار + ١٢ شهر).',
      'ثم أخرج JSON النهائي.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  protected tools(context: AgentContext): AgentTool[] {
    const summary = summariseAnswers(context.answers, context.vertical, context.cityLabelAr);
    return [getShopSummaryTool(summary), checkRenewalUrgencyTool()];
  }

  protected parseOutput(finalText: string): LlmAgentOutput {
    const parsed = parseAgentJson<MciRawOutput>(finalText);
    if (!parsed.data || !Array.isArray(parsed.data.requirements)) {
      throw new Error('mci: missing data.requirements');
    }
    return {
      data: {
        entityId: 'mci',
        nameAr: 'وزارة التجارة',
        nameSimpleAr: 'السجل التجاري',
        explainAr: parsed.data.explainAr,
        estimatedCostSar: { min: 200, max: 400 },
        estimatedTimeAr: parsed.data.estimatedTimeAr,
        officialUrl: 'https://mc.gov.sa',
        renewalMonths: 12,
        ...(parsed.data.criticalWarningAr
          ? { criticalWarningAr: parsed.data.criticalWarningAr }
          : {}),
        ...(parsed.data.commonMistakeAr ? { commonMistakeAr: parsed.data.commonMistakeAr } : {}),
        requirements: parsed.data.requirements,
      },
      outbox: [
        {
          from: 'mci',
          to: 'ALL',
          type: 'data_share',
          payload: { crReady: true },
          messageAr: 'السجل التجاري قائم — تقدرون تعتمدون على رقم السجل في بقية الطلبات.',
        },
      ],
    };
  }

  protected fallback(): LlmAgentOutput {
    return {
      data: {
        entityId: 'mci',
        nameAr: 'وزارة التجارة',
        nameSimpleAr: 'السجل التجاري',
        explainAr:
          'السجل التجاري — الوثيقة الأم لأي نشاط، يُجدَّد سنوياً. عدم تجديده يوقف باقي الخدمات الحكومية.',
        estimatedCostSar: { min: 200, max: 400 },
        estimatedTimeAr: 'يوم واحد (إلكتروني عبر منصة الأعمال)',
        officialUrl: 'https://mc.gov.sa',
        renewalMonths: 12,
        requirements: [
          'هوية وطنية سارية للمالك',
          'اسم تجاري مسجَّل',
          'تحديث النشاط في المنشأة لو تغيّر',
        ],
      },
      outbox: [
        {
          from: 'mci',
          to: 'ALL',
          type: 'data_share',
          payload: { crReady: true },
          messageAr: 'السجل التجاري قائم — تقدرون تعتمدون على رقم السجل في بقية الطلبات.',
        },
      ],
    };
  }
}
