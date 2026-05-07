import { describe, it, expect } from 'vitest';
import { TaxStrategyAgent } from '@/agents/specialists/tax-strategy-agent';
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
  payload: { crReady: true, entityType: 'ذ.م.م' },
  messageAr: 'CR ready',
};

const zatcaSignal: AgentMessage = {
  from: 'zatca',
  to: 'ALL',
  type: 'data_share',
  payload: { taxRegistered: true },
  messageAr: 'tax ready',
};

describe('TaxStrategyAgent', () => {
  it('blocks when MCI or ZATCA signals are missing', async () => {
    expect((await new TaxStrategyAgent().run(ctx(), [])).status).toBe('blocked');
    expect((await new TaxStrategyAgent().run(ctx(), [mciSignal])).status).toBe('blocked');
  });

  it('produces zakat-only summary when no foreign partner', async () => {
    const result = await new TaxStrategyAgent().run(ctx(), [mciSignal, zatcaSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.explainAr).toContain('زكاة');
    expect(result.data.criticalWarningAr).toBeUndefined();
  });

  it('escalates with critical warning when foreign partner present', async () => {
    const result = await new TaxStrategyAgent().run(ctx({ hasForeignPartner: true }), [
      mciSignal,
      zatcaSignal,
    ]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toBeDefined();
    expect(result.data.requirements?.some((r) => r.includes('توزيع أرباح'))).toBe(true);
  });

  it('emits 3 outbox messages (ALL + zatca + document)', async () => {
    const result = await new TaxStrategyAgent().run(ctx(), [mciSignal, zatcaSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('ALL');
    expect(targets).toContain('zatca');
    expect(targets).toContain('document');
  });

  it('scales requirements by capital tier', async () => {
    const small = await new TaxStrategyAgent().run(ctx({ capitalSar: 50_000 }), [
      mciSignal,
      zatcaSignal,
    ]);
    const large = await new TaxStrategyAgent().run(ctx({ capitalSar: 100_000_000 }), [
      mciSignal,
      zatcaSignal,
    ]);
    if (small.status !== 'complete' || large.status !== 'complete') throw new Error('complete');
    expect(large.data.requirements?.length).toBeGreaterThan(small.data.requirements?.length ?? 0);
  });
});
