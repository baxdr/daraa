// @ts-nocheck
// TODO(phase-4): rewrite with proper Supabase TS strict types. Filesystem driver
// remains the default; this file compiles only when PERSISTENCE_DRIVER=supabase.
/**
 * Supabase-backed WorkspaceRepository implementation.
 *
 * Manages workspace CRUD and membership.
 */

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WorkspaceRepository, Workspace } from '@/core/repositories/workspace-repository';
import type { Database } from '@/types/supabase';

export class SupabaseWorkspaceRepository implements WorkspaceRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async create(input: { name: string; ownerId: string }): Promise<Workspace> {
    const id = nanoid();

    // Generate a unique slug from name
    const slug = `${input.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .substring(0, 20)}-${id.substring(0, 6)}`;

    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .insert([
        {
          id,
          owner_user_id: input.ownerId,
          slug,
          name_ar: input.name,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Add owner to workspace_members
    const { error: memberError } = await this.supabase.from('workspace_members').insert([
      {
        workspace_id: workspace.id,
        user_id: input.ownerId,
        role: 'owner',
        joined_at: new Date().toISOString(),
      },
    ]);

    if (memberError) throw memberError;

    return {
      id: workspace.id,
      name: workspace.name_ar,
      ownerId: workspace.owner_user_id,
      createdAt: new Date(workspace.created_at).getTime(),
    };
  }

  async findById(id: string): Promise<Workspace | null> {
    const { data: workspace, error } = await this.supabase
      .from('workspaces')
      .select()
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      id: workspace.id,
      name: workspace.name_ar,
      ownerId: workspace.owner_user_id,
      createdAt: new Date(workspace.created_at).getTime(),
    };
  }

  async findPrimaryForUser(userId: string): Promise<Workspace> {
    // Find the first workspace owned by the user, or create one
    const { data: workspaces, error: selectError } = await this.supabase
      .from('workspaces')
      .select('id, name_ar, owner_user_id, created_at')
      .eq('owner_user_id', userId)
      .limit(1);

    if (selectError) throw selectError;

    const ws = workspaces?.[0];
    if (ws) {
      return {
        id: ws.id,
        name: ws.name_ar,
        ownerId: ws.owner_user_id,
        createdAt: new Date(ws.created_at).getTime(),
      };
    }

    // Create a personal workspace
    return this.create({
      name: 'مشروعي الشخصي',
      ownerId: userId,
    });
  }
}
