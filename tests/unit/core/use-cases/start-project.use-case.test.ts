/**
 * Tests for startProject use-case.
 *
 * Uses in-memory fakes for ChatSessionRepository + ProjectRepository so we
 * can prove core/use-cases stays free of next/Supabase imports.
 */
import { describe, it, expect } from 'vitest';
import {
  startProject,
  resolveVertical,
  type StartProjectDeps,
} from '@/core/use-cases/start-project.use-case';
import { NotFoundError, ValidationError } from '@/core/errors';
import type { ChatSessionRepository } from '@/core/repositories';
import type { ChatSession } from '@/lib/chat-sessions';
import type { ProjectRecord } from '@/core/domain/project.entity';

function makeChatSessionRepo(initial: ChatSession[]): ChatSessionRepository {
  const map = new Map(initial.map((s) => [s.id, s]));
  return {
    async create() {
      throw new Error('not used');
    },
    async findById(id) {
      return map.get(id) ?? null;
    },
    async update() {
      throw new Error('not used');
    },
    async delete() {
      /* noop */
    },
  };
}

function makeProjectRepo(): {
  repo: StartProjectDeps['projects'];
  created: ProjectRecord[];
} {
  const created: ProjectRecord[] = [];
  let counter = 0;
  const repo: StartProjectDeps['projects'] = {
    async create(input) {
      counter += 1;
      const record = {
        id: `proj-${counter}`,
        createdAt: Date.now(),
        mode: input.mode,
        status: 'pending' as const,
        phase: 'roadmap' as const,
        companyName: input.companyName,
        vertical: input.vertical,
        url: input.url,
        answers: input.answers,
        activities: [],
        messages: [],
        entities: [],
        roadmap: [],
        costSummary: { initialSar: 0, recurringMonthlySar: 0, currency: 'SAR' as const },
        topWarnings: [],
        regulatoryUpdates: [],
      } as unknown as ProjectRecord;
      created.push(record);
      return record;
    },
    async findById(id) {
      return created.find((p) => p.id === id) ?? null;
    },
    async update() {
      return null;
    },
    async findByEmail() {
      return [];
    },
    async findByOwner() {
      return [];
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
  return { repo, created };
}

function makeDeps(sessions: ChatSession[] = []): {
  deps: StartProjectDeps;
  created: ProjectRecord[];
} {
  const { repo, created } = makeProjectRepo();
  return {
    deps: { chatSessions: makeChatSessionRepo(sessions), projects: repo },
    created,
  };
}

function completeSession(id: string, answers: Record<string, unknown>): ChatSession {
  return {
    id,
    createdAt: Date.now(),
    currentQuestion: null,
    answers: answers as ChatSession['answers'],
  };
}

describe('core/use-cases/start-project', () => {
  it('creates an establishment project with explicit vertical', async () => {
    const session = completeSession('s1', {
      q0_mode: 'establishment',
      q_company_name: 'My Co',
      est1_vertical: 'tech',
      est2_city: 'riyadh',
    });
    const { deps, created } = makeDeps([session]);

    const project = await startProject(deps, { sessionId: 's1' });

    expect(project.id).toBe('proj-1');
    expect(project.mode).toBe('establishment');
    expect(project.vertical).toBe('tech');
    expect(project.companyName).toBe('My Co');
    expect(created).toHaveLength(1);
  });

  it('creates a digital compliance project with mapped vertical', async () => {
    const session = completeSession('s2', {
      q0_mode: 'compliance',
      q_company_name: 'Shop',
      q1_company_type: 'ecommerce',
      q8_website_url: 'https://shop.example.com',
    });
    const { deps } = makeDeps([session]);

    const project = await startProject(deps, { sessionId: 's2' });

    expect(project.mode).toBe('compliance');
    expect(project.vertical).toBe('services');
    expect(project.url).toBe('https://shop.example.com');
  });

  it('creates an operational compliance project with restaurant vertical', async () => {
    const session = completeSession('s3', {
      q0_mode: 'operational_compliance',
      q_company_name: 'Mama Kitchen',
      op1_vertical: 'restaurant',
      op2_city: 'jeddah',
      op10_website_url: 'https://mama.example.com',
    });
    const { deps } = makeDeps([session]);

    const project = await startProject(deps, { sessionId: 's3' });

    expect(project.mode).toBe('operational_compliance');
    expect(project.vertical).toBe('restaurant');
    expect(project.url).toBe('https://mama.example.com');
  });

  it('throws NotFoundError when session does not exist', async () => {
    const { deps } = makeDeps([]);
    await expect(startProject(deps, { sessionId: 'missing' })).rejects.toThrow(NotFoundError);
  });

  it('throws ValidationError when session is incomplete', async () => {
    const session: ChatSession = {
      id: 's-incomplete',
      createdAt: Date.now(),
      currentQuestion: 'q1_company_type' as ChatSession['currentQuestion'],
      answers: {} as ChatSession['answers'],
    };
    const { deps } = makeDeps([session]);
    await expect(startProject(deps, { sessionId: 's-incomplete' })).rejects.toMatchObject({
      name: 'ValidationError',
      message: expect.stringContaining('not complete'),
    });
  });

  it('throws ValidationError when mode is missing', async () => {
    const session = completeSession('s-no-mode', { q_company_name: 'X' });
    const { deps } = makeDeps([session]);
    await expect(startProject(deps, { sessionId: 's-no-mode' })).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError when company name is empty', async () => {
    const session = completeSession('s-no-name', {
      q0_mode: 'establishment',
      q_company_name: '   ',
      est1_vertical: 'tech',
    });
    const { deps } = makeDeps([session]);
    await expect(startProject(deps, { sessionId: 's-no-name' })).rejects.toMatchObject({
      message: expect.stringContaining('company name'),
    });
  });
});

describe('resolveVertical', () => {
  it('falls back to tech for establishment with no vertical', () => {
    expect(resolveVertical({ q0_mode: 'establishment' })).toBe('tech');
  });

  it('maps fintech to tech', () => {
    expect(resolveVertical({ q0_mode: 'compliance', q1_company_type: 'fintech' })).toBe('tech');
  });

  it('maps retail to services', () => {
    expect(resolveVertical({ q0_mode: 'operational_compliance', op1_vertical: 'retail' })).toBe(
      'services',
    );
  });

  it('passes through known operational verticals', () => {
    expect(resolveVertical({ q0_mode: 'operational_compliance', op1_vertical: 'salon' })).toBe(
      'salon',
    );
  });
});
