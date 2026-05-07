import { describe, it, expect } from 'vitest';
import { makeRecorder, MemorySink } from '@/agents/runtime/telemetry';
import { runAgents } from '@/agents/runtime/orchestrator-runtime';
import type { Agent, AgentContext, AgentMessage, AgentResult } from '@/agents/runtime/types';
import type { AgentId } from '@/agents/types';

const baseContext: AgentContext = {
  mode: 'establishment',
  vertical: 'tech',
  answers: { q_company_name: 'Daraa Test' },
};

class StubAgent implements Agent {
  constructor(
    public readonly id: AgentId,
    public readonly dependencies: readonly AgentId[] = [],
    private readonly outcome: AgentResult = stubComplete('stub'),
  ) {}
  async run(): Promise<AgentResult> {
    return this.outcome;
  }
}

function stubComplete(messageAr: string, payload: Record<string, unknown> = {}): AgentResult {
  const out: AgentMessage[] = [
    {
      from: 'mci',
      to: 'ALL',
      type: 'data_share',
      messageAr,
      payload,
    },
  ];
  return {
    status: 'complete',
    data: {
      entityId: 'mci',
      nameAr: 'وزارة التجارة',
      nameSimpleAr: 'السجل التجاري',
      explainAr: 'stub',
      estimatedCostSar: { min: 0, max: 0 },
      estimatedTimeAr: 'يوم',
    },
    outbox: out,
  };
}

describe('telemetry recorder', () => {
  it('captures start + finish events for every agent', async () => {
    const agents: Agent[] = [new StubAgent('mci')];
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents(agents, baseContext, recorder.hooks);
    const record = recorder.finish();

    const phases = record.events.map((e) => e.phase);
    expect(phases).toEqual(['start', 'finish']);
    expect(record.events[0]!.agentId).toBe('mci');
    expect(record.events[1]!.status).toBe('complete');
    expect(record.events[1]!.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('seq is monotonically increasing per run', async () => {
    const agents: Agent[] = [new StubAgent('mci'), new StubAgent('zatca', ['mci'])];
    const recorder = makeRecorder(baseContext, ['mci', 'zatca']);
    await runAgents(agents, baseContext, recorder.hooks);
    const record = recorder.finish();

    const seqs = [...record.events, ...record.messages].map((x) => x.seq).sort((a, b) => a - b);
    for (let i = 1; i < seqs.length; i++) {
      expect(seqs[i]).toBeGreaterThan(seqs[i - 1]!);
    }
  });

  it('captures delivered messages on the bus', async () => {
    const agents: Agent[] = [new StubAgent('mci')];
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents(agents, baseContext, recorder.hooks);
    const record = recorder.finish();

    expect(record.messages.length).toBeGreaterThan(0);
    expect(record.messages[0]!.from).toBe('mci');
    expect(record.messages[0]!.to).toBe('ALL');
    expect(record.messages[0]!.messageAr).toBe('stub');
  });

  it('finalResults map is keyed by agentId', async () => {
    const agents: Agent[] = [new StubAgent('mci')];
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents(agents, baseContext, recorder.hooks);
    const record = recorder.finish();

    expect(record.finalResults.mci?.status).toBe('complete');
  });

  it('records errors with the error message', async () => {
    class ThrowingAgent implements Agent {
      readonly id: AgentId = 'mci';
      readonly dependencies = [] as const;
      async run(): Promise<AgentResult> {
        throw new Error('boom');
      }
    }
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents([new ThrowingAgent()], baseContext, recorder.hooks);
    const record = recorder.finish();

    const finishEvent = record.events.find((e) => e.phase === 'finish');
    expect(finishEvent?.status).toBe('error');
    expect(finishEvent?.error).toBe('boom');
  });

  it('truncates oversized payloads to protect downstream sinks', async () => {
    const huge = { blob: 'x'.repeat(20_000) };
    const result = stubComplete('big', huge);
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents([new StubAgent('mci', [], result)], baseContext, recorder.hooks);
    const record = recorder.finish();

    const msg = record.messages[0]!;
    expect((msg.payload as { __truncated?: boolean }).__truncated).toBe(true);
  });

  it('records the snapshotted context immutably', async () => {
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents([new StubAgent('mci')], baseContext, recorder.hooks);
    const record = recorder.finish();
    expect(record.context.vertical).toBe('tech');

    // Mutating a returned record's context should not affect the recorder's view.
    (record.context.answers as { added?: string }).added = 'after';
    const second = recorder.snapshot();
    expect((second.context.answers as { added?: string }).added).not.toBe('after');
  });
});

describe('MemorySink', () => {
  it('round-trips a record', async () => {
    const sink = new MemorySink();
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents([new StubAgent('mci')], baseContext, recorder.hooks);
    const record = recorder.finish();

    await sink.save(record);
    const loaded = await sink.load(record.runId);
    expect(loaded?.runId).toBe(record.runId);
    expect(loaded?.events.length).toBe(record.events.length);
  });

  it('returns null on missing runId', async () => {
    const sink = new MemorySink();
    expect(await sink.load('does-not-exist')).toBeNull();
  });

  it('list returns sorted runIds', async () => {
    const sink = new MemorySink();
    const r1 = makeRecorder(baseContext, ['mci']);
    const r2 = makeRecorder(baseContext, ['mci']);
    await sink.save(r1.snapshot());
    await sink.save(r2.snapshot());

    const list = await sink.list();
    expect(list.length).toBe(2);
    expect([...list].sort()).toEqual(list);
  });

  it('store is isolated — saved record cannot be mutated externally', async () => {
    const sink = new MemorySink();
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents([new StubAgent('mci')], baseContext, recorder.hooks);
    const record = recorder.finish();
    await sink.save(record);

    record.events.length = 0; // mutate after save
    const loaded = await sink.load(record.runId);
    expect(loaded?.events.length).toBeGreaterThan(0);
  });
});
