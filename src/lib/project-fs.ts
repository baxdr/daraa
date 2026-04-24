/**
 * JSON file-backed persistence for project records.
 *
 * Design (see plan in chat history):
 *   - One file per project: data/projects/<projectId>.json
 *   - Email index: data/users/<emailHash>.json  { email, projectIds[], updatedAt }
 *   - Atomic writes via temp-file + rename (POSIX-atomic)
 *   - Write-coalescing with 150ms debounce per project
 *   - Single-writer-per-project per process guarantee
 *   - Eager scan on module init — rebuilds the in-memory map from disk
 *
 * This module is intentionally decoupled from project-store.ts: it only
 * deals with serialization. The store calls markDirty(id) whenever it
 * mutates a record, and we flush on a debounce.
 */

import { createHash } from 'node:crypto';
import { promises as fs, readFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import type { ProjectRecord } from './project-store';

const DATA_ROOT = join(process.cwd(), 'data');
const PROJECTS_DIR = join(DATA_ROOT, 'projects');
const USERS_DIR    = join(DATA_ROOT, 'users');
const FLUSH_DELAY_MS = 150;

const VALID_ID = /^[A-Za-z0-9_-]{10,32}$/;

/* ───────────────────────── directory bootstrap ───────────────────────── */

function ensureDirs() {
  if (!existsSync(PROJECTS_DIR)) mkdirSync(PROJECTS_DIR, { recursive: true });
  if (!existsSync(USERS_DIR))    mkdirSync(USERS_DIR,    { recursive: true });
  if (!existsSync(DATA_ROOT))    mkdirSync(DATA_ROOT,    { recursive: true });
}
ensureDirs();

/* ───────────────────────── email hashing ─────────────────────────────── */

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function emailHash(email: string): string {
  return createHash('sha256').update(normalizeEmail(email)).digest('hex').slice(0, 16);
}

interface UserIndexFile {
  email: string;
  projectIds: string[];
  updatedAt: number;
}

/* ───────────────────────── eager boot scan ───────────────────────────── */

/**
 * Read all persisted projects from disk synchronously at boot. Returns a
 * Map<projectId, ProjectRecord>. Small (~1KB–50KB per project, <100 projects
 * for a hackathon), so the 10–50ms cold start is acceptable.
 */
export function scanAllProjectsSync(): Map<string, ProjectRecord> {
  const map = new Map<string, ProjectRecord>();
  if (!existsSync(PROJECTS_DIR)) return map;
  let files: string[];
  try {
    files = readdirSync(PROJECTS_DIR);
  } catch {
    return map;
  }
  for (const f of files) {
    if (!f.endsWith('.json')) continue;
    const id = f.slice(0, -'.json'.length);
    if (!VALID_ID.test(id)) continue;
    try {
      const raw = readFileSync(join(PROJECTS_DIR, f), 'utf8');
      const parsed = JSON.parse(raw) as ProjectRecord;
      if (parsed && parsed.id === id) map.set(id, parsed);
    } catch (err) {
      console.warn('[project-fs] failed to read', f, err instanceof Error ? err.message : err);
    }
  }
  return map;
}

/* ───────────────────────── debounced flush ───────────────────────────── */

const pendingTimers = new Map<string, NodeJS.Timeout>();
const inFlight = new Set<string>();
const reDirtyAfterFlight = new Set<string>();

/**
 * Schedule a flush for this project id. Repeated calls within the debounce
 * window collapse into one write. Use this after any in-memory mutation.
 */
export function markDirty(project: ProjectRecord) {
  const id = project.id;
  const existing = pendingTimers.get(id);
  if (existing) clearTimeout(existing);
  const t = setTimeout(() => {
    pendingTimers.delete(id);
    void flushNow(project);
  }, FLUSH_DELAY_MS);
  pendingTimers.set(id, t);
}

/**
 * Flush a single project to disk *now*, bypassing the debounce. Use for
 * terminal states (status = 'complete' / 'error') where you want durability
 * immediately.
 */
export async function flushNow(project: ProjectRecord): Promise<void> {
  const existing = pendingTimers.get(project.id);
  if (existing) {
    clearTimeout(existing);
    pendingTimers.delete(project.id);
  }
  if (inFlight.has(project.id)) {
    // A write is already in progress for this project — mark the record as
    // dirty again so we run a second pass after the current finishes.
    reDirtyAfterFlight.add(project.id);
    return;
  }
  inFlight.add(project.id);
  try {
    await writeProjectAtomic(project);
    await updateEmailIndex(project);
  } catch (err) {
    console.warn('[project-fs] flush failed for', project.id, err instanceof Error ? err.message : err);
  } finally {
    inFlight.delete(project.id);
    if (reDirtyAfterFlight.delete(project.id)) {
      // The record was mutated while our write was in flight. The `project`
      // reference is authoritative (the store mutates in place) so re-flush
      // it immediately with whatever it holds now.
      void flushNow(project);
    }
  }
}

/** Fire-and-forget flush used during shutdown hooks. */
export async function flushAll(getRecord: (id: string) => ProjectRecord | undefined): Promise<void> {
  const ids = [...pendingTimers.keys()];
  for (const id of ids) {
    const rec = getRecord(id);
    if (rec) await flushNow(rec);
  }
}

/* ───────────────────────── atomic write ──────────────────────────────── */

async function writeProjectAtomic(project: ProjectRecord): Promise<void> {
  if (!VALID_ID.test(project.id)) {
    throw new Error(`refusing to write project with invalid id: ${project.id}`);
  }
  const final = join(PROJECTS_DIR, `${project.id}.json`);
  const tmp = `${final}.tmp.${process.pid}.${Math.random().toString(36).slice(2, 8)}`;
  const body = JSON.stringify(project); // compact — activities[] get large
  try {
    await fs.writeFile(tmp, body, { encoding: 'utf8', flag: 'wx' });
    await fs.rename(tmp, final);
  } catch (err) {
    // Best-effort cleanup; swallow secondary error.
    try { await fs.unlink(tmp); } catch { /* ignore */ }
    throw err;
  }
}

/* ───────────────────────── email index ───────────────────────────────── */

async function updateEmailIndex(project: ProjectRecord): Promise<void> {
  if (!project.email) return;
  const hash = emailHash(project.email);
  const indexPath = join(USERS_DIR, `${hash}.json`);
  let current: UserIndexFile = {
    email: normalizeEmail(project.email),
    projectIds: [],
    updatedAt: 0,
  };
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    const parsed = JSON.parse(raw) as UserIndexFile;
    if (parsed && Array.isArray(parsed.projectIds)) current = parsed;
  } catch {
    // no existing index — treat as new
  }
  if (!current.projectIds.includes(project.id)) current.projectIds.push(project.id);
  current.updatedAt = Date.now();
  current.email = normalizeEmail(project.email);
  const tmp = `${indexPath}.tmp.${process.pid}.${Math.random().toString(36).slice(2, 8)}`;
  try {
    await fs.writeFile(tmp, JSON.stringify(current), { encoding: 'utf8', flag: 'wx' });
    await fs.rename(tmp, indexPath);
  } catch (err) {
    try { await fs.unlink(tmp); } catch { /* ignore */ }
    console.warn('[project-fs] email index update failed for', hash, err instanceof Error ? err.message : err);
  }
}

export async function readProjectIdsForEmail(email: string): Promise<string[]> {
  const hash = emailHash(email);
  const indexPath = join(USERS_DIR, `${hash}.json`);
  try {
    const raw = await fs.readFile(indexPath, 'utf8');
    const parsed = JSON.parse(raw) as UserIndexFile;
    return Array.isArray(parsed.projectIds) ? parsed.projectIds : [];
  } catch {
    return [];
  }
}
