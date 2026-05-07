import { describe, it, expect } from 'vitest';
import { MaroofAgent } from '@/agents/specialists/maroof-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const baseContext: AgentContext = {
  mode: 'establishment',
  vertical: 'services',
  answers: { q_company_name: 'متجري' },
};

const mciReadyMsg: AgentMessage = {
  from: 'mci',
  to: 'ALL',
  type: 'data_share',
  payload: { crReady: true, entityType: 'ذ.م.م' },
  messageAr: 'CR ready',
};

describe('MaroofAgent', () => {
  it('blocks until MCI signals CR ready', async () => {
    const agent = new MaroofAgent();
    const result = await agent.run(baseContext, []);
    expect(result.status).toBe('blocked');
  });

  it('completes with full requirements when CR is ready and ecommerce', async () => {
    const agent = new MaroofAgent();
    const result = await agent.run(baseContext, [mciReadyMsg]);
    expect(result.status).toBe('complete');
    if (result.status !== 'complete') return;
    expect(result.data.requirements?.length).toBeGreaterThanOrEqual(4);
    expect(result.data.criticalWarningAr).toBeUndefined(); // ecommerce → no warning
  });

  it('emits at least 2 outbox messages including pdpl_nca dependency', async () => {
    const agent = new MaroofAgent();
    const result = await agent.run(baseContext, [mciReadyMsg]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.outbox.length).toBeGreaterThanOrEqual(2);
    expect(result.outbox.some((m) => m.to === 'pdpl_nca')).toBe(true);
    expect(result.outbox.some((m) => m.to === 'ALL')).toBe(true);
  });

  it('emits a research-update message when no website URL is provided', async () => {
    const agent = new MaroofAgent();
    const result = await agent.run({ ...baseContext, websiteUrl: null }, [mciReadyMsg]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.outbox.some((m) => m.to === 'research')).toBe(true);
  });

  it('softens explanation and adds warning when vertical is not ecommerce', async () => {
    const agent = new MaroofAgent();
    const result = await agent.run({ ...baseContext, vertical: 'tech' }, [mciReadyMsg]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toBeDefined();
  });
});
