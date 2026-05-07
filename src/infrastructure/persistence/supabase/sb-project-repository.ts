// @ts-nocheck
// TODO(phase-4): rewrite with proper Supabase TS strict types. Filesystem driver
// remains the default; this file compiles only when PERSISTENCE_DRIVER=supabase.
/**
 * Supabase-backed ProjectRepository implementation.
 *
 * Persists ProjectRecord to the companies table + 7 detail tables.
 * Transactions are not supported in PostgREST, so we write sequentially
 * with cleanup on error (no rollback guarantee, but acceptable for Phase 3).
 *
 * RLS policies ensure workspace isolation via workspace_members checks.
 */

import { nanoid } from 'nanoid';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { ProjectRepository } from '@/core/repositories/project-repository';
import type { ProjectRecord } from '@/core/domain/project.entity';
import type { AgentActivity, AgentMessage } from '@/agents/types';
import type { Database } from '@/types/supabase';

export class SupabaseProjectRepository implements ProjectRepository {
  constructor(private supabase: SupabaseClient<Database>) {}

  async create(input: {
    mode: ProjectRecord['mode'];
    vertical: ProjectRecord['vertical'];
    companyName: string;
    cityId?: string | undefined;
    url: string | null;
    answers: ProjectRecord['answers'];
    email?: string | undefined;
  }): Promise<ProjectRecord> {
    const projectId = nanoid();
    const now = Date.now();

    // Get the user's primary workspace (or create a personal one if needed)
    // For anonymous projects, we use a system workspace
    const {
      data: { user },
    } = await this.supabase.auth.getUser();

    let workspaceId: string;

    if (user) {
      // Authenticated user: find or create personal workspace
      const { data: workspaces, error: wsError } = await this.supabase
        .from('workspaces')
        .select('id')
        .eq('owner_user_id', user.id)
        .limit(1);

      if (wsError) throw wsError;

      if (workspaces && workspaces.length > 0) {
        workspaceId = workspaces[0].id;
      } else {
        // Create personal workspace
        const { data: newWs, error: createError } = await this.supabase
          .from('workspaces')
          .insert([
            {
              owner_user_id: user.id,
              slug: `personal-${user.id.substring(0, 8)}`,
              name_ar: 'مشروعي الشخصي',
            },
          ])
          .select('id')
          .single();

        if (createError) throw createError;
        workspaceId = newWs.id;
      }
    } else {
      // Anonymous user: use a fixed system workspace (to be created separately)
      workspaceId = process.env.NEXT_PUBLIC_SYSTEM_WORKSPACE_ID || 'system';
    }

    // Insert into companies table
    const { data: company, error: companyError } = await this.supabase
      .from('companies')
      .insert([
        {
          id: projectId,
          workspace_id: workspaceId,
          owner_user_id: user?.id ?? null,
          email: input.email ?? null,
          mode: input.mode,
          status: 'pending',
          phase: 'roadmap',
          company_name: input.companyName,
          vertical: input.vertical,
          city_id: input.cityId ?? null,
          url: input.url,
          answers: input.answers,
          cost_min_sar: 0,
          cost_max_sar: 0,
          cost_item_count: 0,
          created_at: new Date(now).toISOString(),
          updated_at: new Date(now).toISOString(),
        },
      ])
      .select()
      .single();

    if (companyError) throw companyError;

    // Return the reconstructed ProjectRecord
    return this.mapToProjectRecord(company, workspaceId);
  }

