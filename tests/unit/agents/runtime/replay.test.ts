import { describe, it, expect } from 'vitest';
import { makeRecorder } from '@/agents/runtime/telemetry';
import { runAgents } from '@/agents/runtime/orchestrator-runtime';
import { replayRun, diffResults } from '@/agents/runtime/replay';
import type { Agent, AgentContext, AgentResult } from '@/agents/runtime/types';
import type { AgentId } from '@/agents/types';

const baseContext: AgentContext = {
  mode: 'establishment',
  vertical: 'tech',
  answers: { q_company_name: 'Replay Test' },
};

const completeResult = (id: AgentId, name: string): AgentResult => ({
  status: 'complete',
  data: {
    entityId: id,
    nameAr: name,
    nameSimpleAr: name,
    explainAr: 'stub',
    estimatedCostSar: { min: 0, max: 0 },
    estimatedTimeAr: 'يوم',
  },
  outbox: [],
});

class DeterministicAgent implements Agent {
  constructor(
    public readonly id: AgentId,
    private readonly result: AgentResult,
  ) {}
  readonly dependencies = [] as const;
  async run(): Promise<AgentResult> {
    return this.result;
  }
}

class FlakyAgent implements Agent {
  constructor(public readonly id: AgentId) {}
  readonly dependencies = [] as const;
  async run(): Promise<AgentResult> {
    return completeResult(this.id, `flaky-${Math.random()}`);
  }
}

describe('diffResults', () => {
  it('returns identical when both runs have the same result', () => {
    const r = completeResult('mci', 'تجارة');
    const diff = diffResults({ mci: r }, { mci: r });
    expect(diff.identical).toEqual(['mci']);
    expect(diff.changed).toEqual([]);
  });

  it('flags changed results with a diff path', () => {
    const a = completeResult('mci', 'تجارة');
    const b = completeResult('mci', 'تجارة 2');
    const diff = diffResults({ mci: a }, { mci: b });
    expect(diff.changed).toHaveLength(1);
    expect(diff.changed[0]!.path).toContain('nameAr');
  });

  it('flags missing/new agents', () => {
    const r = completeResult('mci', 'تجارة');
    const diff = diffResults({ mci: r }, { zatca: r });
    expect(diff.missingFromReplay).toEqual(['mci']);
    expect(diff.newInReplay).toEqual(['zatca']);
  });
});

describe('replayRun', () => {
  it('returns identical when specialists are deterministic', async () => {
    const agents = [new DeterministicAgent('mci', completeResult('mci', 'تجارة'))];
    const recorder = makeRecorder(baseContext, ['mci']);
    await runAgents(agents, baseContext, recorder.hooks);
    const original = recorder.finish();

    const outcome = await replayRun(
      original,
      (id) => new DeterministicAgent(id, completeResult(id, 'تجارة')),
    );
    expect(outcome.identical).toBe(true);
    expect(outcome.diff.changed).toHaveLength(0);
    expect(outcome.replayRunId).not.toBe(original.runId);
  });

  it('detects non-determinism', async () => {
    const original = (() => {
      const recorder = makeRecorder(baseContext, ['mci']);
      const evt = {
        waveNumber: 1 as const,
        agentId: 'mci' as AgentId,
        status: 'complete' as const,
        result: completeResult('mci', 'تجارة-فريد-12345'),
      };
      // Manually populate so the original has a stable name
      recorder.hooks.onAgentStart?.('mci', 1);
      recorder.hooks.onAgentFinish?.(evt);
      return recorder.finish();
    })();
    // Replace agentIds for replay (the recorder snapshot uses []).
    original.agentIds = ['mci'];
    original.finalResults = { mci: completeResult('mci', 'تجارة-فريد-12345') };

    const outcome = await replayRun(original, (id) => new FlakyAgent(id));
    expect(outcome.identical).toBe(false);
    expect(outcome.diff.changed.length).toBeGreaterThan(0);
  });

  it('supports replacing a single agent for A/B testing', async () => {
    const original = (() => {
      const recorder = makeRecorder(baseContext, ['mci']);
      recorder.hooks.onAgentStart?.('mci', 1);
      recorder.hooks.onAgentFinish?.({
        waveNumber: 1,
        agentId: 'mci',
        status: 'complete',
        result: completeResult('mci', 'الأصلي'),
      });
      const r = recorder.finish();
      r.agentIds = ['mci'];
      r.finalResults = { mci: completeResult('mci', 'الأصلي') };
      return r;
    })();

    const candidate = new DeterministicAgent('mci', completeResult('mci', 'البديل'));
    const outcome = await replayRun(
      original,
      (id) => new DeterministicAgent(id, completeResult(id, 'shouldnotuse')),
      { replacement: { agentId: 'mci', agent: candidate } },
    );

    expect(outcome.identical).toBe(false);
    expect(outcome.diff.changed.find((c) => c.agentId === 'mci')).toBeDefined();
  });
});
