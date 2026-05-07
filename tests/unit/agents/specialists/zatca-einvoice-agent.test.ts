import { describe, it, expect } from 'vitest';
import { ZatcaEinvoiceAgent } from '@/agents/specialists/zatca-einvoice-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx: AgentContext = {
  mode: 'establishment',
  vertical: 'tech',
  answers: { q_company_name: 'تك' },
};

const zatcaSignal = (vatRequired: boolean): AgentMessage => ({
  from: 'zatca',
  to: 'zatca_einvoice',
  type: 'data_share',
  payload: { taxRegistered: true, vatRequired },
  messageAr: 'tax ready',
});

describe('ZatcaEinvoiceAgent', () => {
  it('blocks until ZATCA signals tax registration', async () => {
    const agent = new ZatcaEinvoiceAgent();
    const result = await agent.run(ctx, []);
    expect(result.status).toBe('blocked');
  });

  it('returns required-onboarding flow when VAT required', async () => {
    const agent = new ZatcaEinvoiceAgent();
    const result = await agent.run(ctx, [zatcaSignal(true)]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.requirements?.length).toBeGreaterThanOrEqual(4);
    expect(result.outbox.find((m) => m.to === 'ALL')?.payload.phase2Required).toBe(true);
  });

  it('returns soft-prepare flow when VAT optional', async () => {
    const agent = new ZatcaEinvoiceAgent();
    const result = await agent.run(ctx, [zatcaSignal(false)]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.outbox.find((m) => m.to === 'ALL')?.payload.phase2Required).toBe(false);
  });

  it('emits 3 outbox messages (ALL + pdpl_nca + document)', async () => {
    const agent = new ZatcaEinvoiceAgent();
    const result = await agent.run(ctx, [zatcaSignal(true)]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('ALL');
    expect(targets).toContain('pdpl_nca');
    expect(targets).toContain('document');
  });

  it('passes invoice retention 6 years to pdpl_nca', async () => {
    const agent = new ZatcaEinvoiceAgent();
    const result = await agent.run(ctx, [zatcaSignal(true)]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const pdpl = result.outbox.find((m) => m.to === 'pdpl_nca');
    expect(pdpl?.payload.invoiceRetentionYears).toBe(6);
  });
});
