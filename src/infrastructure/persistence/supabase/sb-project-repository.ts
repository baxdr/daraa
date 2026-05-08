/**
 * Supabase-backed ProjectRepository (minimal blob schema).
 *
 * Stores the entire ProjectRecord as a jsonb document in `daraa_projects`.
 * The in-memory `project-store.ts` map remains the canonical source DURING
 * an orchestrator run (so emit/send mutations stay fast). After every
 * mutation that goes through the repository, we upsert the full record to
 * Supabase. This guarantees:
 *
 *   - Live progress visible from the same warm lambda (in-memory + ts hits)
 *   - Final / persisted state visible from any lambda (SB upsert on
 *     update + appendActivity + appendMessage + flush)
 *
 * Demo projects are bundled as JSON files at deploy time and read from disk
 * (filesystem is read-only on Vercel but reading bundled files is fine).
 */

import { promises as fs, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  createProject as storeCreateProject,
  getProject as storeGetProject,
  updateProject as storeUpdateProject,
  emitProjectActivity as storeEmitProjectActivity,
  sendProjectMessage as storeSendProjectMessage,
} from '@/lib/project-store';
import type { ProjectRepository } from '@/core/repositories/project-repository';
import type { ProjectRecord } from '@/core/domain/project.entity';
import type { AgentActivity, AgentMessage } from '@/agents/types';
import { getServiceRoleClient } from './sb-service-client';

const TABLE = 'daraa_projects';
const DEMO_DIR = join(process.cwd(), 'data', 'projects');

interface ProjectRow {
  id: string;
  data: ProjectRecord;
}

function readDemoFromDisk(id: string): ProjectRecord | null {
  if (!id.startsWith('demo-')) return null;
  const path = join(DEMO_DIR, `${id}.json`);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf8');
    return JSON.parse(raw) as ProjectRecord;
  } catch {
    return null;
  }
}

export class SupabaseProjectRepository implements ProjectRepository {
  async create(input: {
    mode?: ProjectRecord['mode'];
    vertical: ProjectRecord['vertical'];
    companyName: string;
    cityId?: string | undefined;
    answers: ProjectRecord['answers'];
    email?: string | undefined;
    ownerUserId?: string | undefined;
    workspaceId?: string | undefined;
  }): Promise<ProjectRecord> {
    const record = storeCreateProject({
      ...(input.mode !== undefined ? { mode: input.mode } : {}),
      vertical: input.vertical,
      companyName: input.companyName,
      ...(input.cityId !== undefined ? { cityId: input.cityId } : {}),
      answers: input.answers,
      ...(input.email !== undefined ? { email: input.email } : {}),
      ...(input.ownerUserId !== undefined ? { ownerUserId: input.ownerUserId } : {}),
      ...(input.workspaceId !== undefined ? { workspaceId: input.workspaceId } : {}),
    });
    await this.upsert(record);
    return record;
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    const inMem = storeGetProject(id);
    if (inMem) return inMem;

    const demo = readDemoFromDisk(id);
    if (demo) return demo;

    const { data, error } = await getServiceRoleClient()
      .from(TABLE)
      .select('id, data')
      .eq('id', id)
      .maybeSingle<ProjectRow>();
    if (error) throw new Error(`project findById failed: ${error.message}`);
    return data?.data ?? null;
  }

  async update(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    let updated = storeUpdateProject(id, patch);
    if (!updated) {
      const fromSb = await this.findById(id);
      if (!fromSb) return null;
      updated = storeUpdateProject(id, patch) ?? { ...fromSb, ...patch };
    }
    await this.upsert(updated);
    return updated;
  }

  async findByEmail(email: string): Promise<readonly ProjectRecord[]> {
    const normalized = email.trim().toLowerCase();
    if (!normalized) return [];
    const { data, error } = await getServiceRoleClient()
      .from(TABLE)
      .select('id, data')
      .ilike('email', normalized)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`project findByEmail failed: ${error.message}`);
    return (data ?? []).map((r) => (r as ProjectRow).data);
  }

  async findByOwner(ownerUserId: string): Promise<readonly ProjectRecord[]> {
    const trimmed = ownerUserId.trim();
    if (!trimmed) return [];
    const { data, error } = await getServiceRoleClient()
      .from(TABLE)
      .select('id, data')
      .eq('owner_user_id', trimmed)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`project findByOwner failed: ${error.message}`);
    return (data ?? []).map((r) => (r as ProjectRow).data).filter((p) => !p.id.startsWith('demo-'));
  }

  async appendActivity(
    id: string,
    activity: Omit<AgentActivity, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null> {
    storeEmitProjectActivity(id, activity.agent, activity.status, activity.messageAr);
    const updated = storeGetProject(id);
    if (updated) await this.upsert(updated);
    return updated;
  }

  async appendMessage(
    id: string,
    message: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null> {
    storeSendProjectMessage(id, message);
    const updated = storeGetProject(id);
    if (updated) await this.upsert(updated);
    return updated;
  }

  async flush(id: string): Promise<void> {
    const project = storeGetProject(id);
    if (project) await this.upsert(project);
  }

  private async upsert(record: ProjectRecord): Promise<void> {
    const row = {
      id: record.id,
      data: record,
      email: record.email ?? null,
      owner_user_id: record.ownerUserId ?? null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await getServiceRoleClient().from(TABLE).upsert(row, { onConflict: 'id' });
    if (error) throw new Error(`project upsert failed: ${error.message}`);
  }
}

// Re-export `fs` so the bundler keeps it (read-only access to demo JSONs).
void fs;
