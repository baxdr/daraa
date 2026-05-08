/**
 * LLM specialist — shared types.
 *
 * Every specialist that extends LlmSpecialistAgent emits one AgentTrace
 * per run, recording exactly what Claude did: which tools it called, the
 * tokens it consumed, the wall-clock latency. The orchestrator persists
 * traces alongside RunRecords so the /agents-live UI can replay them.
 */

import type { AgentId } from '../../runtime/types';

export type AgentRunMode = 'live' | 'fallback';

export interface ToolCallRecord {
  name: string;
  input: Record<string, unknown>;
  output: unknown;
  /** Wall-clock duration of the tool handler — usually <5ms for our deterministic tools. */
  durationMs: number;
  /** True when the handler threw and we surfaced an error result back to Claude. */
  errored: boolean;
}

export interface LlmIteration {
  /** Claude's text output before this iteration's tool calls (chain-of-thought / explanation). */
  reasoning?: string;
  toolCalls: ToolCallRecord[];
  inputTokens: number;
  outputTokens: number;
  /** Round-trip latency for this single Claude call. */
  latencyMs: number;
  /** stop_reason from the SDK — `tool_use` means another iteration follows. */
  stopReason: string;
}

export interface AgentTrace {
  agentId: AgentId;
  mode: AgentRunMode;
  model: string;
  iterations: LlmIteration[];
  totalLatencyMs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  /** Final assistant text — usually the JSON envelope the agent returns. */
  finalText?: string;
  /** Set when mode === 'fallback'. */
  fallbackReason?: string;
}

/**
 * Tool definition consumed by the runner. The handler can be sync or async,
 * receives the validated input, and returns whatever JSON-serializable shape
 * makes sense for the LLM to read.
 *
 * The handler is typed as `unknown` input — Claude validates against the
 * input_schema before calling. Subclasses cast inside the handler body
 * since the SDK doesn't surface the schema-derived type.
 */
export interface AgentTool {
  name: string;
  /** Sent to Claude — keep concise, Arabic+English friendly. */
  description: string;
  /** JSON schema, passed straight to the SDK as `input_schema`. */
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  handler: (input: Record<string, unknown>) => Promise<unknown> | unknown;
}
