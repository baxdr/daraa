import { describe, it, expect } from 'vitest';
import { NcaEccAgent } from '@/agents/specialists/nca-ecc-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx = (answers: AgentContext['answers'] = {}): AgentContext => ({
  mode: 'establishment',
  vertical: 'tech',
  answers: { q_company_name: 'تك', ...answers },
});

const pdplSignal: AgentMessage = {
  from: 'pdpl_nca',
  to: 'nca_ecc',
  type: 'dependency',
  payload: { isB2g: true, baselineEccApplies: true },
  messageAr: 'pdpl ready',
};

describe('NcaEccAgent', () => {
  it('blocks without PDPL signal', async () => {
    expect((await new NcaEccAgent().run(ctx(), [])).status).toBe('blocked');
  });

  it('marks scope mandatory when serving government clients', async () => {
    const result = await new NcaEccAgent().run(ctx({ q7_government_clients: 'yes' }), [pdplSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toBeDefined();
    const broadcast = result.outbox.find((m) => m.to === 'ALL');
    expect(broadcast?.payload.inScope).toBe(true);
  });

  it('marks scope advisory when not serving government', async () => {
    const result = await new NcaEccAgent().run(ctx({ q7_government_clients: 'no' }), [pdplSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toBeUndefined();
    const broadcast = result.outbox.find((m) => m.to === 'ALL');
    expect(broadcast?.payload.inScope).toBe(false);
  });

  it('adds cloud-residency requirements when data is outside KSA', async () => {
    const result = await new NcaEccAgent().run(
      ctx({ q7_government_clients: 'yes', q6_data_location: 'outside' }),
      [pdplSignal],
    );
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.requirements?.some((r) => r.includes('داخل المملكة'))).toBe(true);
  });

  it('emits 3 outbox messages including mohr_gosi for CISO', async () => {
    const result = await new NcaEccAgent().run(ctx({ q7_government_clients: 'yes' }), [pdplSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('ALL');
    expect(targets).toContain('document');
    expect(targets).toContain('mohr_gosi');
    const mohr = result.outbox.find((m) => m.to === 'mohr_gosi');
    expect(mohr?.payload.needsCISO).toBe(true);
  });

  it('mentions the 114-control total in explanation', async () => {
    const result = await new NcaEccAgent().run(ctx({ q7_government_clients: 'yes' }), [pdplSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.explainAr).toContain('114');
  });
});
