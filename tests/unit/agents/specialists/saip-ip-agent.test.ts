import { describe, it, expect } from 'vitest';
import { SaipIpAgent } from '@/agents/specialists/saip-ip-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx = (overrides: Partial<AgentContext> = {}): AgentContext => ({
  mode: 'establishment',
  vertical: 'tech',
  answers: { q_company_name: 'تك' },
  ...overrides,
});

const mciSignal: AgentMessage = {
  from: 'mci',
  to: 'ALL',
  type: 'data_share',
  payload: { crReady: true },
  messageAr: 'CR ready',
};

describe('SaipIpAgent', () => {
  it('blocks without MCI signal', async () => {
    expect((await new SaipIpAgent().run(ctx(), [])).status).toBe('blocked');
  });

  it('emphasizes IP for tech vertical with critical warning', async () => {
    const result = await new SaipIpAgent().run(ctx({ vertical: 'tech' }), [mciSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toBeDefined();
    expect(result.data.requirements?.some((r) => r.includes('براءة'))).toBe(true);
  });

  it('softer framing for non-tech verticals (no patent suggestion)', async () => {
    const result = await new SaipIpAgent().run(ctx({ vertical: 'restaurant' }), [mciSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toBeUndefined();
  });

  it('emits 3 outboxes including a research check when brand name provided', async () => {
    const result = await new SaipIpAgent().run(ctx(), [mciSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('ALL');
    expect(targets).toContain('document');
    expect(targets).toContain('research');
  });

  it('does not request research check when no brand name in answers', async () => {
    const result = await new SaipIpAgent().run({ ...ctx(), answers: {} }, [mciSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.outbox.some((m) => m.to === 'research')).toBe(false);
  });
});
