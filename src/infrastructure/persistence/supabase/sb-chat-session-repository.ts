// @ts-nocheck
// TODO(phase-4): rewrite with proper Supabase TS strict types. Filesystem driver
// remains the default; this file compiles only when PERSISTENCE_DRIVER=supabase.
/**
 * Supabase-backed ChatSessionRepository implementation.
 *
 * Persists chat sessions to the chat_sessions table.
 * Sessions can belong to authenticated or anonymous users (user_id nullable).
 */

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ChatSessionRepository } from '@/core/repositories/chat-session-repository';
import type { ChatSession } from '@/lib/chat-sessions';
import type { Database } from '@/types/supabase';

export class SupabaseChatSessionRepository implements ChatSessionRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async create(): Promise<ChatSession> {
    const id = nanoid();
    const now = new Date().toISOString();

    // Get current user (may be null for anonymous sessions)
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    const { data: session, error } = await this.supabase
      .from('chat_sessions')
      .insert([
        {
          id,
          user_id: user?.id ?? null,
          session_data: {},
          created_at: now,
          updated_at: now,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return {
      id: session.id,
      userId: session.user_id ?? undefined,
      sessionData: session.session_data,
      createdAt: new Date(session.created_at).getTime(),
    };
  }

  async findById(id: string): Promise<ChatSession | null> {
    const { data: session, error } = await this.supabase
      .from('chat_sessions')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: session.id,
      userId: session.user_id ?? undefined,
      sessionData: session.session_data,
      createdAt: new Date(session.created_at).getTime(),
    };
  }

  async update(id: string, patch: Partial<ChatSession>): Promise<ChatSession | null> {
    const updateData: Record<string, unknown> = {};

    if (patch.userId !== undefined) updateData.user_id = patch.userId ?? null;
    if (patch.sessionData !== undefined) updateData.session_data = patch.sessionData;

    const { data: session, error } = await this.supabase
      .from('chat_sessions')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: session.id,
      userId: session.user_id ?? undefined,
      sessionData: session.session_data,
      createdAt: new Date(session.created_at).getTime(),
    };
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from('chat_sessions').delete().eq('id', id);

    if (error) throw error;
  }
}
