/**
 * Base class for Claude-powered specialists.
 *
 * Subclasses define:
 *   - id, dependencies, model
 *   - systemPrompt(context, inbox) — the agent's persona + ground rules
 *   - userPrompt(context, inbox)   — the per-run question
 *   - tools(context, inbox)        — Claude callable tools
 *   - parseOutput(text)            — final text → { data, outbox }
 *   - blockedReason(inbox)         — return string when inbox is missing required signals
 *   - fallback(context, inbox)     — pure deterministic path used when Claude is unreachable
 *
 * The base class handles:
 *   - Inbox blocking checks (returns AgentResult with status: 'blocked').
 *   - Calling the tool-loop runner.
 *   - Catching all errors and degrading gracefully to fallback().
 *   - Building the AgentResult envelope (data + outbox + trace).
 */

import { hasApiKey, MODELS } from '@/lib/claude';
import type {
  Agent,
  AgentContext,
  AgentId,
  AgentMessage,
  AgentResult,
  EntityInfo,
} from '../../runtime/types';
import { runToolLoop } from './tool-runner';
import type { AgentTool, AgentTrace } from './types';

export interface LlmAgentOutput {
  data: EntityInfo;
  outbox: AgentMessage[];
}

export abstract class LlmSpecialistAgent implements Agent {
  abstract readonly id: AgentId;
  abstract readonly dependencies: readonly AgentId[];
  protected readonly model: (typeof MODELS)[keyof typeof MODELS] = MODELS.sonnet;
  protected readonly maxIterations: number = 6;
  protected readonly maxTokens: number = 1500;

  /** Inbox-driven gating. Return null when ready, or an Arabic reason string. */
  protected blockedReason(_context: AgentContext, _inbox: AgentMessage[]): string | null {
    return null;
  }

  protected abstract systemPrompt(context: AgentContext, inbox: AgentMessage[]): string;
  protected abstract userPrompt(context: AgentContext, inbox: AgentMessage[]): string;
  protected abstract tools(context: AgentContext, inbox: AgentMessage[]): AgentTool[];

  /** Parse Claude's final text into a structured output. Throws on invalid JSON. */
  protected abstract parseOutput(finalText: string, context: AgentContext): LlmAgentOutput;

  /** Deterministic path. Used when Claude can't run (no key, error, parse failure). */
  protected abstract fallback(context: AgentContext, inbox: AgentMessage[]): LlmAgentOutput;

  async run(context: AgentContext, inbox: AgentMessage[]): Promise<AgentResult> {
    const blocked = this.blockedReason(context, inbox);
    if (blocked) return { status: 'blocked', reason: blocked };

    if (!hasApiKey()) {
      const out = this.fallback(context, inbox);
      return {
        status: 'complete',
        data: out.data,
        outbox: out.outbox,
        trace: this.fallbackTrace('ANTHROPIC_API_KEY missing'),
      };
    }

    try {
      const result = await runToolLoop({
        agentId: this.id,
        systemPrompt: this.systemPrompt(context, inbox),
        userPrompt: this.userPrompt(context, inbox),
        tools: this.tools(context, inbox),
        maxIterations: this.maxIterations,
        maxTokens: this.maxTokens,
        model: this.model,
      });

      let parsed: LlmAgentOutput;
      try {
        parsed = this.parseOutput(result.finalText, context);
      } catch (parseErr) {
        const reason = parseErr instanceof Error ? parseErr.message : String(parseErr);
        const out = this.fallback(context, inbox);
        return {
          status: 'complete',
          data: out.data,
          outbox: out.outbox,
          trace: this.attachFallbackReason(result.trace, `parse failed: ${reason}`),
        };
      }

      return {
        status: 'complete',
        data: parsed.data,
        outbox: parsed.outbox,
        trace: result.trace,
      };
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err);
      console.warn(`[${this.id}] LLM run failed, using fallback:`, reason);
      const out = this.fallback(context, inbox);
      return {
        status: 'complete',
        data: out.data,
        outbox: out.outbox,
        trace: this.fallbackTrace(reason),
      };
    }
  }

  private fallbackTrace(reason: string): AgentTrace {
    return {
      agentId: this.id,
      mode: 'fallback',
      model: this.model,
      iterations: [],
      totalLatencyMs: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      fallbackReason: reason,
    };
  }

  private attachFallbackReason(trace: AgentTrace, reason: string): AgentTrace {
    return {
      ...trace,
      mode: 'fallback',
      fallbackReason: reason,
    };
  }
}

/**
 * Helper used by subclasses' parseOutput — strips markdown code fences and
 * parses JSON. Throws a typed error on failure so the base class can switch
 * to fallback.
 */
export function parseAgentJson<T>(text: string): T {
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/\s*```$/, '');
  // Tolerate trailing chatter after the JSON block — find the outermost {…}.
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error('no JSON object in response');
  }
  const slice = cleaned.slice(firstBrace, lastBrace + 1);
  return JSON.parse(slice) as T;
}
