/**
 * MOHR + GOSI — LLM-powered specialist.
 *
 * Computes nitaqat zone risk by employee headcount, surfaces the GOSI
 * monthly subscription, and emits a `warning` outbox message when the
 * shop is at risk of falling into the red zone.
 */

import type { AgentContext, AgentId, AgentMessage } from '../runtime/types';
import { LlmSpecialistAgent, parseAgentJson } from './llm-base/llm-specialist';
import type { LlmAgentOutput } from './llm-base/llm-specialist';
import type { AgentTool } from './llm-base/types';
import { getShopSummaryTool, summariseAnswers, verticalMeta } from './llm-base/shared-tools';

type NitaqatZone = 'green' | 'yellow' | 'red';

interface MohrGosiRawOutput {
  data: {
    explainAr: string;
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

function estimateNitaqat(employeeCount: number): NitaqatZone {
  if (employeeCount >= 50) return 'red';
  if (employeeCount >= 10) return 'yellow';
  return 'green';
}

export class MohrGosiAgent extends LlmSpecialistAgent {
  readonly id: AgentId = 'mohr_gosi';
  readonly dependencies: readonly AgentId[] = ['mci'];

  protected override blockedReason(_ctx: AgentContext, inbox: AgentMessage[]): string | null {
    const mci = inbox.find(
      (m) => m.from === 'mci' && m.type === 'data_share' && m.payload?.crReady === true,
    );
    return mci ? null : 'بانتظار إشعار جاهزية السجل التجاري';
  }

  protected systemPrompt(): string {
    return [
      'أنت متخصّص وزارة الموارد البشرية + التأمينات الاجتماعية. مسؤوليتك: ملف المنشأة (MOHR)،',
      'الاشتراك الشهري للتأمينات (GOSI)، وتقدير نطاقات بناءً على عدد الموظفين.',
      '',
      'القواعد:',
      '- استدعِ get_shop_summary لقراءة employeeCount.',
      '- استدعِ estimate_nitaqat_zone لتقدير اللون.',
      '- لو red: criticalWarningAr قاسٍ + outbox: warning لـ municipality + warning لـ mci.',
      '- لو yellow: criticalWarningAr تحذيري بدون outbox warnings.',
      '- لو green: ما تحتاج criticalWarningAr ولا outbox.',
      '',
      'صيغة الإخراج النهائية: JSON واحد بدون نص قبل أو بعد:',
      '{ "data": { "explainAr": "...", "estimatedTimeAr": "...", "requirements": ["..."], "criticalWarningAr": "...?", "commonMistakeAr": "...?" }, "outbox": [...] }',
    ].join('\n');
  }

  protected userPrompt(context: AgentContext): string {
    return [
      `النشاط: ${verticalMeta(context.vertical).labelAr}`,
      `عدد الموظفين: ${context.answers.op8_employee_count ?? 'غير محدّد'}`,
      'استخدم الـ tools ثم أخرج JSON النهائي.',
    ].join('\n');
  }

  protected tools(context: AgentContext): AgentTool[] {
    const summary = summariseAnswers(context.answers, context.vertical, context.cityLabelAr);
    return [
      getShopSummaryTool(summary),
      {
        name: 'estimate_nitaqat_zone',
        description:
          'تقدير لون نطاقات بناءً على عدد الموظفين: <١٠ أخضر، ١٠–٤٩ أصفر، ≥٥٠ أحمر. هذي تقديرات تقريبية لأن النسبة الفعلية تعتمد على نسبة السعودة.',
        input_schema: {
          type: 'object',
          properties: { employee_count: { type: 'number' } },
          required: ['employee_count'],
        },
        handler: (input) => {
          const count = Number(input.employee_count);
          return { zone: estimateNitaqat(count), employee_count: count };
        },
      },
    ];
  }

  protected parseOutput(finalText: string): LlmAgentOutput {
    const parsed = parseAgentJson<MohrGosiRawOutput>(finalText);
    if (!parsed.data || !Array.isArray(parsed.data.requirements)) {
      throw new Error('mohr_gosi: missing data.requirements');
    }
    const outbox = (parsed.outbox ?? []).map((m) => ({
      from: 'mohr_gosi' as AgentId,
      to: m.to,
      type: m.type,
      payload: m.payload,
      messageAr: m.messageAr,
    }));
    return {
      data: {
        entityId: 'mohr_gosi',
        nameAr: 'وزارة الموارد البشرية + التأمينات الاجتماعية',
        nameSimpleAr: 'ملف المنشأة + تأمينات',
        explainAr: parsed.data.explainAr,
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: parsed.data.estimatedTimeAr,
        officialUrl: 'https://www.hrsd.gov.sa',
        renewalMonths: 1,
        ...(parsed.data.criticalWarningAr
          ? { criticalWarningAr: parsed.data.criticalWarningAr }
          : {}),
        ...(parsed.data.commonMistakeAr ? { commonMistakeAr: parsed.data.commonMistakeAr } : {}),
        requirements: parsed.data.requirements,
      },
      outbox,
    };
  }

  protected fallback(context: AgentContext): LlmAgentOutput {
    const employeeCount =
      typeof context.answers.op8_employee_count === 'number'
        ? context.answers.op8_employee_count
        : 0;
    const zone = estimateNitaqat(employeeCount);
    const requirements = [
      'رقم السجل التجاري',
      'عنوان وطني للمنشأة',
      'تحديد نسبة التوطين المستهدفة',
    ];
    if (employeeCount >= 10) {
      requirements.push(
        'تأكّد من نسبة التوطين الفعلية على منصّة قوى — النطاق الأحمر يوقف كثير من الخدمات',
      );
    }
    const criticalWarningAr =
      zone === 'red'
        ? 'تقديريّاً: نطاق المنشأة مرشّح للأحمر — راجع نسبة التوطين فوراً، لأن أغلب الخدمات الحكومية تتقيّد في النطاق الأحمر.'
        : zone === 'yellow'
          ? 'تقديريّاً: النطاق قد يكون أصفر — نسبة التوطين تحتاج مراجعة قبل أي تجديد.'
          : undefined;

    const outbox: AgentMessage[] = [];
    if (zone === 'red') {
      outbox.push(
        {
          from: 'mohr_gosi',
          to: 'municipality',
          type: 'warning',
          payload: { nitaqatZone: 'red', employeeCount },
          messageAr:
            'تنبيه نطاقات: النطاق الأحمر — كثير من خدمات البلدية تتقيّد حتى يُصحَّح النطاق.',
        },
        {
          from: 'mohr_gosi',
          to: 'mci',
          type: 'warning',
          payload: { nitaqatZone: 'red', employeeCount },
          messageAr:
            'تنبيه نطاقات: تجديد السجل التجاري قد يتعرقل لو ضل النطاق أحمر — عالج التوطين قبل موعد التجديد.',
        },
      );
    }

    return {
      data: {
        entityId: 'mohr_gosi',
        nameAr: 'وزارة الموارد البشرية + التأمينات الاجتماعية',
        nameSimpleAr: 'ملف المنشأة + تأمينات',
        explainAr:
          'فتح ملف منشأة في وزارة الموارد البشرية (مطلوب لتوظيف أي شخص سعودي أو غير سعودي) ' +
          'وتسجيل الاشتراك في التأمينات الاجتماعية الشهري لكل موظف.',
        estimatedCostSar: { min: 0, max: 0 },
        estimatedTimeAr: 'يوم واحد (إلكتروني لكل الخطوتين)',
        officialUrl: 'https://www.hrsd.gov.sa',
        renewalMonths: 1,
        ...(criticalWarningAr ? { criticalWarningAr } : {}),
        requirements,
      },
      outbox,
    };
  }
}
