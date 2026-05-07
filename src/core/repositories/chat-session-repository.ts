/**
 * ChatSessionRepository interface — abstraction for chat session persistence.
 *
 * Sessions track conversation state as the user progresses through the
 * interview questions. TTL is handled at the implementation level.
 */

import type { ChatSession } from '@/lib/chat-sessions';

export interface ChatSessionRepository {
  /**
   * Create a new chat session.
   */
  create(): Promise<ChatSession>;

  /**
   * Retrieve a session by ID.
   */
  findById(id: string): Promise<ChatSession | null>;

  /**
   * Update a session (e.g., record an answer, advance the question).
   */
  update(id: string, patch: Partial<ChatSession>): Promise<ChatSession | null>;

  /**
   * Delete a session (e.g., when user abandons it or it expires).
   */
  delete(id: string): Promise<void>;
}