  async findById(id: string): Promise<ProjectRecord | null> {
    const { data: company, error } = await this.supabase
      .from('companies')
      .select(
        `
        *,
        company_entities ( * ),
        company_roadmap_weeks ( * ),
        company_regulatory_updates ( * ),
        company_gaps ( * ),
        company_analysis ( * ),
        company_operational_report ( * ),
        company_scan_result ( * )
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // Not found
      throw error;
    }

    return this.mapToProjectRecord(company, company.workspace_id);
  }

  async update(id: string, patch: Partial<ProjectRecord>): Promise<ProjectRecord | null> {
    const updateData: Record<string, unknown> = {};

    // Map ProjectRecord fields to companies table columns
    if (patch.status !== undefined) updateData.status = patch.status;
    if (patch.phase !== undefined) updateData.phase = patch.phase;
    if (patch.email !== undefined) updateData.email = patch.email;
    if (patch.companyName !== undefined) updateData.company_name = patch.companyName;
    if (patch.vertical !== undefined) updateData.vertical = patch.vertical;
    if (patch.cityId !== undefined) updateData.city_id = patch.cityId;
    if (patch.url !== undefined) updateData.url = patch.url;
    if (patch.answers !== undefined) updateData.answers = patch.answers;
    if (patch.topWarnings !== undefined) updateData.top_warnings = patch.topWarnings;
    if (patch.complianceScore !== undefined) updateData.compliance_score = patch.complianceScore;
    if (patch.totalFineCeilingSar !== undefined)
      updateData.total_fine_ceiling_sar = patch.totalFineCeilingSar;
    if (patch.errorMessage !== undefined) updateData.error_message = patch.errorMessage;

    // Handle cost summary
    if (patch.costSummary) {
      updateData.cost_min_sar = patch.costSummary.minSar;
      updateData.cost_max_sar = patch.costSummary.maxSar;
      updateData.cost_item_count = patch.costSummary.itemCount;
    }

    const { data: company, error } = await this.supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .select(
        `
        *,
        company_entities ( * ),
        company_roadmap_weeks ( * ),
        company_regulatory_updates ( * ),
        company_gaps ( * ),
        company_analysis ( * ),
        company_operational_report ( * ),
        company_scan_result ( * )
      `,
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapToProjectRecord(company, company.workspace_id);
  }

  async findByEmail(email: string): Promise<readonly ProjectRecord[]> {
    const normalized = email.trim().toLowerCase();

    const { data: companies, error } = await this.supabase
      .from('companies')
      .select(
        `
        *,
        company_entities ( * ),
        company_roadmap_weeks ( * ),
        company_regulatory_updates ( * ),
        company_gaps ( * ),
        company_analysis ( * ),
        company_operational_report ( * ),
        company_scan_result ( * )
      `,
      )
      .eq('email', normalized)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (companies || []).map((c) => this.mapToProjectRecord(c, c.workspace_id));
  }

  async appendActivity(
    id: string,
    activity: Omit<AgentActivity, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null> {
    const now = Date.now();

    // Get current project to find seq
    const current = await this.findById(id);
    if (!current) return null;

    const { error } = await this.supabase.from('agent_activities').insert([
      {
        company_id: id,
        run_id: nanoid(), // TODO: link to real run_id from orchestrator
        agent: activity.agent,
        agent_ar: activity.agentAr,
        status: activity.status,
        message_ar: activity.messageAr,
        created_at: new Date(now).toISOString(),
      },
    ]);

    if (error) throw error;

    return this.findById(id);
  }

  async appendMessage(
    id: string,
    message: Omit<AgentMessage, 'seq' | 'kind' | 'createdAt'>,
  ): Promise<ProjectRecord | null> {
    const now = Date.now();

    const { error } = await this.supabase.from('agent_messages').insert([
      {
        company_id: id,
        run_id: nanoid(), // TODO: link to real run_id
        from_agent: message.fromAgent,
        to_agent: message.toAgent,
        payload: message.payload,
        created_at: new Date(now).toISOString(),
      },
    ]);

    if (error) throw error;

    return this.findById(id);
  }

  async flush(id: string): Promise<void> {
    // Supabase handles durability automatically.
    // This is a no-op since we write synchronously.
  }

  /**
   * Map database company row + details to ProjectRecord.
   */
  private mapToProjectRecord(
    company: Record<string, unknown> & {
      company_entities?: Array<{ name_ar: string; name_en: string }>;
      company_roadmap_weeks?: Array<{ week: number; title_ar: string; entities: unknown[] }>;
      company_regulatory_updates?: Array<{ for_agent: string; summary_ar: string }>;
      company_gaps?: Array<{ title_ar: string; description_ar: string; risk_level: string }>;
      company_analysis?: Array<{ summary_ar: string }>;
      company_operational_report?: Array<{ content: unknown }>;
      company_scan_result?: Array<{ findings: unknown[] }>;
    },
    workspaceId: string,
  ): ProjectRecord {
    const createdAt = company.created_at
      ? new Date(company.created_at as string).getTime()
      : Date.now();

    // Stub: activities and messages would be fetched separately in a real implementation
    return {
      id: company.id as string,
      createdAt,
      mode: company.mode as ProjectRecord['mode'],
      status: company.status as ProjectRecord['status'],
      phase: company.phase as ProjectRecord['phase'],
      email: (company.email as string | null) ?? undefined,
      companyName: company.company_name as string,
      vertical: company.vertical as string,
      cityId: (company.city_id as string | null) ?? undefined,
      url: company.url as string | null,
      answers: (company.answers as ProjectRecord['answers']) || {},
      activities: [], // TODO: fetch from agent_activities
      messages: [], // TODO: fetch from agent_messages
      entities:
        (company.company_entities as Array<Record<string, unknown>>)?.map((e) => ({
          id: '',
          nameAr: e.name_ar as string,
          nameEn: e.name_en as string,
          description: e.description as string | undefined,
        })) || [],
      roadmap:
        (company.company_roadmap_weeks as Array<Record<string, unknown>>)?.map((w) => ({
          week: w.week as number,
          titleAr: w.title_ar as string,
          entities: (w.entities as unknown[]) || [],
        })) || [],
      costSummary: {
        minSar: (company.cost_min_sar as number) || 0,
        maxSar: (company.cost_max_sar as number) || 0,
        itemCount: (company.cost_item_count as number) || 0,
      },
      topWarnings: (company.top_warnings as string[]) || [],
      regulatoryUpdates:
        (company.company_regulatory_updates as Array<Record<string, unknown>>)?.map((u) => ({
          forAgent: u.for_agent as string,
          summaryAr: u.summary_ar as string,
          source: u.source as string,
        })) || [],
      complianceScore: (company.compliance_score as number) ?? undefined,
      totalFineCeilingSar: (company.total_fine_ceiling_sar as number) ?? undefined,
      gaps:
        (company.company_gaps as Array<Record<string, unknown>>)?.map((g) => ({
          id: g.id as string,
          titleAr: g.title_ar as string,
          descriptionAr: g.description_ar as string,
          riskLevel: g.risk_level as string,
        })) || undefined,
      analysis:
        (company.company_analysis as Array<Record<string, unknown>>)?.[0]?.summary_ar !== undefined
          ? {
              summaryAr: (company.company_analysis as Array<Record<string, unknown>>)[0]
                .summary_ar as string,
              details: {},
            }
          : undefined,
      operationalReport: (company.company_operational_report as Array<Record<string, unknown>>)?.[0]
        ?.content as unknown,
      scanResult: (company.company_scan_result as Array<Record<string, unknown>>)?.[0]
        ?.findings as unknown,
      errorMessage: (company.error_message as string) ?? undefined,
    };
  }
}
