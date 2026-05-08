/**
 * Claude tool-use loop runner.
 *
 * Drives a single specialist's reasoning. Loops until Claude returns
 * `stop_reason !== 'tool_use'`, executing tool handlers locally and feeding
 * results back. All token counts and latencies are captured into an
 * AgentTrace so the UI can replay the run.
 */

import type Anthropic from '@anthropic-ai/sdk';
import { anthropic, hasApiKey, MissingApiKeyError, MODELS } from '@/lib/claude';
import type { AgentId } from '../../runtime/types';
import type { AgentTool, AgentTrace, LlmIteration, ToolCallRecord } from './types';

const MAX_ITERATIONS = 6;
const DEFAULT_MAX_TOKENS = 1500;

type AnthropicMessage = Anthropic.Messages.MessageParam;
type AnthropicResponse = Anthropic.Messages.Message;
type AnthropicTool = Anthropic.Messages.Tool;

export interface RunToolLoopArgs {
  agentId: AgentId;
  systemPrompt: string;
  userPrompt: string;
  tools: AgentTool[];
  /** Bounds total tool-use rounds. Default 6. */
  maxIterations?: number;
  /** Bounds output tokens per round. Default 1500. */
  maxTokens?: number;
  model?: (typeof MODELS)[keyof typeof MODELS];
}

export interface RunToolLoopResult {
  finalText: string;
  trace: AgentTrace;
}

/**
 * Public entry point. Throws on:
 *   - Missing ANTHROPIC_API_KEY (caller catches → fallback path).
 *   - Iteration cap reached without final text.
 *   - Claude returning no text and no tool_use.
 *
 * Tool handlers that throw are surfaced back to Claude as
 * `is_error: true` tool_results — the LLM can recover, so we don't
 * abort the whole run.
 */
export async function runToolLoop(args: RunToolLoopArgs): Promise<RunToolLoopResult> {
  if (!hasApiKey()) throw new MissingApiKeyError();

  const model = args.model ?? MODELS.sonnet;
  const maxIterations = args.maxIterations ?? MAX_ITERATIONS;
  const maxTokens = args.maxTokens ?? DEFAULT_MAX_TOKENS;
  const toolByName = new Map(args.tools.map((t) => [t.name, t]));
  const sdkTools: AnthropicTool[] = args.tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.input_schema as AnthropicTool['input_schema'],
  }));

  const messages: AnthropicMessage[] = [{ role: 'user', content: args.userPrompt }];
  const iterations: LlmIteration[] = [];
  let finalText = '';
  const t0 = Date.now();

  for (let i = 0; i < maxIterations; i++) {
    const callStart = Date.now();
    const response: AnthropicResponse = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: args.systemPrompt,
      tools: sdkTools,
      messages,
    });
    const callLatency = Date.now() - callStart;

    const reasoning = response.content
      .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    const toolUseBlocks = response.content.filter(
      (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
    );

    const toolCalls: ToolCallRecord[] = [];
    for (const block of toolUseBlocks) {
      const tool = toolByName.get(block.name);
      const handlerStart = Date.now();
      let output: unknown;
      let errored = false;
      if (!tool) {
        errored = true;
        output = { error: `unknown tool: ${block.name}` };
      } else {
        try {
          output = await tool.handler((block.input ?? {}) as Record<string, unknown>);
        } catch (err) {
          errored = true;
          output = {
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }
      toolCalls.push({
        name: block.name,
        input: (block.input ?? {}) as Record<string, unknown>,
        output,
        durationMs: Date.now() - handlerStart,
        errored,
      });
    }

    const iteration: LlmIteration = {
      ...(reasoning ? { reasoning } : {}),
      toolCalls,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      latencyMs: callLatency,
      stopReason: response.stop_reason ?? 'unknown',
    };
    iterations.push(iteration);

    if (response.stop_reason === 'tool_use' && toolUseBlocks.length > 0) {
      // Append the assistant's full content (text + tool_use) and our tool results.
      messages.push({ role: 'assistant', content: response.content });
      messages.push({
        role: 'user',
        content: toolUseBlocks.map((block, idx) => {
          const call = toolCalls[idx];
          // Defensive: tool_use blocks and tool_calls are zipped 1:1 above.
          // If the index is somehow out of range we fall through with an empty result.
          const output = call?.output ?? null;
          const errored = call?.errored ?? false;
          return {
            type: 'tool_result' as const,
            tool_use_id: block.id,
            content: JSON.stringify(output),
            ...(errored ? { is_error: true } : {}),
          };
        }),
      });
      continue;
    }

    // Terminal stop reason — extract final text.
    finalText = reasoning;
    break;
  }

  if (!finalText) {
    throw new Error(`tool loop ended without final text after ${iterations.length} iterations`);
  }

  const totalInputTokens = iterations.reduce((s, it) => s + it.inputTokens, 0);
  const totalOutputTokens = iterations.reduce((s, it) => s + it.outputTokens, 0);

  return {
    finalText,
    trace: {
      agentId: args.agentId,
      mode: 'live',
      model,
      iterations,
      totalLatencyMs: Date.now() - t0,
      totalInputTokens,
      totalOutputTokens,
      finalText,
    },
  };
}
