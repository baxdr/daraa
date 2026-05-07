import { describe, it, expect } from 'vitest';
import { MohAgent } from '@/agents/specialists/moh-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx = (overrides: Partial<AgentContext> = {}): AgentContext => ({
  mode: 'establishment',
  vertical: 'salon',
  answers: { q_company_name: 'صالون' },
  ...overrides,
});

const munSignal: AgentMessage = {
  from: 'municipality',
  to: 'moh',
  type: 'dependency',
  payload: { municipalityLicense: 'pending-issuance' },
  messageAr: 'license pending',
};

describe('MohAgent', () => {
  it('blocks without municipality signal', async () => {
    expect((await new MohAgent().run(ctx(), [])).status).toBe('blocked');
  });

  it('issues full requirements for salon vertical', async () => {
    const result = await new MohAgent().run(ctx(), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.requirements?.length).toBeGreaterThanOrEqual(4);
  });

  it('uses renewal framing in operational_compliance mode', async () => {
    const result = await new MohAgent().run(ctx({ mode: 'operational_compliance' }), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.explainAr).toContain('تجديد');
    expect(result.data.estimatedTimeAr).toContain('تجديد');
  });

  it('emits 3 outbox messages (ALL + mohr_gosi + document)', async () => {
    const result = await new MohAgent().run(ctx(), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('ALL');
    expect(targets).toContain('mohr_gosi');
    expect(targets).toContain('document');
  });

  it('signals staff health certs requirement to mohr_gosi', async () => {
    const result = await new MohAgent().run(ctx(), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const mohr = result.outbox.find((m) => m.to === 'mohr_gosi');
    expect(mohr?.payload.staffNeedHealthCerts).toBe(true);
  });
});
