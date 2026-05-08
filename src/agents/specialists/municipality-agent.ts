/**
 * Municipality (أمانة / بلدي) — LLM-powered specialist.
 *
 * Reads the safety-cert handoff from civil_defense (carries hasKitchen +
 * nonGroundFloor signals) and any nitaqat warning from mohr_gosi. Claude
 * composes the final license label, requirements, warnings, and the
 * outbox messages that unblock SFDA + MoH.
 */

import type { AgentContext, AgentId, AgentMessage } from '../runtime/types';
import { LlmSpecialistAgent, parseAgentJson } from './llm-base/llm-specialist';
import type { LlmAgentOutput } from './llm-base/llm-specialist';
import type { AgentTool } from './llm-base/types';
import type { VerticalId } from '@/knowledge/entities';
import {
  getShopSummaryTool,
  summariseAnswers,
  verticalMeta,
  type VerticalMeta,
} from './llm-base/shared-tools';

interface MunicipalityRawOutput {
  data: {
    explainAr: string;
    estimatedCostSar: { min: number; max: number };
    estimatedTimeAr: string;
    requirements: string[];
    criticalWarningAr?: string;
    commonMistakeAr?: string;
    licenceLabel: string;
  };
  outbox: Array<{
    to: AgentId | 'ALL';
    type: AgentMessage['type'];
    payload: Record<string, unknown>;
    messageAr: string;
  }>;
}

function deterministicLicenceLabel(vertical: VerticalId): string {
  switch (vertical) {
    case 'restaurant':
    case 'coffee':
      return 'رخصة بلدية (نشاط غذائي)';
    case 'grocery':
      return 'رخصة بلدية (تجزئة غذائية)';
    case 'salon':
      return 'رخصة بلدية (صالون / تجميل)';
    case 'laundry':
      return 'رخصة بلدية (مغسلة)';
  }
}

function deterministicCost(
  vertical: VerticalId,
  hasKitchen: boolean,
): { min: number; max: number } {
  const base =
    vertical === 'restaurant' || vertical === 'coffee'
      ? { min: 500, max: 3000 }
      : vertical === 'grocery'
        ? { min: 500, max: 2500 }
        : { min: 500, max: 2000 };
  if (hasKitchen) return { min: base.min + 500, max: base.max + 1500 };
  return base;
}

export class MunicipalityAgent extends LlmSpecialistAgent {
  readonly id: AgentId = 'municipality';
  readonly dependencies: readonly AgentId[] = ['civil_defense'];

  protected override blockedReason(_ctx: AgentContext, inbox: AgentMessage[]): string | null {
    const safetyCert = inbox.find(
      (m) =>
        m.from === 'civil_defense' &&
        m.type === 'dependency' &&
        m.payload?.safetyCertReady === true,
    );
    return safetyCert ? null : 'لم نستلم تأكيد شهادة السلامة من متخصّص الدفاع المدني';
  }

  protected systemPrompt(): string {
    return [
      'أنت متخصّص أمانة المنطقة (بلدي). توقيت تشغيلك: بعد ما تستلم شهادة السلامة من الدفاع المدني.',
      '',
      'القواعد:',
      '- استدعِ get_shop_summary لمعرفة النشاط والمدينة.',
      '- استدعِ get_balady_licence_label لتسمية الرخصة الصحيحة.',
      '- استدعِ estimate_balady_cost للسعر التقديري (مع hasKitchen من inbox).',
      '- اقرأ inbox: لو في warning من mohr_gosi بنطاق أحمر → أضف تحذير في criticalWarningAr.',
      '- لو nonGroundFloor=true ونشاط مطعم → أضف تحذير في criticalWarningAr.',
      '- في outbox: dependency لـ sfda + dependency لـ moh، كل واحدة فيها municipalityLicense + licenceLabel + hasKitchen.',
      '',
      'صيغة الإخراج النهائية: JSON واحد بدون نص قبل أو بعد:',
      '{ "data": { "explainAr": "...", "estimatedCostSar": {"min":0,"max":0}, "estimatedTimeAr": "...", "requirements": ["..."], "licenceLabel": "...", "criticalWarningAr": "...?", "commonMistakeAr": "..." }, "outbox": [...] }',
    ].join('\n');
  }

