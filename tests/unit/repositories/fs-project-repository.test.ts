/**
 * Unit tests for FilesystemProjectRepository.
 * Tests the fundamental CRUD operations and ensure immutability.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FilesystemProjectRepository } from '@/infrastructure/persistence/filesystem/fs-project-repository';
import type { ProjectRecord } from '@/core/domain/project.entity';

describe('FilesystemProjectRepository', () => {
  let repo: FilesystemProjectRepository;

  beforeEach(() => {
    repo = new FilesystemProjectRepository();
  });

  it('creates a project and retrieves it by ID', async () => {
    const created = await repo.create({
      mode: 'establishment',
      vertical: 'tech',
      companyName: 'Test Company',
      url: null,
      answers: { q0_mode: 'establishment' },
    });

    expect(created.id).toBeDefined();
    expect(created.companyName).toBe('Test Company');
    expect(created.mode).toBe('establishment');
    expect(created.status).toBe('pending');

    const retrieved = await repo.findById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.companyName).toBe('Test Company');
  });

  it('updates a project and returns the updated record', async () => {
    const created = await repo.create({
      mode: 'establishment',
      vertical: 'tech',
      companyName: 'Original Name',
      url: null,
      answers: { q0_mode: 'establishment' },
    });

    const updated = await repo.update(created.id, {
      status: 'complete',
      companyName: 'Updated Name',
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('complete');
    expect(updated?.companyName).toBe('Updated Name');

    const retrieved = await repo.findById(created.id);
    expect(retrieved?.status).toBe('complete');
    expect(retrieved?.companyName).toBe('Updated Name');
  });

  it('finds projects by email (case-insensitive)', async () => {
    const email = 'test@example.com';
    const created1 = await repo.create({
      mode: 'establishment',
      vertical: 'tech',
      companyName: 'Company 1',
      url: null,
      answers: { q0_mode: 'establishment' },
      email,
    });

    const created2 = await repo.create({
      mode: 'compliance',
      vertical: 'services',
      companyName: 'Company 2',
      url: null,
      answers: { q0_mode: 'compliance' },
      email: 'TEST@EXAMPLE.COM', // uppercase variant
    });

    const found = await repo.findByEmail('Test@Example.Com');
    expect(found).toHaveLength(2);
    expect(found.map((p) => p.id)).toContain(created1.id);
    expect(found.map((p) => p.id)).toContain(created2.id);
  });

  it('appends activity to a project', async () => {
    const created = await repo.create({
      mode: 'establishment',
      vertical: 'tech',
      companyName: 'Test Company',
      url: null,
      answers: { q0_mode: 'establishment' },
    });

    const withActivity = await repo.appendActivity(created.id, {
      agent: 'research',
      agentAr: 'وكيل البحث',
      status: 'started',
      messageAr: 'بدأت البحث',
    });

    expect(withActivity).not.toBeNull();
    expect(withActivity?.activities).toHaveLength(1);
    expect(withActivity?.activities[0]?.seq).toBe(0);
    expect(withActivity?.activities[0]?.agent).toBe('research');
    expect(withActivity?.activities[0]?.messageAr).toBe('بدأت البحث');
  });

  it('appends message to a project', async () => {
    const created = await repo.create({
      mode: 'establishment',
      vertical: 'tech',
      companyName: 'Test Company',
      url: null,
      answers: { q0_mode: 'establishment' },
    });

    const withMessage = await repo.appendMessage(created.id, {
      from: 'chat',
      to: 'research',
      type: 'data_share',
      messageAr: 'ابدأ البحث',
      payload: { test: true },
    });

    expect(withMessage).not.toBeNull();
    expect(withMessage?.messages).toHaveLength(1);
    expect(withMessage?.messages[0]?.seq).toBe(0);
    expect(withMessage?.messages[0]?.from).toBe('chat');
    expect(withMessage?.messages[0]?.to).toBe('research');
  });

  it('returns null for non-existent project', async () => {
    const found = await repo.findById('non-existent-id');
    expect(found).toBeNull();

    const updated = await repo.update('non-existent-id', { status: 'complete' });
    expect(updated).toBeNull();
  });

  it('flush completes without error', async () => {
    const created = await repo.create({
      mode: 'establishment',
      vertical: 'tech',
      companyName: 'Test Company',
      url: null,
      answers: { q0_mode: 'establishment' },
    });

    // Flush should succeed even if the ID doesn't exist (no-op).
    await expect(repo.flush(created.id)).resolves.toBeUndefined();
  });
});
