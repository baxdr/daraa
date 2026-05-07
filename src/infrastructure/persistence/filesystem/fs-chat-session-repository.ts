/**
 * Filesystem-backed ChatSessionRepository implementation.
 *
 * Wraps the existing chat-sessions.ts in-memory Map.
 * Sessions are ephemeral (1-hour TTL) for the MVP.
 */

import {
  createSession as storeCreateSession,
  getSession as storeGetSession,
} from '@/lib/chat-sessions';
import type { ChatSessionRepository } from '@/core/repositories/chat-session-repository';
import type { ChatSession } from '@/lib/chat-sessions';

export class FilesystemChatSessionRepository implements ChatSessionRepository {
  async create(): Promise<ChatSession> {
    return storeCreateSession();
  }

  async findById(id: string): Promise<ChatSession | null> {
    return storeGetSession(id);
  }

  async update(id: string, patch: Partial<ChatSession>): Promise<ChatSession | null> {
    const session = storeGetSession(id);
    if (!session) return null;
    Object.assign(session, patch);
    return session;
  }

  async delete(_id: string): Promise<void> {
    // TODO: Phase 1 (Supabase) adds explicit deletion.
    // For now, TTL expiration is the only cleanup mechanism.
  }
}
