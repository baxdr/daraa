import { describe, it, expect } from 'vitest';
import { CustomsAgent } from '@/agents/specialists/customs-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx = (overrides: Partial<AgentContext> = {}): AgentContext => ({
  mode: 'establishment',
  vertical: 'services',
  answers: { q_company_name: 'متجر' },
  ...overrides,
});

const mciSignal: AgentMessage = {
  from: 'mci',
  to: 'ALL',
  type: 'data_share',
  payload: { crReady: true },
  messageAr: 'CR ready',
};
const zatcaSignal: AgentMessage = {
  from: 'zatca',
  to: 'ALL',
  type: 'data_share',
  payload: { taxRegistered: true },
  messageAr: 'tax ready',
};

describe('CustomsAgent', () => {
  it('blocks without both MCI and ZATCA signals', async () => {
    expect((await new CustomsAgent().run(ctx(), [])).status).toBe('blocked');
    expect((await new CustomsAgent().run(ctx(), [mciSignal])).status).toBe('blocked');
  });

  it('full requirements for ecommerce vertical (import-heavy)', async () => {
    const result = await new CustomsAgent().run(ctx(), [mciSignal, zatcaSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.commonMistakeAr).toBeDefined(); // import-heavy → mistake hint
    expect(result.data.requirements?.length).toBeGreaterThanOrEqual(4);
  });

  it('full requirements for construction vertical (also import-heavy)', async () => {
    const result = await new CustomsAgent().run(ctx({ vertical: 'construction' }), [
      mciSignal,
      zatcaSignal,
    ]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.commonMistakeAr).toBeDefined();
  });

  it('softer framing for non-import-heavy verticals (e.g. salon)', async () => {
    const result = await new CustomsAgent().run(ctx({ vertical: 'salon' }), [
      mciSignal,
      zatcaSignal,
    ]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.commonMistakeAr).toBeUndefined();
  });

  it('always includes critical warning about CoC/Saber', async () => {
    const result = await new CustomsAgent().run(ctx(), [mciSignal, zatcaSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.data.criticalWarningAr).toContain('CoC');
  });

  it('emits 3 outboxes (ALL + zatca + document)', async () => {
    const result = await new CustomsAgent().run(ctx(), [mciSignal, zatcaSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('ALL');
    expect(targets).toContain('zatca');
    expect(targets).toContain('document');
  });
});
