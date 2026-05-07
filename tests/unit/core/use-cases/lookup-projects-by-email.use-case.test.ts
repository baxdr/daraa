/**
 * Tests for lookupProjectsByEmail use-case.
 */
import { describe, it, expect } from 'vitest';
import { lookupProjectsByEmail } from '@/core/use-cases/lookup-projects-by-email.use-case';
import { ValidationError } from '@/core/errors';
import type { ProjectRepository } from '@/core/repositories';
import type { ProjectRecord } from '@/core/domain/project.entity';

function makeRepo(byEmail: Record<string, ProjectRecord[]>): ProjectRepository {
  return {
    async create() {
      throw new Error('not used');
    },
    async findById() {
      return null;
    },
    async update() {
      return null;
    },
    async findByEmail(email) {
      return byEmail[email.trim().toLowerCase()] ?? [];
    },
    async appendActivity() {
      return null;
    },
    async appendMessage() {
      return null;
    },
    async flush() {
      /* noop */
    },
  };
}

function fakeProject(id: string, overrides: Partial<ProjectRecord> = {}): ProjectRecord {
  return {
    id,
    createdAt: 1000,
    mode: 'compliance',
    status: 'pending',
    phase: 'roadmap',
    companyName: `Company-${id}`,
    vertical: 'tech',
    url: null,
    answers: {} as ProjectRecord['answers'],
    activities: [],
    messages: [],
    entities: [],
    roadmap: [],
    costSummary: { initialSar: 0, recurringMonthlySar: 0, currency: 'SAR' as const },
    topWarnings: [],
    regulatoryUpdates: [],
    ...overrides,
  } as ProjectRecord;
}

describe('core/use-cases/lookup-projects-by-email', () => {
  it('returns projects mapped to summaries', async () => {
    const repo = makeRepo({
      'a@b.com': [fakeProject('p1'), fakeProject('p2', { mode: 'establishment' })],
    });
    const result = await lookupProjectsByEmail({ projects: repo }, { email: 'a@b.com' });
    expect(result).toHaveLength(2);
    expect(result[0]?.id).toBe('p1');
    expect(result[1]?.mode).toBe('establishment');
    expect(result[0]).not.toHaveProperty('answers'); // summary, not full record
  });

  it('normalizes email casing and whitespace', async () => {
    const repo = makeRepo({ 'a@b.com': [fakeProject('p1')] });
    const result = await lookupProjectsByEmail({ projects: repo }, { email: '  A@B.COM  ' });
    expect(result).toHaveLength(1);
  });

  it('returns empty array when no match', async () => {
    const repo = makeRepo({});
    const result = await lookupProjectsByEmail({ projects: repo }, { email: 'nobody@x.com' });
    expect(result).toEqual([]);
  });

  it('throws ValidationError on malformed email', async () => {
    const repo = makeRepo({});
    await expect(
      lookupProjectsByEmail({ projects: repo }, { email: 'not-an-email' }),
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError on overlong email', async () => {
    const repo = makeRepo({});
    const long = 'a'.repeat(300) + '@b.com';
    await expect(lookupProjectsByEmail({ projects: repo }, { email: long })).rejects.toThrow(
      ValidationError,
    );
  });

  it('throws ValidationError on empty email', async () => {
    const repo = makeRepo({});
    await expect(lookupProjectsByEmail({ projects: repo }, { email: '' })).rejects.toThrow(
      ValidationError,
    );
  });
});
