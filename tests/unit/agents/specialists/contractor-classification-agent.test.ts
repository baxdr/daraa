import { describe, it, expect } from 'vitest';
import { ContractorClassificationAgent } from '@/agents/specialists/contractor-classification-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx = (overrides: Partial<AgentContext> = {}): AgentContext => ({
  mode: 'establishment',
  vertical: 'construction',
  answers: { q_company_name: 'مقاولات' },
  ...overrides,
});

const munSignal: AgentMessage = {
  from: 'municipality',
  to: 'contractor_classification',
  type: 'dependency',
  payload: { municipalityLicense: 'pending-issuance' },
  messageAr: 'license pending',
};

describe('ContractorClassificationAgent', () => {
  it('blocks without municipality signal', async () => {
    const agent = new ContractorClassificationAgent();
    expect((await agent.run(ctx(), [])).status).toBe('blocked');
  });

  it('recommends grade 1 for capital ≥50M', async () => {
    const agent = new ContractorClassificationAgent();
    const result = await agent.run(ctx({ capitalSar: 80_000_000 }), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.explainAr).toContain('الفئة الأولى');
  });

  it('recommends mid-tier grade for capital 1M-10M', async () => {
    const agent = new ContractorClassificationAgent();
    const result = await agent.run(ctx({ capitalSar: 5_000_000 }), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.explainAr).toMatch(/الفئة الرابعة|الفئة الخامسة/);
  });

  it('adds extra requirements + warning when foreign partner', async () => {
    const agent = new ContractorClassificationAgent();
    const result = await agent.run(ctx({ hasForeignPartner: true, capitalSar: 5_000_000 }), [
      munSignal,
    ]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toBeDefined();
    expect(result.data.requirements?.some((r) => r.includes('سفارة'))).toBe(true);
  });

  it('emits 3 outbox messages including mohr_gosi + document', async () => {
    const agent = new ContractorClassificationAgent();
    const result = await agent.run(ctx({ capitalSar: 5_000_000 }), [munSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('mohr_gosi');
    expect(targets).toContain('document');
    expect(targets).toContain('ALL');
  });
});
