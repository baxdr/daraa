import { describe, it, expect } from 'vitest';
import { PdplNcaAgent } from '@/agents/specialists/pdpl-nca-agent';
import type { AgentContext, AgentMessage } from '@/agents/runtime/types';

const ctx = (answers: AgentContext['answers'] = {}): AgentContext => ({
  mode: 'establishment',
  vertical: 'tech',
  answers: { q_company_name: 'تك', ...answers },
});

const mciSignal: AgentMessage = {
  from: 'mci',
  to: 'ALL',
  type: 'data_share',
  payload: { crReady: true, entityType: 'ذ.م.م' },
  messageAr: 'CR ready',
};

describe('PdplNcaAgent — outbox additions', () => {
  it('emits broadcast + document outbox by default', async () => {
    const result = await new PdplNcaAgent().run(ctx(), [mciSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    const targets = result.outbox.map((m) => m.to);
    expect(targets).toContain('ALL');
    expect(targets).toContain('document');
  });

  it('adds nca_ecc dependency when serving government clients', async () => {
    const result = await new PdplNcaAgent().run(ctx({ q7_government_clients: 'yes' }), [mciSignal]);
    if (result.status !== 'complete') throw new Error('expected complete');
    expect(result.outbox.some((m) => m.to === 'nca_ecc')).toBe(true);
  });

  it('adds cross-border template request when data is outside the kingdom', async () => {
    const result = await new PdplNcaAgent().run(
      ctx({ q3_processes_personal_data: 'yes', q6_data_location: 'outside' }),
      [mciSignal],
    );
    if (result.status !== 'complete') throw new Error('expected complete');
    const docs = result.outbox.filter((m) => m.to === 'document');
    const hasCrossBorder = docs.some((m) =>
      Array.isArray(m.payload.templatesNeeded)
        ? (m.payload.templatesNeeded as string[]).includes('cross_border_addendum')
        : false,
    );
    expect(hasCrossBorder).toBe(true);
  });
});
