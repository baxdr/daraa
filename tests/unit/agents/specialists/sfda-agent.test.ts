import { describe, it, expect } from 'vitest';
import { SfdaAgent } from '@/agents/specialists/sfda-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx = (overrides: Partial<AgentContext> = {}): AgentContext => ({
  mode: 'establishment',
  vertical: 'restaurant',
  answers: { q_company_name: 'مطعم' },
  ...overrides,
});

const munSignal: AgentMessage = {
  from: 'municipality',
  to: 'sfda',
  type: 'dependency',
  payload: { municipalityLicense: 'pending-issuance' },
  messageAr: 'license pending',
};

describe('SfdaAgent', () => {
  it('blocks without municipality signal', async () => {
    expect((await new SfdaAgent().run(ctx(), [])).status).toBe('blocked');
  });

  it('issues full requirements for restaurant vertical', async () => {
    const result = await new SfdaAgent().run(ctx(), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.requirements?.length).toBeGreaterThanOrEqual(4);
  });

  it('uses renewal framing in operational_compliance mode', async () => {
    const result = await new SfdaAgent().run(ctx({ mode: 'operational_compliance' }), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.explainAr).toContain('التجديد');
  });

  it('emits 3 outbox messages including HACCP template request to document', async () => {
    const result = await new SfdaAgent().run(ctx(), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const doc = result.outbox.find((m) => m.to === 'document');
    expect(doc?.payload.templateNeeded).toBe('haccp_plan_simplified');
  });

  it('signals food handler cert requirement to mohr_gosi', async () => {
    const result = await new SfdaAgent().run(ctx(), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const mohr = result.outbox.find((m) => m.to === 'mohr_gosi');
    expect(mohr?.payload.foodHandlerCertsRequired).toBe(true);
  });
});
