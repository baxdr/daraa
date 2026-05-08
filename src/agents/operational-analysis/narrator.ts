/**
 * Operational analysis — LLM narrator pass.
 *
 * Wraps a deterministic OperationalReport with a Claude-generated
 * narrative + priority list. The deterministic numbers (deadlines, fine
 * ceilings, severity) are NEVER overwritten — the narrator only adds
 * Arabic prose synthesis and re-orders the top-3 actions.
 *
 * Falls back gracefully (no narrative, no trace) when Claude is
 * unreachable — the call site treats the enrichment as optional.
 */

import { hasApiKey } from '@/lib/claude';
import type { Answers } from '../chat-flow';
import type { AgentTraceLike } from '../runtime/types';
import { runToolLoop } from '../specialists/llm-base/tool-runner';
import { parseAgentJson } from '../specialists/llm-base/llm-specialist';
import type { AgentTool } from '../specialists/llm-base/types';
import type { OperationalGap, OperationalReport } from './types';

interface NarratorOutput {
  narrative: string;
  priorityActions: string[];
}

export async function enrichOperationalReport(
  report: OperationalReport,
  answers: Answers,
): Promise<OperationalReport> {
  if (!hasApiKey()) return report;

  // Skip the LLM pass entirely when there's nothing to narrate. The
  // empty path is the most common one in tests + smoke runs.
  if (report.gaps.length === 0) return report;

  try {
    const tools = buildTools(report);
    const result = await runToolLoop({
      agentId: 'analysis',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt: buildUserPrompt(report, answers),
      tools,
      maxIterations: 4,
      maxTokens: 1200,
    });

    const parsed = parseAgentJson<NarratorOutput>(result.finalText);
    if (typeof parsed.narrative !== 'string' || !Array.isArray(parsed.priorityActions)) {
      return report;
    }

    const trace: AgentTraceLike = {
      agentId: 'analysis',
      mode: result.trace.mode,
      model: result.trace.model,
      iterations: result.trace.iterations,
      totalLatencyMs: result.trace.totalLatencyMs,
      totalInputTokens: result.trace.totalInputTokens,
      totalOutputTokens: result.trace.totalOutputTokens,
      ...(result.trace.finalText ? { finalText: result.trace.finalText } : {}),
    };

    return {
      ...report,
      narrative: parsed.narrative,
      priorityActions: parsed.priorityActions.slice(0, 3),
      trace,
    };
  } catch (err) {
    console.warn(
      '[analysis-narrator] LLM enrichment failed:',
      err instanceof Error ? err.message : err,
    );
    return report;
  }
}

const SYSTEM_PROMPT = [
  'أنت محلّل امتثال تشغيلي للمحلات السعودية الصغيرة. مهمّتك: قراءة تقرير ثغرات (gaps) جاهز،',
  'فهم الصورة الكاملة، وكتابة:',
  '1) narrative — فقرة عربية مختصرة (٣–٥ جمل) تشرح الوضع كأن صديق يفهم في النظام يكلّم صاحب المحل.',
  '2) priorityActions — أهم ٣ خطوات يبدأ فيها صاحب المحل هذا الأسبوع، مرتبة بالأولوية.',
  '',
  'القواعد:',
  '- لا تخترع أرقاماً أو تواريخ — استدعِ الـ tools لقراءة الـ gaps.',
  '- ركّز على الترابط بين الثغرات (مثلاً: نطاق أحمر + رخصة بلدية قاربت = مشكلة مضاعفة).',
  '- لو في تجاوز للوائح (severity=critical)، أبرزه في أول جملة.',
  '- اللغة: عربية بسيطة، نبرة صديق محايد، بدون لغة تسويقية.',
  '',
  'صيغة الإخراج النهائية: JSON واحد بدون نص قبل أو بعد:',
  '{ "narrative": "...", "priorityActions": ["...", "...", "..."] }',
].join('\n');

function buildUserPrompt(report: OperationalReport, answers: Answers): string {
  const vertical = answers.op1_vertical ?? 'غير محدّد';
  const employees = answers.op8_employee_count ?? 0;
  return [
    `النشاط: ${vertical} | عدد الموظفين: ${employees}`,
    `صحة الرخص: ${report.healthScore}٪`,
    `إجمالي الثغرات: ${report.gaps.length} (متأخرة ${report.overdue.length}، قادمة ${report.upcomingRenewals.length})`,
    'استدعِ list_gaps أولاً، ثم get_gap_details للأهم منها، ثم أخرج JSON النهائي.',
  ].join('\n');
}

function buildTools(report: OperationalReport): AgentTool[] {
  const gapById = new Map(report.gaps.map((g) => [g.id, g]));
  return [
    {
      name: 'list_gaps',
      description:
        'يرجع قائمة الثغرات المرصودة في التقرير: id, severity, category, titleAr, daysUntilDeadline.',
      input_schema: { type: 'object', properties: {} },
      handler: () =>
        report.gaps.map((g) => ({
          id: g.id,
          severity: g.severity,
          category: g.category,
          title: g.titleAr,
          days_until_deadline: Number.isNaN(g.daysUntilDeadline) ? null : g.daysUntilDeadline,
          fine_ceiling_sar: g.fineCeilingSar ?? null,
        })),
    },
    {
      name: 'get_gap_details',
      description: 'يرجع التفاصيل الكاملة لثغرة محددة (id، الشرح، الإجراء المقترح).',
      input_schema: {
        type: 'object',
        properties: { id: { type: 'string' } },
        required: ['id'],
      },
      handler: (input) => {
        const id = String(input.id);
        const g: OperationalGap | undefined = gapById.get(id);
        if (!g) return { error: `unknown gap id: ${id}` };
        return {
          id: g.id,
          severity: g.severity,
          category: g.category,
          titleAr: g.titleAr,
          explanationAr: g.explanationAr,
          actionAr: g.actionAr,
          daysUntilDeadline: Number.isNaN(g.daysUntilDeadline) ? null : g.daysUntilDeadline,
          dueDate: g.dueDate || null,
          fineCeilingSar: g.fineCeilingSar ?? null,
          officialUrl: g.officialUrl ?? null,
        };
      },
    },
  ];
}
