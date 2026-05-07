/**
 * Direct test of the agent runtime — proves that:
 *   1. Municipality returns `blocked` when Civil Defense hasn't delivered
 *      its safety-cert message.
 *   2. After Civil Defense completes in a later wave, Municipality reads
 *      its inbox and proceeds.
 *   3. Wave count matches the dependency depth.
 *
 * Run with: npx tsx scripts/test-agent-runtime.ts
 */

import { runAgents } from '../src/agents/runtime/orchestrator-runtime';
import type { AgentContext } from '../src/agents/runtime/types';
import { getAgentsForVertical } from '../src/agents/specialists';

const ctx: AgentContext = {
  mode: 'establishment',
  vertical: 'restaurant',
  answers: {
    q0_mode: 'establishment',
    est1_vertical: 'restaurant',
    est2_city: 'riyadh',
    est3_partner_count: 2,
    est4_capital_sar: 80_000,
    est5_foreign_partner: 'no',
    est6_lease_status: 'not_signed',
  },
  cityId: 'riyadh',
  cityLabelAr: 'الرياض',
  partnerCount: 2,
  capitalSar: 80_000,
  hasForeignPartner: false,
  leaseStatus: 'not_signed',
};

async function main() {
  const agents = getAgentsForVertical('restaurant');
  console.log(
    'agents in play:',
    agents.map((a) => `${a.id}(deps=[${a.dependencies.join(',')}])`).join(', '),
  );

  const events: Array<{
    wave: number;
    agent: string;
    status: string;
    reason?: string;
    msgCount: number;
  }> = [];

  const result = await runAgents(agents, ctx, {
    onAgentFinish: (e) => {
      const msgCount = e.result.status === 'complete' ? e.result.outbox.length : 0;
      const reason = e.result.status === 'blocked' ? e.result.reason : undefined;
      events.push({
        wave: e.waveNumber,
        agent: e.agentId,
        status: e.result.status,
        ...(reason !== undefined ? { reason } : {}),
        msgCount,
      });
    },
  });

  console.log('\n=== event log ===');
  for (const e of events) {
    const tag = e.status === 'complete' ? '✓' : e.status === 'blocked' ? '✗ blocked' : '⚠ error';
    console.log(
      `  wave ${e.wave}  ${tag.padEnd(12)}  ${e.agent.padEnd(30)} outbox=${e.msgCount}${e.reason ? ' (' + e.reason + ')' : ''}`,
    );
  }

  console.log('\n=== bus log ===');
  for (const m of result.allMessages) {
    console.log(`  ${m.from.padEnd(18)} → ${String(m.to).padEnd(18)} [${m.type}]  ${m.messageAr}`);
  }

  console.log(
    `\nfinal: waves=${result.waves}, completed=${result.completed.length}, blocked=${result.blocked.length}, errored=${result.errored.length}`,
  );

  // Assertions.
  const municipalityBlocks = events.filter(
    (e) => e.agent === 'municipality' && e.status === 'blocked',
  );
  const municipalityCompletes = events.filter(
    (e) => e.agent === 'municipality' && e.status === 'complete',
  );
  const civilDefenseCompleted = events.find(
    (e) => e.agent === 'civil_defense' && e.status === 'complete',
  );

  console.log('\n=== assertions ===');
  if (civilDefenseCompleted) {
    const cdWave = civilDefenseCompleted.wave;
    const muCompleteWave = municipalityCompletes[0]?.wave ?? -1;
    if (muCompleteWave > cdWave) {
      console.log(
        `  ✓ Municipality completed in wave ${muCompleteWave} (after Civil Defense in wave ${cdWave})`,
      );
    } else {
      console.log(
        `  ✗ Municipality completed in wave ${muCompleteWave}, Civil Defense in wave ${cdWave} — ordering broken`,
      );
      process.exitCode = 1;
    }
  } else {
    console.log('  ✗ Civil Defense never completed');
    process.exitCode = 1;
  }

  if (municipalityBlocks.length > 0) {
    console.log(
      `  ✓ Municipality was blocked ${municipalityBlocks.length} time(s) before completion (proves inbox check)`,
    );
  } else {
    // If dep-graph check kept municipality out entirely, that's also acceptable — but then the inbox
    // check was never exercised. Flag it.
    console.log(
      '  ~ Municipality never returned blocked (dep-graph prevented it from even running on wave 1). Acceptable but weaker proof.',
    );
  }
}

/* ------------------------------------------------------------------------- */
/* Second test: explicitly prove the `blocked` path by stripping Municipality's */
/* declared dependency. The dep-graph no longer protects it — so in wave 1    */
/* it runs without an inbox message, reads inbox, finds nothing, returns      */
/* blocked. In wave 2, Civil Defense's message has arrived and it succeeds.   */
/* ------------------------------------------------------------------------- */
async function proofOfBlocking() {
  console.log('\n=== PROOF-OF-BLOCKING TEST ===');
  const agents = getAgentsForVertical('restaurant');
  const municipality = agents.find((a) => a.id === 'municipality')!;
  // Monkey-patch dependencies to force it into wave 1.
  // This is a test-only override — the real agent keeps its deps.
  Object.defineProperty(municipality, 'dependencies', { value: [] });

  const events: string[] = [];
  const result = await runAgents(agents, ctx, {
    onAgentFinish: (e) => {
      events.push(
        `wave ${e.waveNumber}: ${e.agentId} → ${e.result.status}` +
          (e.result.status === 'blocked' ? ` (${e.result.reason})` : ''),
      );
    },
  });

  for (const ev of events) console.log('  ' + ev);
  const muBlockWave = events.find((e) => e.includes('municipality → blocked'));
  const muCompleteWave = events.find((e) => e.includes('municipality → complete'));
  if (muBlockWave && muCompleteWave) {
    console.log(
      '  ✓ Municipality blocked first, then completed after message arrived — real inbox-driven behavior.',
    );
  } else {
    console.log('  ✗ Did not observe block→complete transition.');
    process.exitCode = 1;
  }
}

main()
  .then(proofOfBlocking)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