  protected userPrompt(context: AgentContext, inbox: AgentMessage[]): string {
    const safetyCert = inbox.find(
      (m) =>
        m.from === 'civil_defense' &&
        m.type === 'dependency' &&
        m.payload?.safetyCertReady === true,
    );
    const hasKitchen = Boolean(safetyCert?.payload?.hasKitchen);
    const nonGroundFloor = Boolean(safetyCert?.payload?.nonGroundFloor);
    const mohrWarning = inbox.find(
      (m) => m.from === 'mohr_gosi' && m.type === 'warning' && m.payload?.nitaqatZone === 'red',
    );
    return [
      `النشاط: ${verticalMeta(context.vertical).labelAr}`,
      context.cityLabelAr ? `المدينة: ${context.cityLabelAr}` : '',
      `hasKitchen: ${hasKitchen}`,
      `nonGroundFloor: ${nonGroundFloor}`,
      mohrWarning ? `تحذير نطاقات أحمر: ${mohrWarning.messageAr}` : '',
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
        name: 'get_balady_licence_label',
        description: 'يرجع التسمية الرسمية لرخصة البلدية حسب نوع النشاط.',
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
        handler: (input) => ({
          label: deterministicLicenceLabel(String(input.vertical) as VerticalId),
        }),
      },
      {
        name: 'estimate_balady_cost',
        description:
          'يقدّر تكلفة رخصة البلدية بناءً على النشاط ووجود مطبخ تجاري (يضيف SAR إضافية إذا hasKitchen=true).',
        input_schema: {
          type: 'object',
          properties: {
            vertical: {
              type: 'string',
              enum: ['coffee', 'restaurant', 'grocery', 'laundry', 'salon'],
            },
            has_kitchen: { type: 'boolean' },
          },
          required: ['vertical', 'has_kitchen'],
        },
        handler: (input) =>
          deterministicCost(String(input.vertical) as VerticalId, Boolean(input.has_kitchen)),
      },
    ];
  }

  protected parseOutput(finalText: string): LlmAgentOutput {
    const parsed = parseAgentJson<MunicipalityRawOutput>(finalText);
    if (!parsed.data || !Array.isArray(parsed.data.requirements)) {
      throw new Error('municipality: missing data.requirements');
    }
    if (!Array.isArray(parsed.outbox)) {
      throw new Error('municipality: missing outbox array');
    }
    return {
      data: {
        entityId: 'municipality',
        nameAr: 'أمانة المنطقة (بلدي)',
        nameSimpleAr: parsed.data.licenceLabel,
        explainAr: parsed.data.explainAr,
        estimatedCostSar: parsed.data.estimatedCostSar,
        estimatedTimeAr: parsed.data.estimatedTimeAr,
        officialUrl: 'https://balady.gov.sa',
        renewalMonths: 12,
        ...(parsed.data.criticalWarningAr
          ? { criticalWarningAr: parsed.data.criticalWarningAr }
          : {}),
        ...(parsed.data.commonMistakeAr ? { commonMistakeAr: parsed.data.commonMistakeAr } : {}),
        requirements: parsed.data.requirements,
      },
      outbox: parsed.outbox.map((m) => ({
        from: 'municipality' as AgentId,
        to: m.to,
        type: m.type,
        payload: {
          licenceLabel: parsed.data.licenceLabel,
          municipalityLicense: 'pending-issuance',
          ...m.payload,
        },
        messageAr: m.messageAr,
      })),
    };
  }

  protected fallback(context: AgentContext, inbox: AgentMessage[]): LlmAgentOutput {
    const safetyCert = inbox.find(
      (m) =>
        m.from === 'civil_defense' &&
        m.type === 'dependency' &&
        m.payload?.safetyCertReady === true,
    );
    const meta: VerticalMeta = verticalMeta(context.vertical);
    const hasKitchen = Boolean(safetyCert?.payload?.hasKitchen ?? meta.hasKitchen);
    const nonGroundFloor = Boolean(safetyCert?.payload?.nonGroundFloor);
    const cost = deterministicCost(context.vertical, hasKitchen);
    const licenceLabel = deterministicLicenceLabel(context.vertical);

    const requirements: string[] = [
      'إثبات الموافقة على الموقع في منصّة بلدي',
      'شهادة السلامة (مُستلمة من الدفاع المدني)',
    ];
    if (hasKitchen) requirements.push('ترخيص مطبخ تجاري — إضافي لأن المحل يحتوي مطبخ');

    const warnings: string[] = [];
    if (nonGroundFloor && context.vertical === 'restaurant') {
      warnings.push(
        'الموقع ليس في الدور الأرضي — بعض أنشطة المطاعم تتطلّب الدور الأرضي، راجع اشتراطات بلديتك قبل توقيع العقد.',
      );
    }
    const mohrWarning = inbox.find(
      (m) => m.from === 'mohr_gosi' && m.type === 'warning' && m.payload?.nitaqatZone === 'red',
    );
    if (mohrWarning) {
      warnings.push(
        'النطاق أحمر — بعض خدمات البلدية تتقيّد، وقد يُرفض طلب التجديد أو الإصدار الجديد حتى تصحيح النطاق.',
      );
    }
    const criticalWarningAr = warnings.length > 0 ? warnings.join(' ') : undefined;

    return {
      data: {
        entityId: 'municipality',
        nameAr: 'أمانة المنطقة (بلدي)',
        nameSimpleAr: licenceLabel,
        explainAr: 'الرخصة اللي تسمح لك تفتح محلك في الموقع. بدونها ما تقدر تشغّل النشاط رسمياً.',
        estimatedCostSar: cost,
        estimatedTimeAr: '٣ إلى ٧ أيام',
        officialUrl: 'https://balady.gov.sa',
        renewalMonths: 12,
        commonMistakeAr:
          'تحقّق من تطابق نشاطك المسجّل مع نوع رخصة البلدية على منصة بلدي قبل أي تجديد — تغيير النشاط بدون تحديث الرخصة يعرّضك لمخالفات.',
        ...(criticalWarningAr ? { criticalWarningAr } : {}),
        requirements,
      },
      outbox: [
        {
          from: 'municipality',
          to: 'sfda',
          type: 'dependency',
          payload: { municipalityLicense: 'pending-issuance', licenceLabel, hasKitchen },
          messageAr: `${licenceLabel} قيد الإصدار — تقدر تبدأ ترخيص الغذاء بالتوازي.`,
        },
        {
          from: 'municipality',
          to: 'moh',
          type: 'dependency',
          payload: { municipalityLicense: 'pending-issuance', licenceLabel },
          messageAr: `${licenceLabel} قيد الإصدار — تقدر تبدأ الترخيص الصحي.`,
        },
      ],
    };
  }
}
