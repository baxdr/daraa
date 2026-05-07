/**
 * Research Agent.
 *
 * Pulls recent regulatory updates relevant to the agents about to run. Uses
 * Claude + web_search tool when available; falls back to the curated
 * FALLBACK_UPDATES list on any failure (missing API key, SDK shape mismatch,
 * rate limit, network, JSON parse).
 *
 * Emits each update as an A2A `update` message addressed to the specialist
 * it targets — e.g. research → sfda for an SFDA rule change.
 */

import { anthropic, hasApiKey, MODELS } from '@/lib/claude';
import { send, type RunRef } from '@/lib/agent-bus';
import { AGENT_LABELS_AR, type AgentId } from '@/agents/types';

const VALID_AGENT_IDS = new Set<string>(Object.keys(AGENT_LABELS_AR));
function isAgentId(x: unknown): x is AgentId {
  return typeof x === 'string' && VALID_AGENT_IDS.has(x);
}

export interface RegulatoryUpdate {
  /** Which entity specialist this update targets. */
  entity: AgentId;
  /** Arabic summary of the update. */
  summaryAr: string;
  /** Effective / announcement date, if known. */
  date?: string;
  /** Source domain label, e.g. "sfda.gov.sa". */
  source: string;
  fromFallback: boolean;
}

/* ------------------------------------------------------------------------- */
/* Static fallback — curated recent updates across the main regulators.      */
/* These are deliberately conservative, dated, and sourced to real portals.  */
/* ------------------------------------------------------------------------- */
const FALLBACK_UPDATES: RegulatoryUpdate[] = [
  {
    entity: 'pdpl_nca',
    summaryAr:
      'SDAIA أصدرت نسخة محدثة من اللائحة التنفيذية لنظام حماية البيانات الشخصية؛ تفاصيل إضافية حول متطلبات الإشعار بالحوادث وتدريب DPO.',
    date: '2026-03-18',
    source: 'sdaia.gov.sa',
    fromFallback: true,
  },
  {
    entity: 'sfda',
    summaryAr: 'SFDA: اشتراط عرض السعرات الحرارية للمشروبات في قوائم المقاهي دخل حيز التنفيذ.',
    date: '2026-02-01',
    source: 'sfda.gov.sa',
    fromFallback: true,
  },
  {
    entity: 'zatca',
    summaryAr:
      'ZATCA: الموجة الجديدة من الفوترة الإلكترونية (المرحلة الثانية) تطبّق على المنشآت التي تجاوزت إيراداتها 2 مليون ريال.',
    date: '2026-01-15',
    source: 'zatca.gov.sa',
    fromFallback: true,
  },
  {
    entity: 'mohr_gosi',
    summaryAr:
      'تحديث نسب السعودة في برنامج نطاقات لعدد من الأنشطة — الرياض تحديداً شهدت رفع النسب في قطاع الخدمات الغذائية.',
    date: '2026-01-01',
    source: 'hrsd.gov.sa',
    fromFallback: true,
  },
];

/**
 * Run the research agent. Emits messages to the specialists affected.
 * Returns the raw list of updates so the orchestrator / report can reference.
 */
export async function runResearchAgent(
  run: RunRef,
  activeAgents: AgentId[],
): Promise<RegulatoryUpdate[]> {
  const updates = await fetchUpdates(activeAgents);

  // Broadcast each update to its target specialist as an `update` message.
  for (const u of updates) {
    if (!activeAgents.includes(u.entity)) continue;
    send(run, {
      from: 'research',
      to: u.entity,
      type: 'update',
      messageAr: u.summaryAr,
      payload: { date: u.date, source: u.source, fromFallback: u.fromFallback },
    });
  }

  return updates;
}

async function fetchUpdates(activeAgents: AgentId[]): Promise<RegulatoryUpdate[]> {
  // Without an API key we skip the web_search attempt entirely.
  if (!hasApiKey()) return relevantFallback(activeAgents);

  try {
    return await fetchWithClaudeWebSearch(activeAgents);
  } catch (err) {
    console.warn(
      '[research] web_search failed, falling back:',
      err instanceof Error ? err.message : err,
    );
    return relevantFallback(activeAgents);
  }
}

