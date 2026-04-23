/**
 * Agent orchestrator runtime.
 *
 * Runs a set of `Agent`s in dependency-ordered waves. In each wave:
 *   1. Pick agents whose dependency set is satisfied AND who haven't run yet
 *      AND who haven't been retired as blocked past their patience.
 *   2. Run them in parallel with Promise.all.
 *   3. Deliver their outbox messages through the bus.
 *   4. Any agent that returned `blocked` can be re-attempted in a later wave
 *      once new messages arrive — up to MAX_BLOCKED_RETRIES.
 *
 * Deadlock detection: if a wave has NO ready-or-retryable agents and there
 * are still pending ones, the orchestrator throws. That surfaces a real
 * bug — typo in a dependency, missing agent, circular dep — instead of
 * silently hanging.
 */

import { AgentBus } from './agent-bus';
import type { Agent, AgentContext, AgentId, AgentMessage, AgentResult } from './types';

const MAX_BLOCKED_RETRIES = 3;
const MAX_WAVES = 16;

export interface RunEvent {
  waveNumber: number;
  agentId: AgentId;
  /** Matches AgentResult['status']: 'complete' | 'blocked' | 'error'. */
  status: AgentResult['status'];
  result: AgentResult;
}

export interface AgentRunHooks {
  /** Called once when an agent begins its run in a wave. */
  onAgentStart?: (agentId: AgentId, wave: number) => void | Promise<void>;
  /** Called once the agent returns with any status. */
  onAgentFinish?: (event: RunEvent) => void | Promise<void>;
  /** Called for every message the bus actually delivered this wave. */
  onMessages?: (messages: readonly AgentMessage[]) => void | Promise<void>;
}

export interface RunAgentsResult {
  completed: AgentId[];
  blocked: AgentId[];
  errored: AgentId[];
  results: Map<AgentId, AgentResult>;
  allMessages: readonly AgentMessage[];
  waves: number;
}

export async function runAgents(
  agents: readonly Agent[],
  context: AgentContext,
  hooks: AgentRunHooks = {},
): Promise<RunAgentsResult> {
  const bus = new AgentBus();
  for (const a of agents) bus.register(a.id);

  const results = new Map<AgentId, AgentResult>();
  const completed = new Set<AgentId>();
  const errored = new Set<AgentId>();
  const blockedCount = new Map<AgentId, number>();
  const pending = new Set<AgentId>(agents.map((a) => a.id));

  let waveNumber = 0;
  while (pending.size > 0) {
    waveNumber += 1;
    if (waveNumber > MAX_WAVES) {
      throw new Error(`Agent orchestrator exceeded ${MAX_WAVES} waves — likely circular dep`);
    }

    const ready = agents.filter((a) => {
      if (!pending.has(a.id)) return false;
      // Dependencies must all have completed successfully.
      if (!a.dependencies.every((d) => completed.has(d))) return false;
      // If this agent was blocked before, give it a fresh chance only when
      // NEW messages are in its inbox (we approximate by counting retries).
      const tries = blockedCount.get(a.id) ?? 0;
      return tries <= MAX_BLOCKED_RETRIES;
    });

    if (ready.length === 0) {
      // Nothing we can run — remaining agents are either deadlocked on deps
      // that'll never arrive, or retried past the limit.
      const stuck = [...pending].join(', ');
      throw new Error(`Agent orchestrator deadlocked at wave ${waveNumber}; stuck: ${stuck}`);
    }

    const waveOutcomes = await Promise.all(
      ready.map(async (agent): Promise<{ agent: Agent; result: AgentResult }> => {
        await hooks.onAgentStart?.(agent.id, waveNumber);
        const inbox = bus.getInbox(agent.id);
        try {
          const result = await agent.run(context, inbox);
          return { agent, result };
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          return { agent, result: { status: 'error', error: errMsg } };
        }
      }),
    );

    // Gather outbox messages from completed/errored agents; deliver in order.
    const toDeliver: AgentMessage[] = [];
    for (const { agent, result } of waveOutcomes) {
      results.set(agent.id, result);
      if (result.status === 'complete') {
        completed.add(agent.id);
        pending.delete(agent.id);
        toDeliver.push(...result.outbox);
      } else if (result.status === 'error') {
        errored.add(agent.id);
        pending.delete(agent.id);
        if (result.outbox) toDeliver.push(...result.outbox);
      } else {
        // blocked — stays in pending, bump retry counter
        blockedCount.set(agent.id, (blockedCount.get(agent.id) ?? 0) + 1);
      }
      await hooks.onAgentFinish?.({
        waveNumber,
        agentId: agent.id,
        status: result.status,
        result,
      });
    }

    if (toDeliver.length > 0) {
      const delivered = bus.deliver(toDeliver);
      await hooks.onMessages?.(delivered);
    }

    // Safety: if every still-pending agent is blocked past retries, stop.
    const stillRetryable = [...pending].some(
      (id) => (blockedCount.get(id) ?? 0) <= MAX_BLOCKED_RETRIES,
    );
    if (!stillRetryable && pending.size > 0) {
      // Mark as errored rather than hanging.
      for (const id of pending) {
        errored.add(id);
        const tries = blockedCount.get(id) ?? 0;
        results.set(id, {
          status: 'error',
          error: `blocked past ${tries} retries — upstream dependency never delivered`,
        });
      }
      pending.clear();
    }
  }

  const blocked = [...results.entries()]
    .filter(([, r]) => r.status === 'blocked')
    .map(([id]) => id);

  return {
    completed: [...completed],
    blocked,
    errored: [...errored],
    results,
    allMessages: bus.allMessages(),
    waves: waveNumber,
  };
}
