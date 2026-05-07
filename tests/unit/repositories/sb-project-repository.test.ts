/**
 * Unit tests for SupabaseProjectRepository.
 * Uses mocked Supabase client to verify mapping logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SupabaseProjectRepository } from '@/infrastructure/persistence/supabase/sb-project-repository';
import type { Database } from '@/types/supabase';

describe('SupabaseProjectRepository', () => {
  let mockSupabase: Partial<SupabaseClient<Database>>;
  let repo: SupabaseProjectRepository;

  beforeEach(() => {
    // Mock the Supabase client
    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      } as any,
      from: vi.fn((table: string) => {
        if (table === 'companies') {
          return {
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-id',
                    workspace_id: 'system',
                    owner_user_id: null,
                    email: null,
                    mode: 'establishment',
                    status: 'pending',
                    phase: 'roadmap',
                    company_name: 'Test Company',
                    vertical: 'tech',
                    city_id: null,
                    url: null,
                    answers: { q0_mode: 'establishment' },
                    cost_min_sar: 0,
                    cost_max_sar: 0,
                    cost_item_count: 0,
                    top_warnings: null,
                    compliance_score: null,
                    total_fine_ceiling_sar: null,
                    error_message: null,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: {
                    id: 'test-id',
                    workspace_id: 'system',
                    owner_user_id: null,
                    mode: 'establishment',
                    company_name: 'Test Company',
                    vertical: 'tech',
                    cost_min_sar: 0,
                    cost_max_sar: 0,
                    cost_item_count: 0,
                    created_at: new Date().toISOString(),
                  },
                  error: null,
                }),
              }),
            }),
            update: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                select: vi.fn().mockReturnValue({
                  single: vi.fn().mockResolvedValue({
                    data: {
                      id: 'test-id',
                      status: 'complete',
                      company_name: 'Updated Name',
                    },
                    error: null,
                  }),
                }),
              }),
            }),
          } as any;
        }
        return {} as any;
      }),
    } as any;

    repo = new SupabaseProjectRepository(mockSupabase as SupabaseClient<Database>);
  });

  it('creates a project and maps to ProjectRecord', async () => {
    const created = await repo.create({
      mode: 'establishment',
      vertical: 'tech',
      companyName: 'Test Company',
      url: null,
      answers: { q0_mode: 'establishment' },
    });

    expect(created.id).toBe('test-id');
    expect(created.companyName).toBe('Test Company');
    expect(created.mode).toBe('establishment');
    expect(created.status).toBe('pending');
    expect(created.phase).toBe('roadmap');
  });

  it('retrieves a project by ID', async () => {
    const retrieved = await repo.findById('test-id');

    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe('test-id');
    expect(retrieved?.companyName).toBe('Test Company');
    expect(retrieved?.mode).toBe('establishment');
  });

  it('handles not found gracefully', async () => {
    // Mock 404 response
    const mockClient = {
      ...mockSupabase,
      from: vi.fn(() => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'PGRST116', message: 'Not found' },
            }),
          }),
        }),
      })),
    } as any;

    const testRepo = new SupabaseProjectRepository(mockClient as SupabaseClient<Database>);
    const result = await testRepo.findById('nonexistent');

    expect(result).toBeNull();
  });

  it('updates a project record', async () => {
    const updated = await repo.update('test-id', {
      status: 'complete',
      companyName: 'Updated Name',
    });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('complete');
    expect(updated?.companyName).toBe('Updated Name');
  });
});