function relevantFallback(activeAgents: AgentId[]): RegulatoryUpdate[] {
  return FALLBACK_UPDATES.filter((u) => activeAgents.includes(u.entity));
}

/* ------------------------------------------------------------------------- */
/* Live path — Claude with web_search tool. Defensive: any schema drift in   */
/* the tool response, or an SDK that hasn't enabled the beta, falls through  */
/* to the fallback list.                                                     */
/* ------------------------------------------------------------------------- */
async function fetchWithClaudeWebSearch(activeAgents: AgentId[]): Promise<RegulatoryUpdate[]> {
  const QUERIES: Partial<Record<AgentId, string>> = {
    pdpl_nca: 'آخر تحديثات SDAIA نظام حماية البيانات الشخصية 2026',
    sfda: 'تحديثات هيئة الغذاء والدواء السعودية اشتراطات جديدة 2026',
    municipality: 'تحديثات رخص البلدية أمانة الرياض 2026',
    zatca: 'تحديثات الفوترة الإلكترونية ZATCA 2026',
    mohr_gosi: 'تحديثات نطاقات وزارة الموارد البشرية 2026',
    civil_defense: 'اشتراطات الدفاع المدني السعودي 2026',
    mci: 'تحديثات وزارة التجارة السعودية 2026',
  };
  const queries = activeAgents
    .map((a) => ({ agent: a, query: QUERIES[a] }))
    .filter((q): q is { agent: AgentId; query: string } => Boolean(q.query));

  if (queries.length === 0) return [];

  const promptLines = queries.map((q) => `- [${q.agent}] ${q.query}`).join('\n');

  // The web_search tool isn't type-exported by the SDK version we target, so
  // we pass it as a loose tool object and trust the try/catch boundary to
  // handle any shape mismatch.
  const tools = [{ type: 'web_search_20250305', name: 'web_search' }] as unknown as Parameters<
    typeof anthropic.messages.create
  >[0]['tools'];
  const res = await anthropic.messages.create({
    model: MODELS.sonnet,
    max_tokens: 2000,
    ...(tools ? { tools } : {}),
    messages: [
      {
        role: 'user',
        content:
          `ابحث على الويب عن التحديثات التنظيمية السعودية التالية. أرجع فقط الوقائع المنشورة في مواقع رسمية (gov.sa) أو تقارير إعلامية موثوقة.\n\n` +
          `لكل بند، أخرج JSON array في رسالة نصية واحدة على الشكل:\n` +
          `[{"entity": "agent_id كما ظهر في السؤال", "summaryAr": "جملة واحدة", "date": "YYYY-MM-DD", "source": "gov.sa domain"}]\n\n` +
          `البحث المطلوب:\n${promptLines}\n\n` +
          `أخرج JSON فقط، بدون نص تمهيدي.`,
      },
    ],
  });

  const textBlock = res.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') throw new Error('no text in response');
  const parsed = JSON.parse(
    textBlock.text
      .replace(/^```json\s*/i, '')
      .replace(/```$/, '')
      .trim(),
  );

  if (!Array.isArray(parsed)) throw new Error('research payload is not an array');

  const out: RegulatoryUpdate[] = [];
  for (const raw of parsed) {
    if (typeof raw !== 'object' || raw === null) continue;
    const u = raw as Record<string, unknown>;
    if (!isAgentId(u.entity)) continue; // reject LLM hallucination of an unknown agent id
    if (typeof u.summaryAr !== 'string' || !u.summaryAr) continue;
    if (typeof u.source !== 'string' || !u.source) continue;
    const date = typeof u.date === 'string' ? u.date : undefined;
    out.push({
      entity: u.entity,
      summaryAr: u.summaryAr,
      ...(date ? { date } : {}),
      source: u.source,
      fromFallback: false,
    });
  }
  return out;
}
