/**
 * Supabase database type definitions generated from schema.
 * These types are used throughout the app for type-safe database operations.
 */

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          owner_user_id: string;
          slug: string;
          name_ar: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_user_id: string;
          slug: string;
          name_ar: string;
          created_at?: string;
        };
        Update: {
          slug?: string;
          name_ar?: string;
        };
      };
      workspace_members: {
        Row: {
          workspace_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'editor' | 'viewer';
          joined_at: string;
        };
        Insert: {
          workspace_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
          joined_at?: string;
        };
        Update: {
          role?: 'owner' | 'admin' | 'editor' | 'viewer';
        };
      };
      companies: {
        Row: {
          id: string;
          workspace_id: string;
          owner_user_id: string | null;
          email: string | null;
          mode: 'establishment' | 'compliance' | 'operational_compliance';
          status: 'pending' | 'running' | 'complete' | 'error';
          phase: 'roadmap' | 'active_monitoring';
          company_name: string;
          vertical: string;
          city_id: string | null;
          url: string | null;
          answers: Record<string, unknown>;
          cost_min_sar: number;
          cost_max_sar: number;
          cost_item_count: number;
          top_warnings: string[] | null;
          compliance_score: number | null;
          total_fine_ceiling_sar: number | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          owner_user_id?: string | null;
          email?: string | null;
          mode: 'establishment' | 'compliance' | 'operational_compliance';
          status?: 'pending' | 'running' | 'complete' | 'error';
          phase?: 'roadmap' | 'active_monitoring';
          company_name: string;
          vertical: string;
          city_id?: string | null;
          url?: string | null;
          answers?: Record<string, unknown>;
          cost_min_sar?: number;
          cost_max_sar?: number;
          cost_item_count?: number;
          top_warnings?: string[] | null;
          compliance_score?: number | null;
          total_fine_ceiling_sar?: number | null;
          error_message?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          owner_user_id?: string | null;
          email?: string | null;
          status?: 'pending' | 'running' | 'complete' | 'error';
          phase?: 'roadmap' | 'active_monitoring';
          company_name?: string;
          vertical?: string;
          city_id?: string | null;
          url?: string | null;
          answers?: Record<string, unknown>;
          cost_min_sar?: number;
          cost_max_sar?: number;
          cost_item_count?: number;
          top_warnings?: string[] | null;
          compliance_score?: number | null;
          total_fine_ceiling_sar?: number | null;
          error_message?: string | null;
          updated_at?: string;
        };
      };
      company_entities: {
        Row: {
          id: string;
          company_id: string;
          name_ar: string;
          name_en: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          name_ar: string;
          name_en: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          name_ar?: string;
          name_en?: string;
          description?: string | null;
        };
      };
      company_roadmap_weeks: {
        Row: {
          id: string;
          company_id: string;
          week: number;
          title_ar: string;
          entities: Record<string, unknown>[];
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          week: number;
          title_ar: string;
          entities?: Record<string, unknown>[];
          created_at?: string;
        };
        Update: {
          title_ar?: string;
          entities?: Record<string, unknown>[];
        };
      };
      company_regulatory_updates: {
        Row: {
          id: string;
          company_id: string;
          for_agent: string;
          summary_ar: string;
          date: string | null;
          source: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          for_agent: string;
          summary_ar: string;
          date?: string | null;
          source: string;
          created_at?: string;
        };
        Update: {
          summary_ar?: string;
          date?: string | null;
          source?: string;
        };
      };
      company_gaps: {
        Row: {
          id: string;
          company_id: string;
          title_ar: string;
          description_ar: string;
          risk_level: 'low' | 'medium' | 'high' | 'critical';
          estimated_cost_sar: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title_ar: string;
          description_ar: string;
          risk_level?: 'low' | 'medium' | 'high' | 'critical';
          estimated_cost_sar?: number | null;
          created_at?: string;
        };
        Update: {
          title_ar?: string;
          description_ar?: string;
          risk_level?: 'low' | 'medium' | 'high' | 'critical';
          estimated_cost_sar?: number | null;
        };
      };
      company_analysis: {
        Row: {
          id: string;
          company_id: string;
          summary_ar: string;
          details: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          summary_ar: string;
          details?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          summary_ar?: string;
          details?: Record<string, unknown>;
        };
      };
      company_operational_report: {
        Row: {
          id: string;
          company_id: string;
          content: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          content?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          content?: Record<string, unknown>;
        };
      };
      company_scan_result: {
        Row: {
          id: string;
          company_id: string;
          findings: Record<string, unknown>[];
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          findings?: Record<string, unknown>[];
          created_at?: string;
        };
        Update: {
          findings?: Record<string, unknown>[];
        };
      };
      renewals: {
        Row: {
          id: string;
          company_id: string;
          entity_name_ar: string;
          renewal_date: string;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          entity_name_ar: string;
          renewal_date: string;
          status?: string;
          created_at?: string;
        };
        Update: {
          entity_name_ar?: string;
          renewal_date?: string;
          status?: string;
        };
      };
      documents: {
        Row: {
          id: string;
          company_id: string;
          title_ar: string;
          type: string;
          content: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          title_ar: string;
          type: string;
          content: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title_ar?: string;
          type?: string;
          content?: string;
          updated_at?: string;
        };
      };
      document_versions: {
        Row: {
          id: string;
          document_id: string;
          version: number;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          version: number;
          content: string;
          created_at?: string;
        };
        Update: never;
      };
      audit_logs: {
        Row: {
          id: string;
          workspace_id: string;
          user_id: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          user_id?: string | null;
          action: string;
          resource_type: string;
          resource_id: string;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: never;
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string | null;
          session_data: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          session_data?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          user_id?: string | null;
          session_data?: Record<string, unknown>;
          updated_at?: string;
        };
      };
      knowledge_versions: {
        Row: {
          id: string;
          entity_type: string;
          version: string;
          data: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          entity_type: string;
          version: string;
          data: Record<string, unknown>;
          created_at?: string;
        };
        Update: never;
      };
      agent_runs: {
        Row: {
          id: string;
          company_id: string;
          status: string;
          started_at: string;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          status?: string;
          started_at?: string;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          status?: string;
          completed_at?: string | null;
        };
      };
      agent_activities: {
        Row: {
          id: string;
          company_id: string;
          run_id: string;
          agent: string;
          agent_ar: string;
          status: string;
          message_ar: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          run_id: string;
          agent: string;
          agent_ar: string;
          status: string;
          message_ar: string;
          created_at?: string;
        };
        Update: {
          status?: string;
        };
      };
      agent_messages: {
        Row: {
          id: string;
          company_id: string;
          run_id: string;
          from_agent: string;
          to_agent: string;
          payload: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          company_id: string;
          run_id: string;
          from_agent: string;
          to_agent: string;
          payload?: Record<string, unknown>;
          created_at?: string;
        };
        Update: never;
      };
      agent_telemetry: {
        Row: {
          id: string;
          run_id: string;
          agent: string;
          input_tokens: number;
          output_tokens: number;
          duration_ms: number;
          cost_usd: number;
          model: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          run_id: string;
          agent: string;
          input_tokens: number;
          output_tokens: number;
          duration_ms: number;
          cost_usd: number;
          model: string;
          created_at?: string;
        };
        Update: never;
      };
    };
    Views: Record<string, never>;
    Functions: {
      is_workspace_member: {
        Args: {
          ws_id: string;
          role_filter?: string[];
        };
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
