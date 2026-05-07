/**
 * Structural diff between two AgentResult sets.
 *
 * Used by replay to compare a fresh run against a recorded run. The
 * comparison is deliberately strict (deep-equal) — for non-deterministic
 * specialists (any that hit web search, LLMs, time.now()) the diff WILL
 * report differences. That's the point: replay is most useful for
 * deterministic specialists, and the diff highlights non-determinism so
 * we can decide what to do about it.
 */

import type { AgentId } from '../../types';
import type { AgentResult } from '../types';

export interface ResultDiff {
  /** Agents present in original but missing from replay. */
  missingFromReplay: AgentId[];
  /** Agents present in replay but missing from original. */
  newInReplay: AgentId[];
  /** Agents whose results differ between the two runs. */
  changed: ChangedResult[];
  /** Agents with identical results in both runs. */
  identical: AgentId[];
}

export interface ChangedResult {
  agentId: AgentId;
  /** Path inside the AgentResult where the change occurs. */
  path: string;
  before: unknown;
  after: unknown;
}

/** Deep-equal check that handles plain objects, arrays, and primitives. */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a === null || b === null) return false;
  if (typeof a !== typeof b) return false;
  if (typeof a !== 'object') return false;

  if (Array.isArray(a)) {
    if (!Array.isArray(b)) return false;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i])) return false;
    return true;
  }

  const aKeys = Object.keys(a as object).sort();
  const bKeys = Object.keys(b as object).sort();
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) if (aKeys[i] !== bKeys[i]) return false;
  for (const k of aKeys) {
    if (!deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])) {
      return false;
    }
  }
  return true;
}

/** Find the first path where `a` and `b` diverge. Returns '' if equal. */
function firstDiffPath(a: unknown, b: unknown, path = ''): string {
  if (deepEqual(a, b)) return '';
  if (a === null || b === null) return path;
  if (typeof a !== typeof b) return path;
  if (typeof a !== 'object') return path;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return `${path}.length`;
    for (let i = 0; i < a.length; i++) {
      const sub = firstDiffPath(a[i], b[i], `${path}[${i}]`);
      if (sub) return sub;
    }
    return path;
  }

  const aKeys = new Set(Object.keys(a as object));
  const bKeys = new Set(Object.keys(b as object));
  for (const k of aKeys) if (!bKeys.has(k)) return `${path}.${k}(missing)`;
  for (const k of bKeys) if (!aKeys.has(k)) return `${path}.${k}(extra)`;
  for (const k of aKeys) {
    const sub = firstDiffPath(
      (a as Record<string, unknown>)[k],
      (b as Record<string, unknown>)[k],
      `${path}.${k}`,
    );
    if (sub) return sub;
  }
  return path;
}

export function diffResults(
  before: Partial<Record<AgentId, AgentResult>>,
  after: Partial<Record<AgentId, AgentResult>>,
): ResultDiff {
  const beforeIds = Object.keys(before) as AgentId[];
  const afterIds = Object.keys(after) as AgentId[];
  const beforeSet = new Set(beforeIds);
  const afterSet = new Set(afterIds);

  const missingFromReplay: AgentId[] = [];
  const newInReplay: AgentId[] = [];
  const changed: ChangedResult[] = [];
  const identical: AgentId[] = [];

  for (const id of beforeIds) {
    if (!afterSet.has(id)) {
      missingFromReplay.push(id);
      continue;
    }
    const a = before[id];
    const b = after[id];
    if (deepEqual(a, b)) {
      identical.push(id);
    } else {
      changed.push({
        agentId: id,
        path: firstDiffPath(a, b),
        before: a,
        after: b,
      });
    }
  }
  for (const id of afterIds) {
    if (!beforeSet.has(id)) newInReplay.push(id);
  }

  return { missingFromReplay, newInReplay, changed, identical };
}
