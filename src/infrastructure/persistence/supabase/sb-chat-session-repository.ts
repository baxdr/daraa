/**
 * Supabase-backed ChatSessionRepository (minimal blob schema).
 *
 * Stores the entire ChatSession as a jsonb document in `daraa_chat_sessions`.
 * The session shape lives in `src/lib/chat-sessions.ts` and is the source of
 * truth — this repository is just a serializer.
 *
 * Uses the service-role client (RLS bypassed) because /chat is anonymous.
 */

import { nanoid } from 'nanoid';
import { FIRST_QUESTION } from '@/agents/chat-flow';
import type { ChatSessionRepository } from '@/core/repositories/chat-session-repository';
import type { ChatSession } from '@/lib/chat-sessions';
import { getServiceRoleClient } from './sb-service-client';

const TABLE = 'daraa_chat_sessions';

interface SessionRow {
  id: string;
  data: ChatSession;
}

export class SupabaseChatSessionRepository implements ChatSessionRepository {
  async create(): Promise<ChatSession> {
    const session: ChatSession = {
      id: nanoid(),
      createdAt: Date.now(),
      currentQuestion: FIRST_QUESTION,
      answers: {},
    };
    const { error } = await getServiceRoleClient()
      .from(TABLE)
      .insert({ id: session.id, data: session });
    if (error) throw new Error(`chat-session create failed: ${error.message}`);
    return session;
  }

  async findById(id: string): Promise<ChatSession | null> {
    const { data, error } = await getServiceRoleClient()
      .from(TABLE)
      .select('id, data')
      .eq('id', id)
      .maybeSingle<SessionRow>();
    if (error) throw new Error(`chat-session findById failed: ${error.message}`);
    return data?.data ?? null;
  }

  async update(id: string, patch: Partial<ChatSession>): Promise<ChatSession | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const merged: ChatSession = { ...existing, ...patch };
    const { error } = await getServiceRoleClient()
      .from(TABLE)
      .update({ data: merged, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) throw new Error(`chat-session update failed: ${error.message}`);
    return merged;
  }

  async delete(id: string): Promise<void> {
    const { error } = await getServiceRoleClient().from(TABLE).delete().eq('id', id);
    if (error) throw new Error(`chat-session delete failed: ${error.message}`);
  }
}
