/**
 * Real AgentBus — not a UI log helper.
 *
 * Each registered agent has an isolated inbox. When another agent sends a
 * message targeting this agent, the bus pushes it into that inbox — and
 * the target agent's next run() observes it. Messages with `to: 'ALL'`
 * are fanned out to every registered agent except the sender.
 *
 * `allMessages()` returns a chronological log that the UI can mirror.
 * The bus itself doesn't touch the UI — the orchestrator pipes messages
 * to the plan-store so the timeline stays observable.
 */

import type { AgentId, AgentMessage } from './types';

export class AgentBus {
  private readonly inboxes = new Map<AgentId, AgentMessage[]>();
  private readonly log: AgentMessage[] = [];

  register(agentId: AgentId): void {
    if (!this.inboxes.has(agentId)) this.inboxes.set(agentId, []);
  }

  /** Returns the registered agent ids — used for ALL-broadcast targeting. */
  registered(): AgentId[] {
    return [...this.inboxes.keys()];
  }

  deliver(messages: readonly AgentMessage[]): AgentMessage[] {
    const delivered: AgentMessage[] = [];
    for (const msg of messages) {
      if (msg.to === 'ALL') {
        for (const [id, inbox] of this.inboxes) {
          if (id === msg.from) continue; // sender doesn't receive its own broadcast
          inbox.push(msg);
        }
      } else {
        const inbox = this.inboxes.get(msg.to);
        if (inbox) inbox.push(msg);
        // If `msg.to` isn't a registered agent in this run, the message is
        // dropped for bus purposes but still logged for the UI.
      }
      this.log.push(msg);
      delivered.push(msg);
    }
    return delivered;
  }

  /** Snapshot of the agent's inbox at this moment. */
  getInbox(agentId: AgentId): AgentMessage[] {
    return [...(this.inboxes.get(agentId) ?? [])];
  }

  allMessages(): readonly AgentMessage[] {
    return this.log;
  }
}
