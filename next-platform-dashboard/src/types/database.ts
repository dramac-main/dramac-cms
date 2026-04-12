export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1";
  };
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string;
          agency_id: string;
          created_at: string | null;
          details: Json | null;
          id: string;
          ip_address: string | null;
          resource_id: string | null;
          resource_name: string | null;
          resource_type: string;
          user_id: string;
        };
        Insert: {
          action: string;
          agency_id: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_name?: string | null;
          resource_type: string;
          user_id: string;
        };
        Update: {
          action?: string;
          agency_id?: string;
          created_at?: string | null;
          details?: Json | null;
          id?: string;
          ip_address?: string | null;
          resource_id?: string | null;
          resource_name?: string | null;
          resource_type?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "activity_log_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      admin_settings: {
        Row: {
          created_at: string;
          id: string;
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          created_at?: string;
          id?: string;
          key: string;
          updated_at?: string;
          value?: Json;
        };
        Update: {
          created_at?: string;
          id?: string;
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      agencies: {
        Row: {
          billing_email: string | null;
          created_at: string | null;
          custom_branding: Json | null;
          date_format: string;
          default_currency: string;
          default_locale: string;
          default_timezone: string;
          description: string | null;
          dimension_unit: string;
          features: Json | null;
          goals: string[] | null;
          id: string;
          industry: string | null;
          max_sites: number | null;
          max_users: number | null;
          name: string;
          owner_id: string;
          plan: string;
          resellerclub_customer_id: string | null;
          slug: string;
          status: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          subscription_plan: string | null;
          subscription_status: string | null;
          subscription_tier: string | null;
          tax_inclusive: boolean;
          tax_rate: number;
          team_size: string | null;
          updated_at: string | null;
          website: string | null;
          weight_unit: string;
          white_label_enabled: boolean | null;
        };
        Insert: {
          billing_email?: string | null;
          created_at?: string | null;
          custom_branding?: Json | null;
          date_format?: string;
          default_currency?: string;
          default_locale?: string;
          default_timezone?: string;
          description?: string | null;
          dimension_unit?: string;
          features?: Json | null;
          goals?: string[] | null;
          id?: string;
          industry?: string | null;
          max_sites?: number | null;
          max_users?: number | null;
          name: string;
          owner_id: string;
          plan?: string;
          resellerclub_customer_id?: string | null;
          slug: string;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_plan?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          tax_inclusive?: boolean;
          tax_rate?: number;
          team_size?: string | null;
          updated_at?: string | null;
          website?: string | null;
          weight_unit?: string;
          white_label_enabled?: boolean | null;
        };
        Update: {
          billing_email?: string | null;
          created_at?: string | null;
          custom_branding?: Json | null;
          date_format?: string;
          default_currency?: string;
          default_locale?: string;
          default_timezone?: string;
          description?: string | null;
          dimension_unit?: string;
          features?: Json | null;
          goals?: string[] | null;
          id?: string;
          industry?: string | null;
          max_sites?: number | null;
          max_users?: number | null;
          name?: string;
          owner_id?: string;
          plan?: string;
          resellerclub_customer_id?: string | null;
          slug?: string;
          status?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          subscription_plan?: string | null;
          subscription_status?: string | null;
          subscription_tier?: string | null;
          tax_inclusive?: boolean;
          tax_rate?: number;
          team_size?: string | null;
          updated_at?: string | null;
          website?: string | null;
          weight_unit?: string;
          white_label_enabled?: boolean | null;
        };
        Relationships: [];
      };
      agency_domain_pricing: {
        Row: {
          agency_id: string;
          apply_platform_markup: boolean | null;
          billing_enabled: boolean | null;
          client_tiers: Json | null;
          created_at: string | null;
          custom_support_email: string | null;
          custom_terms_url: string | null;
          default_markup_type: string;
          default_markup_value: number;
          id: string;
          paddle_price_id: string | null;
          paddle_product_id: string | null;
          pricing_source: string | null;
          show_wholesale_prices: boolean | null;
          tld_pricing: Json | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          apply_platform_markup?: boolean | null;
          billing_enabled?: boolean | null;
          client_tiers?: Json | null;
          created_at?: string | null;
          custom_support_email?: string | null;
          custom_terms_url?: string | null;
          default_markup_type?: string;
          default_markup_value?: number;
          id?: string;
          paddle_price_id?: string | null;
          paddle_product_id?: string | null;
          pricing_source?: string | null;
          show_wholesale_prices?: boolean | null;
          tld_pricing?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          apply_platform_markup?: boolean | null;
          billing_enabled?: boolean | null;
          client_tiers?: Json | null;
          created_at?: string | null;
          custom_support_email?: string | null;
          custom_terms_url?: string | null;
          default_markup_type?: string;
          default_markup_value?: number;
          id?: string;
          paddle_price_id?: string | null;
          paddle_product_id?: string | null;
          pricing_source?: string | null;
          show_wholesale_prices?: boolean | null;
          tld_pricing?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agency_domain_pricing_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: true;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_members: {
        Row: {
          accepted_at: string | null;
          agency_id: string;
          id: string;
          invited_at: string | null;
          permissions: Json | null;
          role: string;
          user_id: string;
        };
        Insert: {
          accepted_at?: string | null;
          agency_id: string;
          id?: string;
          invited_at?: string | null;
          permissions?: Json | null;
          role?: string;
          user_id: string;
        };
        Update: {
          accepted_at?: string | null;
          agency_id?: string;
          id?: string;
          invited_at?: string | null;
          permissions?: Json | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "agency_members_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_module_installations: {
        Row: {
          agency_id: string;
          enabled_at: string | null;
          id: string;
          installed_at: string | null;
          installed_by: string | null;
          is_enabled: boolean | null;
          module_id: string;
          settings: Json | null;
          subscription_id: string | null;
        };
        Insert: {
          agency_id: string;
          enabled_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          is_enabled?: boolean | null;
          module_id: string;
          settings?: Json | null;
          subscription_id?: string | null;
        };
        Update: {
          agency_id?: string;
          enabled_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          is_enabled?: boolean | null;
          module_id?: string;
          settings?: Json | null;
          subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agency_module_installations_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_module_installations_installed_by_fkey";
            columns: ["installed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_module_installations_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "agency_module_installations_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "agency_module_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      agency_module_subscriptions: {
        Row: {
          agency_id: string;
          billing_cycle: string | null;
          cancel_at_period_end: boolean | null;
          created_at: string | null;
          current_installations: number | null;
          current_period_end: string | null;
          current_period_start: string | null;
          custom_price_monthly: number | null;
          custom_price_yearly: number | null;
          id: string;
          lemon_customer_id: string | null;
          lemon_order_id: string | null;
          lemon_subscription_id: string | null;
          markup_fixed_amount: number | null;
          markup_percentage: number | null;
          markup_type: string | null;
          max_installations: number | null;
          module_id: string;
          retail_price_monthly_cached: number | null;
          retail_price_yearly_cached: number | null;
          status: string | null;
          stripe_subscription_id: string | null;
          stripe_subscription_item_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          billing_cycle?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_installations?: number | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          custom_price_monthly?: number | null;
          custom_price_yearly?: number | null;
          id?: string;
          lemon_customer_id?: string | null;
          lemon_order_id?: string | null;
          lemon_subscription_id?: string | null;
          markup_fixed_amount?: number | null;
          markup_percentage?: number | null;
          markup_type?: string | null;
          max_installations?: number | null;
          module_id: string;
          retail_price_monthly_cached?: number | null;
          retail_price_yearly_cached?: number | null;
          status?: string | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_item_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          billing_cycle?: string | null;
          cancel_at_period_end?: boolean | null;
          created_at?: string | null;
          current_installations?: number | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          custom_price_monthly?: number | null;
          custom_price_yearly?: number | null;
          id?: string;
          lemon_customer_id?: string | null;
          lemon_order_id?: string | null;
          lemon_subscription_id?: string | null;
          markup_fixed_amount?: number | null;
          markup_percentage?: number | null;
          markup_type?: string | null;
          max_installations?: number | null;
          module_id?: string;
          retail_price_monthly_cached?: number | null;
          retail_price_yearly_cached?: number | null;
          status?: string | null;
          stripe_subscription_id?: string | null;
          stripe_subscription_item_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "agency_module_subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_approvals: {
        Row: {
          action_description: string;
          action_params: Json | null;
          action_type: string;
          agent_id: string;
          created_at: string | null;
          execution_id: string;
          expires_at: string | null;
          id: string;
          resolution_note: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          risk_explanation: string | null;
          risk_level: string | null;
          site_id: string;
          status: string;
        };
        Insert: {
          action_description: string;
          action_params?: Json | null;
          action_type: string;
          agent_id: string;
          created_at?: string | null;
          execution_id: string;
          expires_at?: string | null;
          id?: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          risk_explanation?: string | null;
          risk_level?: string | null;
          site_id: string;
          status?: string;
        };
        Update: {
          action_description?: string;
          action_params?: Json | null;
          action_type?: string;
          agent_id?: string;
          created_at?: string | null;
          execution_id?: string;
          expires_at?: string | null;
          id?: string;
          resolution_note?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          risk_explanation?: string | null;
          risk_level?: string | null;
          site_id?: string;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_approvals_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_approvals_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "ai_agent_executions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_approvals_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_conversations: {
        Row: {
          agent_id: string;
          context_id: string | null;
          context_type: string;
          expires_at: string | null;
          id: string;
          last_message_at: string | null;
          message_count: number | null;
          messages: Json | null;
          metadata: Json | null;
          site_id: string;
          started_at: string | null;
          tokens_used: number | null;
        };
        Insert: {
          agent_id: string;
          context_id?: string | null;
          context_type: string;
          expires_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          message_count?: number | null;
          messages?: Json | null;
          metadata?: Json | null;
          site_id: string;
          started_at?: string | null;
          tokens_used?: number | null;
        };
        Update: {
          agent_id?: string;
          context_id?: string | null;
          context_type?: string;
          expires_at?: string | null;
          id?: string;
          last_message_at?: string | null;
          message_count?: number | null;
          messages?: Json | null;
          metadata?: Json | null;
          site_id?: string;
          started_at?: string | null;
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_conversations_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_conversations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_episodes: {
        Row: {
          actions_taken: Json | null;
          agent_id: string;
          context_summary: string | null;
          created_at: string | null;
          duration_ms: number | null;
          execution_id: string | null;
          id: string;
          lessons_learned: string[] | null;
          outcome: string | null;
          outcome_details: string | null;
          should_repeat: boolean | null;
          site_id: string;
          tokens_used: number | null;
          trigger_event: string | null;
        };
        Insert: {
          actions_taken?: Json | null;
          agent_id: string;
          context_summary?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          execution_id?: string | null;
          id?: string;
          lessons_learned?: string[] | null;
          outcome?: string | null;
          outcome_details?: string | null;
          should_repeat?: boolean | null;
          site_id: string;
          tokens_used?: number | null;
          trigger_event?: string | null;
        };
        Update: {
          actions_taken?: Json | null;
          agent_id?: string;
          context_summary?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          execution_id?: string | null;
          id?: string;
          lessons_learned?: string[] | null;
          outcome?: string | null;
          outcome_details?: string | null;
          should_repeat?: boolean | null;
          site_id?: string;
          tokens_used?: number | null;
          trigger_event?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_episodes_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_episodes_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_execution_steps: {
        Row: {
          completed_at: string | null;
          duration_ms: number | null;
          execution_id: string;
          id: string;
          input_text: string | null;
          output_text: string | null;
          reasoning: string | null;
          started_at: string | null;
          step_number: number;
          step_type: string;
          tokens_used: number | null;
          tool_input: Json | null;
          tool_name: string | null;
          tool_output: Json | null;
        };
        Insert: {
          completed_at?: string | null;
          duration_ms?: number | null;
          execution_id: string;
          id?: string;
          input_text?: string | null;
          output_text?: string | null;
          reasoning?: string | null;
          started_at?: string | null;
          step_number: number;
          step_type: string;
          tokens_used?: number | null;
          tool_input?: Json | null;
          tool_name?: string | null;
          tool_output?: Json | null;
        };
        Update: {
          completed_at?: string | null;
          duration_ms?: number | null;
          execution_id?: string;
          id?: string;
          input_text?: string | null;
          output_text?: string | null;
          reasoning?: string | null;
          started_at?: string | null;
          step_number?: number;
          step_type?: string;
          tokens_used?: number | null;
          tool_input?: Json | null;
          tool_name?: string | null;
          tool_output?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_execution_steps_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "ai_agent_executions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_executions: {
        Row: {
          actions_taken: Json | null;
          agent_id: string;
          completed_at: string | null;
          created_at: string | null;
          current_context: Json | null;
          current_step: number | null;
          duration_ms: number | null;
          error: string | null;
          error_details: Json | null;
          id: string;
          initial_context: Json | null;
          llm_calls: number | null;
          result: Json | null;
          retry_count: number | null;
          site_id: string;
          started_at: string | null;
          status: string;
          steps: Json | null;
          tokens_input: number | null;
          tokens_output: number | null;
          tokens_total: number | null;
          tool_calls: number | null;
          trigger_data: Json | null;
          trigger_event_id: string | null;
          trigger_type: string;
        };
        Insert: {
          actions_taken?: Json | null;
          agent_id: string;
          completed_at?: string | null;
          created_at?: string | null;
          current_context?: Json | null;
          current_step?: number | null;
          duration_ms?: number | null;
          error?: string | null;
          error_details?: Json | null;
          id?: string;
          initial_context?: Json | null;
          llm_calls?: number | null;
          result?: Json | null;
          retry_count?: number | null;
          site_id: string;
          started_at?: string | null;
          status?: string;
          steps?: Json | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          tokens_total?: number | null;
          tool_calls?: number | null;
          trigger_data?: Json | null;
          trigger_event_id?: string | null;
          trigger_type: string;
        };
        Update: {
          actions_taken?: Json | null;
          agent_id?: string;
          completed_at?: string | null;
          created_at?: string | null;
          current_context?: Json | null;
          current_step?: number | null;
          duration_ms?: number | null;
          error?: string | null;
          error_details?: Json | null;
          id?: string;
          initial_context?: Json | null;
          llm_calls?: number | null;
          result?: Json | null;
          retry_count?: number | null;
          site_id?: string;
          started_at?: string | null;
          status?: string;
          steps?: Json | null;
          tokens_input?: number | null;
          tokens_output?: number | null;
          tokens_total?: number | null;
          tool_calls?: number | null;
          trigger_data?: Json | null;
          trigger_event_id?: string | null;
          trigger_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_executions_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_executions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_goals: {
        Row: {
          achieved_at: string | null;
          agent_id: string;
          comparison: string | null;
          created_at: string | null;
          current_value: number | null;
          deadline: string | null;
          description: string | null;
          id: string;
          is_achieved: boolean | null;
          is_recurring: boolean | null;
          name: string;
          priority: number | null;
          success_metric: string | null;
          target_value: number | null;
        };
        Insert: {
          achieved_at?: string | null;
          agent_id: string;
          comparison?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          is_achieved?: boolean | null;
          is_recurring?: boolean | null;
          name: string;
          priority?: number | null;
          success_metric?: string | null;
          target_value?: number | null;
        };
        Update: {
          achieved_at?: string | null;
          agent_id?: string;
          comparison?: string | null;
          created_at?: string | null;
          current_value?: number | null;
          deadline?: string | null;
          description?: string | null;
          id?: string;
          is_achieved?: boolean | null;
          is_recurring?: boolean | null;
          name?: string;
          priority?: number | null;
          success_metric?: string | null;
          target_value?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_goals_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_memories: {
        Row: {
          access_count: number | null;
          agent_id: string;
          confidence: number | null;
          content: string;
          created_at: string | null;
          embedding: string | null;
          expires_at: string | null;
          id: string;
          importance: number | null;
          last_accessed_at: string | null;
          memory_type: string;
          site_id: string;
          source: string | null;
          subject_id: string | null;
          subject_type: string | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          access_count?: number | null;
          agent_id: string;
          confidence?: number | null;
          content: string;
          created_at?: string | null;
          embedding?: string | null;
          expires_at?: string | null;
          id?: string;
          importance?: number | null;
          last_accessed_at?: string | null;
          memory_type: string;
          site_id: string;
          source?: string | null;
          subject_id?: string | null;
          subject_type?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          access_count?: number | null;
          agent_id?: string;
          confidence?: number | null;
          content?: string;
          created_at?: string | null;
          embedding?: string | null;
          expires_at?: string | null;
          id?: string;
          importance?: number | null;
          last_accessed_at?: string | null;
          memory_type?: string;
          site_id?: string;
          source?: string | null;
          subject_id?: string | null;
          subject_type?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_memories_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_memories_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_tool_calls: {
        Row: {
          agent_id: string;
          completed_at: string | null;
          duration_ms: number | null;
          error_message: string | null;
          execution_id: string | null;
          id: string;
          input_params: Json | null;
          output_result: Json | null;
          started_at: string | null;
          status: string;
          tokens_used: number | null;
          tool_id: string;
        };
        Insert: {
          agent_id: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          execution_id?: string | null;
          id?: string;
          input_params?: Json | null;
          output_result?: Json | null;
          started_at?: string | null;
          status: string;
          tokens_used?: number | null;
          tool_id: string;
        };
        Update: {
          agent_id?: string;
          completed_at?: string | null;
          duration_ms?: number | null;
          error_message?: string | null;
          execution_id?: string | null;
          id?: string;
          input_params?: Json | null;
          output_result?: Json | null;
          started_at?: string | null;
          status?: string;
          tokens_used?: number | null;
          tool_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agent_tool_calls_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "ai_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agent_tool_calls_tool_id_fkey";
            columns: ["tool_id"];
            isOneToOne: false;
            referencedRelation: "ai_agent_tools";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_agent_tools: {
        Row: {
          category: string;
          created_at: string | null;
          description: string;
          display_name: string;
          handler_config: Json | null;
          handler_type: string;
          id: string;
          is_active: boolean | null;
          is_dangerous: boolean | null;
          is_system: boolean | null;
          name: string;
          parameters_schema: Json;
          rate_limit_per_hour: number | null;
          rate_limit_per_minute: number | null;
          requires_modules: string[] | null;
          requires_permissions: string[] | null;
          returns_schema: Json | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description: string;
          display_name: string;
          handler_config?: Json | null;
          handler_type: string;
          id?: string;
          is_active?: boolean | null;
          is_dangerous?: boolean | null;
          is_system?: boolean | null;
          name: string;
          parameters_schema: Json;
          rate_limit_per_hour?: number | null;
          rate_limit_per_minute?: number | null;
          requires_modules?: string[] | null;
          requires_permissions?: string[] | null;
          returns_schema?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string;
          display_name?: string;
          handler_config?: Json | null;
          handler_type?: string;
          id?: string;
          is_active?: boolean | null;
          is_dangerous?: boolean | null;
          is_system?: boolean | null;
          name?: string;
          parameters_schema?: Json;
          rate_limit_per_hour?: number | null;
          rate_limit_per_minute?: number | null;
          requires_modules?: string[] | null;
          requires_permissions?: string[] | null;
          returns_schema?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      ai_agents: {
        Row: {
          agency_id: string | null;
          agent_type: string;
          allowed_tools: string[] | null;
          avatar_url: string | null;
          avg_response_time_ms: number | null;
          capabilities: string[] | null;
          constraints: Json | null;
          created_at: string | null;
          created_by: string | null;
          denied_tools: string[] | null;
          description: string | null;
          domain: string | null;
          examples: Json | null;
          failed_runs: number | null;
          goals: Json | null;
          id: string;
          is_active: boolean | null;
          is_public: boolean | null;
          last_error: string | null;
          last_run_at: string | null;
          llm_model: string | null;
          llm_provider: string | null;
          max_runs_per_day: number | null;
          max_runs_per_hour: number | null;
          max_steps_per_run: number | null;
          max_tokens: number | null;
          max_tool_calls_per_step: number | null;
          name: string;
          personality: string | null;
          site_id: string;
          slug: string;
          successful_runs: number | null;
          system_prompt: string;
          temperature: number | null;
          timeout_seconds: number | null;
          total_actions_taken: number | null;
          total_runs: number | null;
          total_tokens_used: number | null;
          trigger_conditions: Json | null;
          trigger_events: string[] | null;
          trigger_schedule: string | null;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          agency_id?: string | null;
          agent_type: string;
          allowed_tools?: string[] | null;
          avatar_url?: string | null;
          avg_response_time_ms?: number | null;
          capabilities?: string[] | null;
          constraints?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          denied_tools?: string[] | null;
          description?: string | null;
          domain?: string | null;
          examples?: Json | null;
          failed_runs?: number | null;
          goals?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_public?: boolean | null;
          last_error?: string | null;
          last_run_at?: string | null;
          llm_model?: string | null;
          llm_provider?: string | null;
          max_runs_per_day?: number | null;
          max_runs_per_hour?: number | null;
          max_steps_per_run?: number | null;
          max_tokens?: number | null;
          max_tool_calls_per_step?: number | null;
          name: string;
          personality?: string | null;
          site_id: string;
          slug: string;
          successful_runs?: number | null;
          system_prompt: string;
          temperature?: number | null;
          timeout_seconds?: number | null;
          total_actions_taken?: number | null;
          total_runs?: number | null;
          total_tokens_used?: number | null;
          trigger_conditions?: Json | null;
          trigger_events?: string[] | null;
          trigger_schedule?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          agency_id?: string | null;
          agent_type?: string;
          allowed_tools?: string[] | null;
          avatar_url?: string | null;
          avg_response_time_ms?: number | null;
          capabilities?: string[] | null;
          constraints?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          denied_tools?: string[] | null;
          description?: string | null;
          domain?: string | null;
          examples?: Json | null;
          failed_runs?: number | null;
          goals?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_public?: boolean | null;
          last_error?: string | null;
          last_run_at?: string | null;
          llm_model?: string | null;
          llm_provider?: string | null;
          max_runs_per_day?: number | null;
          max_runs_per_hour?: number | null;
          max_steps_per_run?: number | null;
          max_tokens?: number | null;
          max_tool_calls_per_step?: number | null;
          name?: string;
          personality?: string | null;
          site_id?: string;
          slug?: string;
          successful_runs?: number | null;
          system_prompt?: string;
          temperature?: number | null;
          timeout_seconds?: number | null;
          total_actions_taken?: number | null;
          total_runs?: number | null;
          total_tokens_used?: number | null;
          trigger_conditions?: Json | null;
          trigger_events?: string[] | null;
          trigger_schedule?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_agents_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_agents_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_llm_providers: {
        Row: {
          api_endpoint: string | null;
          api_key_encrypted: string | null;
          available_models: Json | null;
          cost_per_1k_input_tokens: number | null;
          cost_per_1k_output_tokens: number | null;
          created_at: string | null;
          default_model: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          organization_id: string | null;
          provider_name: string;
          requests_per_minute: number | null;
          site_id: string | null;
          tokens_per_minute: number | null;
          updated_at: string | null;
        };
        Insert: {
          api_endpoint?: string | null;
          api_key_encrypted?: string | null;
          available_models?: Json | null;
          cost_per_1k_input_tokens?: number | null;
          cost_per_1k_output_tokens?: number | null;
          created_at?: string | null;
          default_model?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          organization_id?: string | null;
          provider_name: string;
          requests_per_minute?: number | null;
          site_id?: string | null;
          tokens_per_minute?: number | null;
          updated_at?: string | null;
        };
        Update: {
          api_endpoint?: string | null;
          api_key_encrypted?: string | null;
          available_models?: Json | null;
          cost_per_1k_input_tokens?: number | null;
          cost_per_1k_output_tokens?: number | null;
          created_at?: string | null;
          default_model?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          organization_id?: string | null;
          provider_name?: string;
          requests_per_minute?: number | null;
          site_id?: string | null;
          tokens_per_minute?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_llm_providers_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_module_generated_code: {
        Row: {
          content: string;
          created_at: string | null;
          file_path: string;
          file_type: string;
          id: string;
          is_modified: boolean | null;
          session_id: string;
          spec_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          file_path: string;
          file_type: string;
          id?: string;
          is_modified?: boolean | null;
          session_id: string;
          spec_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          file_path?: string;
          file_type?: string;
          id?: string;
          is_modified?: boolean | null;
          session_id?: string;
          spec_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_module_generated_code_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "ai_module_sessions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_module_generated_code_spec_id_fkey";
            columns: ["spec_id"];
            isOneToOne: false;
            referencedRelation: "ai_module_specs";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_module_messages: {
        Row: {
          content: string;
          created_at: string | null;
          id: string;
          model: string | null;
          role: string;
          session_id: string;
          tokens_used: number | null;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          id?: string;
          model?: string | null;
          role: string;
          session_id: string;
          tokens_used?: number | null;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          id?: string;
          model?: string | null;
          role?: string;
          session_id?: string;
          tokens_used?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_module_messages_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "ai_module_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_module_sessions: {
        Row: {
          agency_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          module_id: string | null;
          name: string;
          status: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          agency_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module_id?: string | null;
          name: string;
          status?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          module_id?: string | null;
          name?: string;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ai_module_sessions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_module_sessions_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_module_specs: {
        Row: {
          approved_at: string | null;
          approved_by: string | null;
          created_at: string | null;
          id: string;
          is_approved: boolean | null;
          session_id: string;
          spec: Json;
          version: number | null;
        };
        Insert: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          session_id: string;
          spec: Json;
          version?: number | null;
        };
        Update: {
          approved_at?: string | null;
          approved_by?: string | null;
          created_at?: string | null;
          id?: string;
          is_approved?: boolean | null;
          session_id?: string;
          spec?: Json;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_module_specs_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "ai_module_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_usage_daily: {
        Row: {
          agent_runs: number | null;
          created_at: string | null;
          date: string;
          estimated_cost: number | null;
          id: string;
          runs_by_agent: Json | null;
          site_id: string;
          tokens_used: number | null;
          tool_calls: number | null;
        };
        Insert: {
          agent_runs?: number | null;
          created_at?: string | null;
          date: string;
          estimated_cost?: number | null;
          id?: string;
          runs_by_agent?: Json | null;
          site_id: string;
          tokens_used?: number | null;
          tool_calls?: number | null;
        };
        Update: {
          agent_runs?: number | null;
          created_at?: string | null;
          date?: string;
          estimated_cost?: number | null;
          id?: string;
          runs_by_agent?: Json | null;
          site_id?: string;
          tokens_used?: number | null;
          tool_calls?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_daily_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ai_usage_tracking: {
        Row: {
          agency_id: string | null;
          created_at: string | null;
          estimated_cost: number | null;
          id: string;
          included_runs: number | null;
          included_tokens: number | null;
          overage_runs: number | null;
          overage_tokens: number | null;
          period_end: string;
          period_start: string;
          site_id: string;
          total_agent_runs: number | null;
          total_approvals: number | null;
          total_tokens_input: number | null;
          total_tokens_output: number | null;
          total_tool_calls: number | null;
          updated_at: string | null;
          usage_by_provider: Json | null;
        };
        Insert: {
          agency_id?: string | null;
          created_at?: string | null;
          estimated_cost?: number | null;
          id?: string;
          included_runs?: number | null;
          included_tokens?: number | null;
          overage_runs?: number | null;
          overage_tokens?: number | null;
          period_end: string;
          period_start: string;
          site_id: string;
          total_agent_runs?: number | null;
          total_approvals?: number | null;
          total_tokens_input?: number | null;
          total_tokens_output?: number | null;
          total_tool_calls?: number | null;
          updated_at?: string | null;
          usage_by_provider?: Json | null;
        };
        Update: {
          agency_id?: string | null;
          created_at?: string | null;
          estimated_cost?: number | null;
          id?: string;
          included_runs?: number | null;
          included_tokens?: number | null;
          overage_runs?: number | null;
          overage_tokens?: number | null;
          period_end?: string;
          period_start?: string;
          site_id?: string;
          total_agent_runs?: number | null;
          total_approvals?: number | null;
          total_tokens_input?: number | null;
          total_tokens_output?: number | null;
          total_tool_calls?: number | null;
          updated_at?: string | null;
          usage_by_provider?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "ai_usage_tracking_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ai_usage_tracking_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      analytics_event_types: {
        Row: {
          category: string | null;
          created_at: string | null;
          description: string | null;
          event_name: string;
          event_type: string;
          id: string;
          is_system: boolean | null;
          properties_schema: Json | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          event_name: string;
          event_type: string;
          id?: string;
          is_system?: boolean | null;
          properties_schema?: Json | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          description?: string | null;
          event_name?: string;
          event_type?: string;
          id?: string;
          is_system?: boolean | null;
          properties_schema?: Json | null;
        };
        Relationships: [];
      };
      assets: {
        Row: {
          agency_id: string;
          alt_text: string | null;
          caption: string | null;
          created_at: string | null;
          file_name: string;
          file_type: string | null;
          folder: string | null;
          folder_id: string | null;
          height: number | null;
          id: string;
          mime_type: string;
          name: string;
          optimized_url: string | null;
          original_name: string | null;
          site_id: string | null;
          size: number;
          storage_path: string;
          tags: string[] | null;
          thumbnail_url: string | null;
          updated_at: string | null;
          uploaded_by: string | null;
          url: string;
          width: number | null;
        };
        Insert: {
          agency_id: string;
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_name: string;
          file_type?: string | null;
          folder?: string | null;
          folder_id?: string | null;
          height?: number | null;
          id?: string;
          mime_type: string;
          name: string;
          optimized_url?: string | null;
          original_name?: string | null;
          site_id?: string | null;
          size: number;
          storage_path: string;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          url: string;
          width?: number | null;
        };
        Update: {
          agency_id?: string;
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          file_name?: string;
          file_type?: string | null;
          folder?: string | null;
          folder_id?: string | null;
          height?: number | null;
          id?: string;
          mime_type?: string;
          name?: string;
          optimized_url?: string | null;
          original_name?: string | null;
          site_id?: string | null;
          size?: number;
          storage_path?: string;
          tags?: string[] | null;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          uploaded_by?: string | null;
          url?: string;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "assets_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assets_folder_id_fkey";
            columns: ["folder_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "assets_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          created_at: string;
          details: Json | null;
          id: string;
          ip_address: unknown;
          resource_id: string;
          resource_type: string;
          user_agent: string | null;
          user_email: string | null;
          user_id: string | null;
          user_name: string | null;
        };
        Insert: {
          action: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: unknown;
          resource_id: string;
          resource_type: string;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Update: {
          action?: string;
          created_at?: string;
          details?: Json | null;
          id?: string;
          ip_address?: unknown;
          resource_id?: string;
          resource_type?: string;
          user_agent?: string | null;
          user_email?: string | null;
          user_id?: string | null;
          user_name?: string | null;
        };
        Relationships: [];
      };
      automation_connections: {
        Row: {
          agency_id: string;
          config: Json | null;
          created_at: string | null;
          id: string;
          last_tested_at: string | null;
          name: string | null;
          provider: string;
          site_id: string | null;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          last_tested_at?: string | null;
          name?: string | null;
          provider: string;
          site_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          config?: Json | null;
          created_at?: string | null;
          id?: string;
          last_tested_at?: string | null;
          name?: string | null;
          provider?: string;
          site_id?: string | null;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_connections_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_connections_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_event_subscriptions: {
        Row: {
          created_at: string | null;
          event_filter: Json | null;
          event_type: string;
          events_received: number | null;
          id: string;
          is_active: boolean | null;
          is_system: boolean | null;
          last_event_at: string | null;
          site_id: string;
          source_module: string | null;
          updated_at: string | null;
          workflow_id: string;
        };
        Insert: {
          created_at?: string | null;
          event_filter?: Json | null;
          event_type: string;
          events_received?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          last_event_at?: string | null;
          site_id: string;
          source_module?: string | null;
          updated_at?: string | null;
          workflow_id: string;
        };
        Update: {
          created_at?: string | null;
          event_filter?: Json | null;
          event_type?: string;
          events_received?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          last_event_at?: string | null;
          site_id?: string;
          source_module?: string | null;
          updated_at?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_event_subscriptions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_event_subscriptions_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_events_log: {
        Row: {
          created_at: string | null;
          event_type: string;
          id: string;
          payload: Json;
          processed: boolean | null;
          processed_at: string | null;
          site_id: string;
          source_entity_id: string | null;
          source_entity_type: string | null;
          source_event_id: string | null;
          source_module: string | null;
          workflows_triggered: number | null;
        };
        Insert: {
          created_at?: string | null;
          event_type: string;
          id?: string;
          payload: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          site_id: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          source_event_id?: string | null;
          source_module?: string | null;
          workflows_triggered?: number | null;
        };
        Update: {
          created_at?: string | null;
          event_type?: string;
          id?: string;
          payload?: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          site_id?: string;
          source_entity_id?: string | null;
          source_entity_type?: string | null;
          source_event_id?: string | null;
          source_module?: string | null;
          workflows_triggered?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_events_log_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_installed_packs: {
        Row: {
          id: string;
          installed_at: string;
          installed_by: string | null;
          pack_id: string;
          site_id: string;
        };
        Insert: {
          id?: string;
          installed_at?: string;
          installed_by?: string | null;
          pack_id: string;
          site_id: string;
        };
        Update: {
          id?: string;
          installed_at?: string;
          installed_by?: string | null;
          pack_id?: string;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_installed_packs_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_scheduled_jobs: {
        Row: {
          consecutive_failures: number | null;
          created_at: string | null;
          cron_expression: string;
          id: string;
          is_active: boolean | null;
          last_run_at: string | null;
          last_status: string | null;
          max_consecutive_failures: number | null;
          next_run_at: string | null;
          site_id: string;
          timezone: string | null;
          updated_at: string | null;
          workflow_id: string;
        };
        Insert: {
          consecutive_failures?: number | null;
          created_at?: string | null;
          cron_expression: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          last_status?: string | null;
          max_consecutive_failures?: number | null;
          next_run_at?: string | null;
          site_id: string;
          timezone?: string | null;
          updated_at?: string | null;
          workflow_id: string;
        };
        Update: {
          consecutive_failures?: number | null;
          created_at?: string | null;
          cron_expression?: string;
          id?: string;
          is_active?: boolean | null;
          last_run_at?: string | null;
          last_status?: string | null;
          max_consecutive_failures?: number | null;
          next_run_at?: string | null;
          site_id?: string;
          timezone?: string | null;
          updated_at?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_scheduled_jobs_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_scheduled_jobs_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_webhook_endpoints: {
        Row: {
          allowed_ips: string[] | null;
          allowed_methods: string[] | null;
          created_at: string | null;
          endpoint_path: string;
          id: string;
          is_active: boolean | null;
          last_called_at: string | null;
          secret_key: string;
          site_id: string;
          total_calls: number | null;
          workflow_id: string;
        };
        Insert: {
          allowed_ips?: string[] | null;
          allowed_methods?: string[] | null;
          created_at?: string | null;
          endpoint_path: string;
          id?: string;
          is_active?: boolean | null;
          last_called_at?: string | null;
          secret_key: string;
          site_id: string;
          total_calls?: number | null;
          workflow_id: string;
        };
        Update: {
          allowed_ips?: string[] | null;
          allowed_methods?: string[] | null;
          created_at?: string | null;
          endpoint_path?: string;
          id?: string;
          is_active?: boolean | null;
          last_called_at?: string | null;
          secret_key?: string;
          site_id?: string;
          total_calls?: number | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "automation_webhook_endpoints_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_webhook_endpoints_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      automation_workflows: {
        Row: {
          agency_id: string | null;
          category: string | null;
          color: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          failed_runs: number | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          is_system: boolean | null;
          last_error: string | null;
          last_error_at: string | null;
          last_run_at: string | null;
          last_success_at: string | null;
          max_executions_per_hour: number | null;
          max_retries: number | null;
          name: string;
          pack_id: string | null;
          retry_on_failure: boolean | null;
          run_once: boolean | null;
          site_id: string;
          slug: string;
          successful_runs: number | null;
          system_event_type: string | null;
          tags: string[] | null;
          timeout_seconds: number | null;
          total_runs: number | null;
          trigger_config: Json;
          trigger_type: string;
          updated_at: string | null;
          updated_by: string | null;
        };
        Insert: {
          agency_id?: string | null;
          category?: string | null;
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          failed_runs?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          last_error?: string | null;
          last_error_at?: string | null;
          last_run_at?: string | null;
          last_success_at?: string | null;
          max_executions_per_hour?: number | null;
          max_retries?: number | null;
          name: string;
          pack_id?: string | null;
          retry_on_failure?: boolean | null;
          run_once?: boolean | null;
          site_id: string;
          slug: string;
          successful_runs?: number | null;
          system_event_type?: string | null;
          tags?: string[] | null;
          timeout_seconds?: number | null;
          total_runs?: number | null;
          trigger_config?: Json;
          trigger_type: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Update: {
          agency_id?: string | null;
          category?: string | null;
          color?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          failed_runs?: number | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_system?: boolean | null;
          last_error?: string | null;
          last_error_at?: string | null;
          last_run_at?: string | null;
          last_success_at?: string | null;
          max_executions_per_hour?: number | null;
          max_retries?: number | null;
          name?: string;
          pack_id?: string | null;
          retry_on_failure?: boolean | null;
          run_once?: boolean | null;
          site_id?: string;
          slug?: string;
          successful_runs?: number | null;
          system_event_type?: string | null;
          tags?: string[] | null;
          timeout_seconds?: number | null;
          total_runs?: number | null;
          trigger_config?: Json;
          trigger_type?: string;
          updated_at?: string | null;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "automation_workflows_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "automation_workflows_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      beta_enrollment: {
        Row: {
          accepted_modules: string[] | null;
          agency_id: string;
          beta_tier: string;
          enrolled_at: string | null;
          enrolled_by: string | null;
          id: string;
          is_active: boolean | null;
          preferences: Json | null;
        };
        Insert: {
          accepted_modules?: string[] | null;
          agency_id: string;
          beta_tier?: string;
          enrolled_at?: string | null;
          enrolled_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          preferences?: Json | null;
        };
        Update: {
          accepted_modules?: string[] | null;
          agency_id?: string;
          beta_tier?: string;
          enrolled_at?: string | null;
          enrolled_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          preferences?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "beta_enrollment_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: true;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_categories: {
        Row: {
          color: string | null;
          created_at: string | null;
          description: string | null;
          id: string;
          name: string;
          site_id: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name: string;
          site_id: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          name?: string;
          site_id?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blog_categories_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_post_categories: {
        Row: {
          category_id: string;
          post_id: string;
        };
        Insert: {
          category_id: string;
          post_id: string;
        };
        Update: {
          category_id?: string;
          post_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "blog_post_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "blog_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_post_categories_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "blog_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      blog_posts: {
        Row: {
          allow_comments: boolean | null;
          author_id: string | null;
          canonical_url: string | null;
          content: Json;
          content_html: string | null;
          created_at: string | null;
          excerpt: string | null;
          featured_image_alt: string | null;
          featured_image_url: string | null;
          id: string;
          is_featured: boolean | null;
          meta_description: string | null;
          meta_keywords: string[] | null;
          meta_title: string | null;
          og_image_url: string | null;
          published_at: string | null;
          reading_time_minutes: number | null;
          scheduled_for: string | null;
          site_id: string;
          slug: string;
          status: string | null;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          allow_comments?: boolean | null;
          author_id?: string | null;
          canonical_url?: string | null;
          content?: Json;
          content_html?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured_image_alt?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean | null;
          meta_description?: string | null;
          meta_keywords?: string[] | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          scheduled_for?: string | null;
          site_id: string;
          slug: string;
          status?: string | null;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          allow_comments?: boolean | null;
          author_id?: string | null;
          canonical_url?: string | null;
          content?: Json;
          content_html?: string | null;
          created_at?: string | null;
          excerpt?: string | null;
          featured_image_alt?: string | null;
          featured_image_url?: string | null;
          id?: string;
          is_featured?: boolean | null;
          meta_description?: string | null;
          meta_keywords?: string[] | null;
          meta_title?: string | null;
          og_image_url?: string | null;
          published_at?: string | null;
          reading_time_minutes?: number | null;
          scheduled_for?: string | null;
          site_id?: string;
          slug?: string;
          status?: string | null;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "blog_posts_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "blog_posts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      client_module_installations: {
        Row: {
          agency_subscription_id: string | null;
          billing_cycle: string | null;
          billing_status: string | null;
          client_id: string;
          current_period_end: string | null;
          current_period_start: string | null;
          enabled_at: string | null;
          id: string;
          installed_at: string | null;
          installed_by: string | null;
          is_enabled: boolean | null;
          lemon_subscription_id: string | null;
          module_id: string;
          price_paid: number | null;
          settings: Json | null;
          stripe_subscription_id: string | null;
        };
        Insert: {
          agency_subscription_id?: string | null;
          billing_cycle?: string | null;
          billing_status?: string | null;
          client_id: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          enabled_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          is_enabled?: boolean | null;
          lemon_subscription_id?: string | null;
          module_id: string;
          price_paid?: number | null;
          settings?: Json | null;
          stripe_subscription_id?: string | null;
        };
        Update: {
          agency_subscription_id?: string | null;
          billing_cycle?: string | null;
          billing_status?: string | null;
          client_id?: string;
          current_period_end?: string | null;
          current_period_start?: string | null;
          enabled_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          is_enabled?: boolean | null;
          lemon_subscription_id?: string | null;
          module_id?: string;
          price_paid?: number | null;
          settings?: Json | null;
          stripe_subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_module_installations_agency_subscription_id_fkey";
            columns: ["agency_subscription_id"];
            isOneToOne: false;
            referencedRelation: "agency_module_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_module_installations_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_module_installations_installed_by_fkey";
            columns: ["installed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_module_installations_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      client_module_permissions: {
        Row: {
          client_id: string;
          created_at: string | null;
          granted: boolean | null;
          id: string;
          module_slug: string;
          permission_key: string;
          site_id: string | null;
        };
        Insert: {
          client_id: string;
          created_at?: string | null;
          granted?: boolean | null;
          id?: string;
          module_slug: string;
          permission_key: string;
          site_id?: string | null;
        };
        Update: {
          client_id?: string;
          created_at?: string | null;
          granted?: boolean | null;
          id?: string;
          module_slug?: string;
          permission_key?: string;
          site_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "client_module_permissions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_module_permissions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      client_notifications: {
        Row: {
          client_id: string;
          created_at: string | null;
          id: string;
          is_read: boolean | null;
          link: string | null;
          message: string;
          metadata: Json | null;
          read_at: string | null;
          title: string;
          type: string;
        };
        Insert: {
          client_id: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          message: string;
          metadata?: Json | null;
          read_at?: string | null;
          title: string;
          type: string;
        };
        Update: {
          client_id?: string;
          created_at?: string | null;
          id?: string;
          is_read?: boolean | null;
          link?: string | null;
          message?: string;
          metadata?: Json | null;
          read_at?: string | null;
          title?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_notifications_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      client_site_permissions: {
        Row: {
          can_edit_content: boolean | null;
          can_manage_agents: boolean | null;
          can_manage_automation: boolean | null;
          can_manage_bookings: boolean | null;
          can_manage_crm: boolean | null;
          can_manage_customers: boolean | null;
          can_manage_live_chat: boolean | null;
          can_manage_marketing: boolean | null;
          can_manage_orders: boolean | null;
          can_manage_products: boolean | null;
          can_manage_quotes: boolean | null;
          can_publish: boolean | null;
          can_view: boolean | null;
          can_view_analytics: boolean | null;
          client_id: string;
          created_at: string | null;
          id: string;
          site_id: string;
        };
        Insert: {
          can_edit_content?: boolean | null;
          can_manage_agents?: boolean | null;
          can_manage_automation?: boolean | null;
          can_manage_bookings?: boolean | null;
          can_manage_crm?: boolean | null;
          can_manage_customers?: boolean | null;
          can_manage_live_chat?: boolean | null;
          can_manage_marketing?: boolean | null;
          can_manage_orders?: boolean | null;
          can_manage_products?: boolean | null;
          can_manage_quotes?: boolean | null;
          can_publish?: boolean | null;
          can_view?: boolean | null;
          can_view_analytics?: boolean | null;
          client_id: string;
          created_at?: string | null;
          id?: string;
          site_id: string;
        };
        Update: {
          can_edit_content?: boolean | null;
          can_manage_agents?: boolean | null;
          can_manage_automation?: boolean | null;
          can_manage_bookings?: boolean | null;
          can_manage_crm?: boolean | null;
          can_manage_customers?: boolean | null;
          can_manage_live_chat?: boolean | null;
          can_manage_marketing?: boolean | null;
          can_manage_orders?: boolean | null;
          can_manage_products?: boolean | null;
          can_manage_quotes?: boolean | null;
          can_publish?: boolean | null;
          can_view?: boolean | null;
          can_view_analytics?: boolean | null;
          client_id?: string;
          created_at?: string | null;
          id?: string;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "client_site_permissions_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "client_site_permissions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      clients: {
        Row: {
          agency_id: string;
          can_edit_content: boolean | null;
          can_manage_agents: boolean | null;
          can_manage_automation: boolean | null;
          can_manage_bookings: boolean | null;
          can_manage_crm: boolean | null;
          can_manage_customers: boolean | null;
          can_manage_live_chat: boolean | null;
          can_manage_marketing: boolean | null;
          can_manage_orders: boolean | null;
          can_manage_products: boolean | null;
          can_manage_quotes: boolean | null;
          can_view_analytics: boolean | null;
          can_view_invoices: boolean | null;
          company: string | null;
          created_at: string | null;
          email: string | null;
          has_portal_access: boolean | null;
          id: string;
          industry: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          portal_last_login: string | null;
          portal_user_id: string | null;
          seat_activated_at: string | null;
          seat_paused_at: string | null;
          status: string;
          stripe_subscription_item_id: string | null;
          tags: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          can_edit_content?: boolean | null;
          can_manage_agents?: boolean | null;
          can_manage_automation?: boolean | null;
          can_manage_bookings?: boolean | null;
          can_manage_crm?: boolean | null;
          can_manage_customers?: boolean | null;
          can_manage_live_chat?: boolean | null;
          can_manage_marketing?: boolean | null;
          can_manage_orders?: boolean | null;
          can_manage_products?: boolean | null;
          can_manage_quotes?: boolean | null;
          can_view_analytics?: boolean | null;
          can_view_invoices?: boolean | null;
          company?: string | null;
          created_at?: string | null;
          email?: string | null;
          has_portal_access?: boolean | null;
          id?: string;
          industry?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          portal_last_login?: string | null;
          portal_user_id?: string | null;
          seat_activated_at?: string | null;
          seat_paused_at?: string | null;
          status?: string;
          stripe_subscription_item_id?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          can_edit_content?: boolean | null;
          can_manage_agents?: boolean | null;
          can_manage_automation?: boolean | null;
          can_manage_bookings?: boolean | null;
          can_manage_crm?: boolean | null;
          can_manage_customers?: boolean | null;
          can_manage_live_chat?: boolean | null;
          can_manage_marketing?: boolean | null;
          can_manage_orders?: boolean | null;
          can_manage_products?: boolean | null;
          can_manage_quotes?: boolean | null;
          can_view_analytics?: boolean | null;
          can_view_invoices?: boolean | null;
          company?: string | null;
          created_at?: string | null;
          email?: string | null;
          has_portal_access?: boolean | null;
          id?: string;
          industry?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          portal_last_login?: string | null;
          portal_user_id?: string | null;
          seat_activated_at?: string | null;
          seat_paused_at?: string | null;
          status?: string;
          stripe_subscription_item_id?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "clients_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      cloudflare_zones: {
        Row: {
          account_id: string | null;
          activated_at: string | null;
          always_https: boolean | null;
          assigned_nameservers: string[] | null;
          created_at: string;
          domain_id: string;
          id: string;
          metadata: Json | null;
          min_tls_version: string | null;
          name: string;
          original_nameservers: string[] | null;
          plan: string | null;
          ssl_mode: string | null;
          status: string | null;
          zone_id: string;
        };
        Insert: {
          account_id?: string | null;
          activated_at?: string | null;
          always_https?: boolean | null;
          assigned_nameservers?: string[] | null;
          created_at?: string;
          domain_id: string;
          id?: string;
          metadata?: Json | null;
          min_tls_version?: string | null;
          name: string;
          original_nameservers?: string[] | null;
          plan?: string | null;
          ssl_mode?: string | null;
          status?: string | null;
          zone_id: string;
        };
        Update: {
          account_id?: string | null;
          activated_at?: string | null;
          always_https?: boolean | null;
          assigned_nameservers?: string[] | null;
          created_at?: string;
          domain_id?: string;
          id?: string;
          metadata?: Json | null;
          min_tls_version?: string | null;
          name?: string;
          original_nameservers?: string[] | null;
          plan?: string | null;
          ssl_mode?: string | null;
          status?: string | null;
          zone_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "cloudflare_zones_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      developer_profiles: {
        Row: {
          accepts_custom_requests: boolean | null;
          agency_id: string | null;
          avatar_url: string | null;
          avg_rating: number | null;
          bio: string | null;
          cover_image_url: string | null;
          created_at: string | null;
          custom_request_rate: number | null;
          display_name: string;
          github_url: string | null;
          id: string;
          is_verified: boolean | null;
          linkedin_url: string | null;
          slug: string;
          total_downloads: number | null;
          total_modules: number | null;
          total_revenue: number | null;
          total_reviews: number | null;
          twitter_url: string | null;
          updated_at: string | null;
          user_id: string;
          verification_type: string | null;
          verified_at: string | null;
          website_url: string | null;
        };
        Insert: {
          accepts_custom_requests?: boolean | null;
          agency_id?: string | null;
          avatar_url?: string | null;
          avg_rating?: number | null;
          bio?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          custom_request_rate?: number | null;
          display_name: string;
          github_url?: string | null;
          id?: string;
          is_verified?: boolean | null;
          linkedin_url?: string | null;
          slug: string;
          total_downloads?: number | null;
          total_modules?: number | null;
          total_revenue?: number | null;
          total_reviews?: number | null;
          twitter_url?: string | null;
          updated_at?: string | null;
          user_id: string;
          verification_type?: string | null;
          verified_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          accepts_custom_requests?: boolean | null;
          agency_id?: string | null;
          avatar_url?: string | null;
          avg_rating?: number | null;
          bio?: string | null;
          cover_image_url?: string | null;
          created_at?: string | null;
          custom_request_rate?: number | null;
          display_name?: string;
          github_url?: string | null;
          id?: string;
          is_verified?: boolean | null;
          linkedin_url?: string | null;
          slug?: string;
          total_downloads?: number | null;
          total_modules?: number | null;
          total_revenue?: number | null;
          total_reviews?: number | null;
          twitter_url?: string | null;
          updated_at?: string | null;
          user_id?: string;
          verification_type?: string | null;
          verified_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "developer_profiles_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_billing_records: {
        Row: {
          agency_id: string;
          billing_type: string;
          created_at: string | null;
          currency: string | null;
          description: string;
          domain_id: string | null;
          id: string;
          markup_amount: number;
          metadata: Json | null;
          paddle_subscription_id: string | null;
          paddle_transaction_id: string | null;
          paid_at: string | null;
          retail_amount: number;
          status: string | null;
          updated_at: string | null;
          wholesale_amount: number;
        };
        Insert: {
          agency_id: string;
          billing_type: string;
          created_at?: string | null;
          currency?: string | null;
          description: string;
          domain_id?: string | null;
          id?: string;
          markup_amount: number;
          metadata?: Json | null;
          paddle_subscription_id?: string | null;
          paddle_transaction_id?: string | null;
          paid_at?: string | null;
          retail_amount: number;
          status?: string | null;
          updated_at?: string | null;
          wholesale_amount: number;
        };
        Update: {
          agency_id?: string;
          billing_type?: string;
          created_at?: string | null;
          currency?: string | null;
          description?: string;
          domain_id?: string | null;
          id?: string;
          markup_amount?: number;
          metadata?: Json | null;
          paddle_subscription_id?: string | null;
          paddle_transaction_id?: string | null;
          paid_at?: string | null;
          retail_amount?: number;
          status?: string | null;
          updated_at?: string | null;
          wholesale_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "domain_billing_records_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domain_billing_records_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_contacts: {
        Row: {
          address_line_1: string;
          address_line_2: string | null;
          address_line_3: string | null;
          agency_id: string;
          city: string;
          company: string | null;
          contact_type: string | null;
          country: string;
          created_at: string;
          email: string;
          fax: string | null;
          fax_country_code: string | null;
          id: string;
          is_default: boolean | null;
          name: string;
          phone: string;
          phone_country_code: string;
          resellerclub_contact_id: string;
          resellerclub_customer_id: string | null;
          state: string;
          updated_at: string;
          zipcode: string;
        };
        Insert: {
          address_line_1: string;
          address_line_2?: string | null;
          address_line_3?: string | null;
          agency_id: string;
          city: string;
          company?: string | null;
          contact_type?: string | null;
          country: string;
          created_at?: string;
          email: string;
          fax?: string | null;
          fax_country_code?: string | null;
          id?: string;
          is_default?: boolean | null;
          name: string;
          phone: string;
          phone_country_code: string;
          resellerclub_contact_id: string;
          resellerclub_customer_id?: string | null;
          state: string;
          updated_at?: string;
          zipcode: string;
        };
        Update: {
          address_line_1?: string;
          address_line_2?: string | null;
          address_line_3?: string | null;
          agency_id?: string;
          city?: string;
          company?: string | null;
          contact_type?: string | null;
          country?: string;
          created_at?: string;
          email?: string;
          fax?: string | null;
          fax_country_code?: string | null;
          id?: string;
          is_default?: boolean | null;
          name?: string;
          phone?: string;
          phone_country_code?: string;
          resellerclub_contact_id?: string;
          resellerclub_customer_id?: string | null;
          state?: string;
          updated_at?: string;
          zipcode?: string;
        };
        Relationships: [
          {
            foreignKeyName: "domain_contacts_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_dns_records: {
        Row: {
          created_at: string | null;
          domain_id: string;
          host: string;
          id: string;
          is_verified: boolean | null;
          last_checked_at: string | null;
          record_type: string;
          value: string;
        };
        Insert: {
          created_at?: string | null;
          domain_id: string;
          host: string;
          id?: string;
          is_verified?: boolean | null;
          last_checked_at?: string | null;
          record_type: string;
          value: string;
        };
        Update: {
          created_at?: string | null;
          domain_id?: string;
          host?: string;
          id?: string;
          is_verified?: boolean | null;
          last_checked_at?: string | null;
          record_type?: string;
          value?: string;
        };
        Relationships: [
          {
            foreignKeyName: "domain_dns_records_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "module_custom_domains";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_email_accounts: {
        Row: {
          account_type: string | null;
          agency_id: string;
          created_at: string;
          display_name: string | null;
          domain_id: string;
          email_address: string;
          forward_to: string[] | null;
          id: string;
          mailbox_size_gb: number | null;
          monthly_price: number | null;
          next_billing_date: string | null;
          resellerclub_email_account_id: string | null;
          resellerclub_email_order_id: string | null;
          resellerclub_email_subscription_id: string | null;
          status: string | null;
          storage_used_mb: number | null;
          updated_at: string;
        };
        Insert: {
          account_type?: string | null;
          agency_id: string;
          created_at?: string;
          display_name?: string | null;
          domain_id: string;
          email_address: string;
          forward_to?: string[] | null;
          id?: string;
          mailbox_size_gb?: number | null;
          monthly_price?: number | null;
          next_billing_date?: string | null;
          resellerclub_email_account_id?: string | null;
          resellerclub_email_order_id?: string | null;
          resellerclub_email_subscription_id?: string | null;
          status?: string | null;
          storage_used_mb?: number | null;
          updated_at?: string;
        };
        Update: {
          account_type?: string | null;
          agency_id?: string;
          created_at?: string;
          display_name?: string | null;
          domain_id?: string;
          email_address?: string;
          forward_to?: string[] | null;
          id?: string;
          mailbox_size_gb?: number | null;
          monthly_price?: number | null;
          next_billing_date?: string | null;
          resellerclub_email_account_id?: string | null;
          resellerclub_email_order_id?: string | null;
          resellerclub_email_subscription_id?: string | null;
          status?: string | null;
          storage_used_mb?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "domain_email_accounts_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domain_email_accounts_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_orders: {
        Row: {
          agency_id: string;
          completed_at: string | null;
          created_at: string;
          currency: string | null;
          domain_id: string | null;
          domain_name: string;
          error_message: string | null;
          id: string;
          idempotency_key: string | null;
          metadata: Json | null;
          order_type: string;
          paddle_transaction_id: string | null;
          payment_method: string | null;
          payment_status: string | null;
          pending_purchase_id: string | null;
          platform_fee: number | null;
          resellerclub_invoice_id: string | null;
          resellerclub_order_id: string | null;
          retail_price: number;
          status: string | null;
          wholesale_price: number;
          years: number | null;
        };
        Insert: {
          agency_id: string;
          completed_at?: string | null;
          created_at?: string;
          currency?: string | null;
          domain_id?: string | null;
          domain_name: string;
          error_message?: string | null;
          id?: string;
          idempotency_key?: string | null;
          metadata?: Json | null;
          order_type: string;
          paddle_transaction_id?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          pending_purchase_id?: string | null;
          platform_fee?: number | null;
          resellerclub_invoice_id?: string | null;
          resellerclub_order_id?: string | null;
          retail_price: number;
          status?: string | null;
          wholesale_price: number;
          years?: number | null;
        };
        Update: {
          agency_id?: string;
          completed_at?: string | null;
          created_at?: string;
          currency?: string | null;
          domain_id?: string | null;
          domain_name?: string;
          error_message?: string | null;
          id?: string;
          idempotency_key?: string | null;
          metadata?: Json | null;
          order_type?: string;
          paddle_transaction_id?: string | null;
          payment_method?: string | null;
          payment_status?: string | null;
          pending_purchase_id?: string | null;
          platform_fee?: number | null;
          resellerclub_invoice_id?: string | null;
          resellerclub_order_id?: string | null;
          retail_price?: number;
          status?: string | null;
          wholesale_price?: number;
          years?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "domain_orders_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domain_orders_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domain_orders_pending_purchase_id_fkey";
            columns: ["pending_purchase_id"];
            isOneToOne: false;
            referencedRelation: "pending_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_pricing: {
        Row: {
          agency_id: string;
          created_at: string;
          email_markup_type: string | null;
          email_markup_value: number | null;
          enabled: boolean | null;
          id: string;
          markup_type: string;
          markup_value: number;
          max_markup: number | null;
          min_markup: number | null;
          show_wholesale_to_clients: boolean | null;
          tld: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          created_at?: string;
          email_markup_type?: string | null;
          email_markup_value?: number | null;
          enabled?: boolean | null;
          id?: string;
          markup_type?: string;
          markup_value?: number;
          max_markup?: number | null;
          min_markup?: number | null;
          show_wholesale_to_clients?: boolean | null;
          tld?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          created_at?: string;
          email_markup_type?: string | null;
          email_markup_value?: number | null;
          enabled?: boolean | null;
          id?: string;
          markup_type?: string;
          markup_value?: number;
          max_markup?: number | null;
          min_markup?: number | null;
          show_wholesale_to_clients?: boolean | null;
          tld?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "domain_pricing_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_pricing_cache: {
        Row: {
          created_at: string;
          currency: string;
          id: string;
          last_refreshed_at: string;
          pricing_type: string;
          privacy_1yr: number | null;
          register_10yr: number | null;
          register_1yr: number;
          register_2yr: number | null;
          register_3yr: number | null;
          register_5yr: number | null;
          renew_10yr: number | null;
          renew_1yr: number;
          renew_2yr: number | null;
          renew_3yr: number | null;
          renew_5yr: number | null;
          restore_price: number | null;
          source_api_endpoint: string | null;
          tld: string;
          transfer_price: number;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          currency?: string;
          id?: string;
          last_refreshed_at?: string;
          pricing_type: string;
          privacy_1yr?: number | null;
          register_10yr?: number | null;
          register_1yr: number;
          register_2yr?: number | null;
          register_3yr?: number | null;
          register_5yr?: number | null;
          renew_10yr?: number | null;
          renew_1yr: number;
          renew_2yr?: number | null;
          renew_3yr?: number | null;
          renew_5yr?: number | null;
          restore_price?: number | null;
          source_api_endpoint?: string | null;
          tld: string;
          transfer_price: number;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          currency?: string;
          id?: string;
          last_refreshed_at?: string;
          pricing_type?: string;
          privacy_1yr?: number | null;
          register_10yr?: number | null;
          register_1yr?: number;
          register_2yr?: number | null;
          register_3yr?: number | null;
          register_5yr?: number | null;
          renew_10yr?: number | null;
          renew_1yr?: number;
          renew_2yr?: number | null;
          renew_3yr?: number | null;
          renew_5yr?: number | null;
          restore_price?: number | null;
          source_api_endpoint?: string | null;
          tld?: string;
          transfer_price?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      domain_redirects: {
        Row: {
          active: boolean | null;
          created_at: string | null;
          from_domain: string;
          hit_count: number | null;
          id: string;
          last_hit_at: string | null;
          preserve_path: boolean | null;
          redirect_type: string | null;
          site_id: string | null;
          to_domain: string;
        };
        Insert: {
          active?: boolean | null;
          created_at?: string | null;
          from_domain: string;
          hit_count?: number | null;
          id?: string;
          last_hit_at?: string | null;
          preserve_path?: boolean | null;
          redirect_type?: string | null;
          site_id?: string | null;
          to_domain: string;
        };
        Update: {
          active?: boolean | null;
          created_at?: string | null;
          from_domain?: string;
          hit_count?: number | null;
          id?: string;
          last_hit_at?: string | null;
          preserve_path?: boolean | null;
          redirect_type?: string | null;
          site_id?: string | null;
          to_domain?: string;
        };
        Relationships: [
          {
            foreignKeyName: "domain_redirects_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_request_logs: {
        Row: {
          bytes_sent: number | null;
          country_code: string | null;
          created_at: string | null;
          domain_id: string;
          id: string;
          ip_address: unknown;
          method: string | null;
          path: string | null;
          response_time_ms: number | null;
          status_code: number | null;
          user_agent: string | null;
        };
        Insert: {
          bytes_sent?: number | null;
          country_code?: string | null;
          created_at?: string | null;
          domain_id: string;
          id?: string;
          ip_address?: unknown;
          method?: string | null;
          path?: string | null;
          response_time_ms?: number | null;
          status_code?: number | null;
          user_agent?: string | null;
        };
        Update: {
          bytes_sent?: number | null;
          country_code?: string | null;
          created_at?: string | null;
          domain_id?: string;
          id?: string;
          ip_address?: unknown;
          method?: string | null;
          path?: string | null;
          response_time_ms?: number | null;
          status_code?: number | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "domain_request_logs_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "module_custom_domains";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_ssl_certificates: {
        Row: {
          created_at: string | null;
          domain_id: string;
          expires_at: string | null;
          id: string;
          issued_at: string | null;
          issuer: string | null;
          revoked_at: string | null;
          san: string[] | null;
          serial_number: string | null;
          status: string | null;
          subject: string | null;
        };
        Insert: {
          created_at?: string | null;
          domain_id: string;
          expires_at?: string | null;
          id?: string;
          issued_at?: string | null;
          issuer?: string | null;
          revoked_at?: string | null;
          san?: string[] | null;
          serial_number?: string | null;
          status?: string | null;
          subject?: string | null;
        };
        Update: {
          created_at?: string | null;
          domain_id?: string;
          expires_at?: string | null;
          id?: string;
          issued_at?: string | null;
          issuer?: string | null;
          revoked_at?: string | null;
          san?: string[] | null;
          serial_number?: string | null;
          status?: string | null;
          subject?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "domain_ssl_certificates_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "module_custom_domains";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_transfers: {
        Row: {
          agency_id: string;
          approved_at: string | null;
          auth_code_hash: string | null;
          completed_at: string | null;
          direction: string;
          domain_id: string | null;
          domain_name: string;
          error_message: string | null;
          expires_at: string | null;
          id: string;
          initiated_at: string | null;
          metadata: Json | null;
          notes: string | null;
          resellerclub_transfer_id: string | null;
          retail_price: number | null;
          retry_count: number | null;
          status: string | null;
          wholesale_price: number | null;
        };
        Insert: {
          agency_id: string;
          approved_at?: string | null;
          auth_code_hash?: string | null;
          completed_at?: string | null;
          direction: string;
          domain_id?: string | null;
          domain_name: string;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          initiated_at?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          resellerclub_transfer_id?: string | null;
          retail_price?: number | null;
          retry_count?: number | null;
          status?: string | null;
          wholesale_price?: number | null;
        };
        Update: {
          agency_id?: string;
          approved_at?: string | null;
          auth_code_hash?: string | null;
          completed_at?: string | null;
          direction?: string;
          domain_id?: string | null;
          domain_name?: string;
          error_message?: string | null;
          expires_at?: string | null;
          id?: string;
          initiated_at?: string | null;
          metadata?: Json | null;
          notes?: string | null;
          resellerclub_transfer_id?: string | null;
          retail_price?: number | null;
          retry_count?: number | null;
          status?: string | null;
          wholesale_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "domain_transfers_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domain_transfers_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      domain_usage_summary: {
        Row: {
          agency_id: string;
          created_at: string | null;
          domains_registered: number | null;
          domains_renewed: number | null;
          domains_transferred: number | null;
          email_accounts_created: number | null;
          id: string;
          month: number;
          profit_total: number | null;
          retail_total: number | null;
          updated_at: string | null;
          wholesale_total: number | null;
          year: number;
        };
        Insert: {
          agency_id: string;
          created_at?: string | null;
          domains_registered?: number | null;
          domains_renewed?: number | null;
          domains_transferred?: number | null;
          email_accounts_created?: number | null;
          id?: string;
          month: number;
          profit_total?: number | null;
          retail_total?: number | null;
          updated_at?: string | null;
          wholesale_total?: number | null;
          year: number;
        };
        Update: {
          agency_id?: string;
          created_at?: string | null;
          domains_registered?: number | null;
          domains_renewed?: number | null;
          domains_transferred?: number | null;
          email_accounts_created?: number | null;
          id?: string;
          month?: number;
          profit_total?: number | null;
          retail_total?: number | null;
          updated_at?: string | null;
          wholesale_total?: number | null;
          year?: number;
        };
        Relationships: [
          {
            foreignKeyName: "domain_usage_summary_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      domains: {
        Row: {
          admin_contact_id: string | null;
          agency_id: string;
          auto_renew: boolean | null;
          billing_contact_id: string | null;
          client_id: string | null;
          cloudflare_zone_id: string | null;
          created_at: string;
          currency: string | null;
          dns_configured: boolean | null;
          dns_verified_at: string | null;
          domain_name: string;
          email_dns_configured: boolean | null;
          expiry_date: string | null;
          id: string;
          last_renewed_at: string | null;
          metadata: Json | null;
          nameservers: string[] | null;
          notes: string | null;
          registered_via_api: boolean | null;
          registrant_contact_id: string | null;
          registration_date: string | null;
          resellerclub_customer_id: string | null;
          resellerclub_last_synced_at: string | null;
          resellerclub_order_id: string | null;
          retail_price: number | null;
          site_id: string | null;
          sld: string;
          status: string;
          tags: string[] | null;
          tech_contact_id: string | null;
          tld: string;
          transfer_lock: boolean | null;
          updated_at: string;
          whois_privacy: boolean | null;
          wholesale_price: number | null;
        };
        Insert: {
          admin_contact_id?: string | null;
          agency_id: string;
          auto_renew?: boolean | null;
          billing_contact_id?: string | null;
          client_id?: string | null;
          cloudflare_zone_id?: string | null;
          created_at?: string;
          currency?: string | null;
          dns_configured?: boolean | null;
          dns_verified_at?: string | null;
          domain_name: string;
          email_dns_configured?: boolean | null;
          expiry_date?: string | null;
          id?: string;
          last_renewed_at?: string | null;
          metadata?: Json | null;
          nameservers?: string[] | null;
          notes?: string | null;
          registered_via_api?: boolean | null;
          registrant_contact_id?: string | null;
          registration_date?: string | null;
          resellerclub_customer_id?: string | null;
          resellerclub_last_synced_at?: string | null;
          resellerclub_order_id?: string | null;
          retail_price?: number | null;
          site_id?: string | null;
          sld: string;
          status?: string;
          tags?: string[] | null;
          tech_contact_id?: string | null;
          tld: string;
          transfer_lock?: boolean | null;
          updated_at?: string;
          whois_privacy?: boolean | null;
          wholesale_price?: number | null;
        };
        Update: {
          admin_contact_id?: string | null;
          agency_id?: string;
          auto_renew?: boolean | null;
          billing_contact_id?: string | null;
          client_id?: string | null;
          cloudflare_zone_id?: string | null;
          created_at?: string;
          currency?: string | null;
          dns_configured?: boolean | null;
          dns_verified_at?: string | null;
          domain_name?: string;
          email_dns_configured?: boolean | null;
          expiry_date?: string | null;
          id?: string;
          last_renewed_at?: string | null;
          metadata?: Json | null;
          nameservers?: string[] | null;
          notes?: string | null;
          registered_via_api?: boolean | null;
          registrant_contact_id?: string | null;
          registration_date?: string | null;
          resellerclub_customer_id?: string | null;
          resellerclub_last_synced_at?: string | null;
          resellerclub_order_id?: string | null;
          retail_price?: number | null;
          site_id?: string | null;
          sld?: string;
          status?: string;
          tags?: string[] | null;
          tech_contact_id?: string | null;
          tld?: string;
          transfer_lock?: boolean | null;
          updated_at?: string;
          whois_privacy?: boolean | null;
          wholesale_price?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "domains_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domains_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "domains_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      email_accounts: {
        Row: {
          created_at: string | null;
          email: string;
          email_order_id: string;
          first_name: string;
          id: string;
          last_login: string | null;
          last_name: string;
          status: string;
          storage_limit: number | null;
          storage_used: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          email: string;
          email_order_id: string;
          first_name: string;
          id?: string;
          last_login?: string | null;
          last_name: string;
          status?: string;
          storage_limit?: number | null;
          storage_used?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          email?: string;
          email_order_id?: string;
          first_name?: string;
          id?: string;
          last_login?: string | null;
          last_name?: string;
          status?: string;
          storage_limit?: number | null;
          storage_used?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "email_accounts_email_order_id_fkey";
            columns: ["email_order_id"];
            isOneToOne: false;
            referencedRelation: "email_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      email_orders: {
        Row: {
          agency_id: string;
          client_id: string | null;
          created_at: string | null;
          currency: string;
          domain_id: string | null;
          domain_name: string;
          expiry_date: string;
          id: string;
          idempotency_key: string | null;
          number_of_accounts: number;
          pending_purchase_id: string | null;
          product_key: string;
          resellerclub_customer_id: string;
          resellerclub_last_synced_at: string | null;
          resellerclub_order_id: string;
          retail_price: number;
          start_date: string;
          status: string;
          updated_at: string | null;
          used_accounts: number;
          wholesale_price: number;
        };
        Insert: {
          agency_id: string;
          client_id?: string | null;
          created_at?: string | null;
          currency?: string;
          domain_id?: string | null;
          domain_name: string;
          expiry_date: string;
          id?: string;
          idempotency_key?: string | null;
          number_of_accounts?: number;
          pending_purchase_id?: string | null;
          product_key?: string;
          resellerclub_customer_id: string;
          resellerclub_last_synced_at?: string | null;
          resellerclub_order_id: string;
          retail_price?: number;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          used_accounts?: number;
          wholesale_price?: number;
        };
        Update: {
          agency_id?: string;
          client_id?: string | null;
          created_at?: string | null;
          currency?: string;
          domain_id?: string | null;
          domain_name?: string;
          expiry_date?: string;
          id?: string;
          idempotency_key?: string | null;
          number_of_accounts?: number;
          pending_purchase_id?: string | null;
          product_key?: string;
          resellerclub_customer_id?: string;
          resellerclub_last_synced_at?: string | null;
          resellerclub_order_id?: string;
          retail_price?: number;
          start_date?: string;
          status?: string;
          updated_at?: string | null;
          used_accounts?: number;
          wholesale_price?: number;
        };
        Relationships: [
          {
            foreignKeyName: "email_orders_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_orders_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_orders_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_orders_pending_purchase_id_fkey";
            columns: ["pending_purchase_id"];
            isOneToOne: false;
            referencedRelation: "pending_purchases";
            referencedColumns: ["id"];
          },
        ];
      };
      email_pricing_cache: {
        Row: {
          account_slab: string;
          add_account_price: number | null;
          created_at: string;
          currency: string;
          id: string;
          last_refreshed_at: string;
          months: number;
          pricing_type: string;
          product_key: string;
          renew_account_price: number | null;
          source_api_endpoint: string | null;
          updated_at: string;
        };
        Insert: {
          account_slab?: string;
          add_account_price?: number | null;
          created_at?: string;
          currency?: string;
          id?: string;
          last_refreshed_at?: string;
          months: number;
          pricing_type: string;
          product_key: string;
          renew_account_price?: number | null;
          source_api_endpoint?: string | null;
          updated_at?: string;
        };
        Update: {
          account_slab?: string;
          add_account_price?: number | null;
          created_at?: string;
          currency?: string;
          id?: string;
          last_refreshed_at?: string;
          months?: number;
          pricing_type?: string;
          product_key?: string;
          renew_account_price?: number | null;
          source_api_endpoint?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      email_subscriptions: {
        Row: {
          agency_id: string;
          billing_cycle: string | null;
          created_at: string;
          current_mailboxes: number | null;
          domain_id: string;
          id: string;
          max_mailboxes: number | null;
          next_billing_date: string | null;
          plan_type: string | null;
          price_per_mailbox: number | null;
          resellerclub_email_order_id: string | null;
          resellerclub_email_subscription_id: string | null;
          status: string | null;
          updated_at: string;
        };
        Insert: {
          agency_id: string;
          billing_cycle?: string | null;
          created_at?: string;
          current_mailboxes?: number | null;
          domain_id: string;
          id?: string;
          max_mailboxes?: number | null;
          next_billing_date?: string | null;
          plan_type?: string | null;
          price_per_mailbox?: number | null;
          resellerclub_email_order_id?: string | null;
          resellerclub_email_subscription_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Update: {
          agency_id?: string;
          billing_cycle?: string | null;
          created_at?: string;
          current_mailboxes?: number | null;
          domain_id?: string;
          id?: string;
          max_mailboxes?: number | null;
          next_billing_date?: string | null;
          plan_type?: string | null;
          price_per_mailbox?: number | null;
          resellerclub_email_order_id?: string | null;
          resellerclub_email_subscription_id?: string | null;
          status?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "email_subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "email_subscriptions_domain_id_fkey";
            columns: ["domain_id"];
            isOneToOne: false;
            referencedRelation: "domains";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_modules: {
        Row: {
          category: string | null;
          created_at: string | null;
          custom_image_url: string | null;
          description: string | null;
          ends_at: string | null;
          headline: string | null;
          id: string;
          is_active: boolean | null;
          module_id: string;
          placement: string;
          position: number | null;
          starts_at: string | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          custom_image_url?: string | null;
          description?: string | null;
          ends_at?: string | null;
          headline?: string | null;
          id?: string;
          is_active?: boolean | null;
          module_id: string;
          placement: string;
          position?: number | null;
          starts_at?: string | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          custom_image_url?: string | null;
          description?: string | null;
          ends_at?: string | null;
          headline?: string | null;
          id?: string;
          is_active?: boolean | null;
          module_id?: string;
          placement?: string;
          position?: number | null;
          starts_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "featured_modules_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      form_settings: {
        Row: {
          created_at: string | null;
          enable_honeypot: boolean | null;
          enable_rate_limit: boolean | null;
          form_id: string;
          form_name: string | null;
          id: string;
          notify_emails: string[] | null;
          notify_on_submission: boolean | null;
          rate_limit_per_hour: number | null;
          redirect_url: string | null;
          retention_days: number | null;
          site_id: string;
          success_message: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          enable_honeypot?: boolean | null;
          enable_rate_limit?: boolean | null;
          form_id: string;
          form_name?: string | null;
          id?: string;
          notify_emails?: string[] | null;
          notify_on_submission?: boolean | null;
          rate_limit_per_hour?: number | null;
          redirect_url?: string | null;
          retention_days?: number | null;
          site_id: string;
          success_message?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          enable_honeypot?: boolean | null;
          enable_rate_limit?: boolean | null;
          form_id?: string;
          form_name?: string | null;
          id?: string;
          notify_emails?: string[] | null;
          notify_on_submission?: boolean | null;
          rate_limit_per_hour?: number | null;
          redirect_url?: string | null;
          retention_days?: number | null;
          site_id?: string;
          success_message?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "form_settings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      form_submissions: {
        Row: {
          created_at: string | null;
          data: Json;
          form_id: string;
          id: string;
          ip_address: string | null;
          is_spam: boolean | null;
          notified_at: string | null;
          page_url: string | null;
          referrer: string | null;
          site_id: string;
          status: string | null;
          user_agent: string | null;
          webhook_sent_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          data: Json;
          form_id: string;
          id?: string;
          ip_address?: string | null;
          is_spam?: boolean | null;
          notified_at?: string | null;
          page_url?: string | null;
          referrer?: string | null;
          site_id: string;
          status?: string | null;
          user_agent?: string | null;
          webhook_sent_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          data?: Json;
          form_id?: string;
          id?: string;
          ip_address?: string | null;
          is_spam?: boolean | null;
          notified_at?: string | null;
          page_url?: string | null;
          referrer?: string | null;
          site_id?: string;
          status?: string | null;
          user_agent?: string | null;
          webhook_sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "form_submissions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      form_webhooks: {
        Row: {
          created_at: string | null;
          form_id: string | null;
          headers: Json | null;
          id: string;
          is_active: boolean | null;
          last_status_code: number | null;
          last_triggered_at: string | null;
          method: string | null;
          site_id: string;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          form_id?: string | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_status_code?: number | null;
          last_triggered_at?: string | null;
          method?: string | null;
          site_id: string;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          form_id?: string | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_status_code?: number | null;
          last_triggered_at?: string | null;
          method?: string | null;
          site_id?: string;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "form_webhooks_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      invoices: {
        Row: {
          agency_id: string;
          amount: number;
          created_at: string | null;
          currency: string;
          id: string;
          invoice_url: string | null;
          lemonsqueezy_order_id: string;
          receipt_url: string | null;
          status: string;
          subscription_id: string | null;
        };
        Insert: {
          agency_id: string;
          amount: number;
          created_at?: string | null;
          currency?: string;
          id?: string;
          invoice_url?: string | null;
          lemonsqueezy_order_id: string;
          receipt_url?: string | null;
          status?: string;
          subscription_id?: string | null;
        };
        Update: {
          agency_id?: string;
          amount?: number;
          created_at?: string | null;
          currency?: string;
          id?: string;
          invoice_url?: string | null;
          lemonsqueezy_order_id?: string;
          receipt_url?: string | null;
          status?: string;
          subscription_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      media_folders: {
        Row: {
          agency_id: string;
          created_at: string | null;
          id: string;
          name: string;
          parent_id: string | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          created_at?: string | null;
          id?: string;
          name: string;
          parent_id?: string | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          created_at?: string | null;
          id?: string;
          name?: string;
          parent_id?: string | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "media_folders_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "media_folders_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "media_folders";
            referencedColumns: ["id"];
          },
        ];
      };
      media_usage: {
        Row: {
          asset_id: string;
          created_at: string | null;
          entity_id: string;
          entity_type: string;
          field_name: string | null;
          id: string;
        };
        Insert: {
          asset_id: string;
          created_at?: string | null;
          entity_id: string;
          entity_type: string;
          field_name?: string | null;
          id?: string;
        };
        Update: {
          asset_id?: string;
          created_at?: string | null;
          entity_id?: string;
          entity_type?: string;
          field_name?: string | null;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "media_usage_asset_id_fkey";
            columns: ["asset_id"];
            isOneToOne: false;
            referencedRelation: "assets";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_appointments: {
        Row: {
          calendar_id: string | null;
          cancellation_reason: string | null;
          cancelled_at: string | null;
          cancelled_by: string | null;
          created_at: string;
          created_by: string | null;
          crm_contact_id: string | null;
          custom_fields: Json;
          customer_email: string | null;
          customer_name: string;
          customer_notes: string | null;
          customer_phone: string | null;
          end_time: string;
          id: string;
          metadata: Json;
          payment_amount: number | null;
          payment_id: string | null;
          payment_status: string | null;
          recurring_id: string | null;
          recurring_rule: string | null;
          reminder_sent_at: string | null;
          service_id: string;
          site_id: string;
          staff_id: string | null;
          start_time: string;
          status: string;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          calendar_id?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          crm_contact_id?: string | null;
          custom_fields?: Json;
          customer_email?: string | null;
          customer_name: string;
          customer_notes?: string | null;
          customer_phone?: string | null;
          end_time: string;
          id?: string;
          metadata?: Json;
          payment_amount?: number | null;
          payment_id?: string | null;
          payment_status?: string | null;
          recurring_id?: string | null;
          recurring_rule?: string | null;
          reminder_sent_at?: string | null;
          service_id: string;
          site_id: string;
          staff_id?: string | null;
          start_time: string;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          calendar_id?: string | null;
          cancellation_reason?: string | null;
          cancelled_at?: string | null;
          cancelled_by?: string | null;
          created_at?: string;
          created_by?: string | null;
          crm_contact_id?: string | null;
          custom_fields?: Json;
          customer_email?: string | null;
          customer_name?: string;
          customer_notes?: string | null;
          customer_phone?: string | null;
          end_time?: string;
          id?: string;
          metadata?: Json;
          payment_amount?: number | null;
          payment_id?: string | null;
          payment_status?: string | null;
          recurring_id?: string | null;
          recurring_rule?: string | null;
          reminder_sent_at?: string | null;
          service_id?: string;
          site_id?: string;
          staff_id?: string | null;
          start_time?: string;
          status?: string;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_appointments_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_appointments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_appointments_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_appointments_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_availability: {
        Row: {
          calendar_id: string | null;
          created_at: string;
          day_of_week: number | null;
          end_time: string | null;
          id: string;
          label: string | null;
          priority: number | null;
          rule_type: string;
          service_id: string | null;
          site_id: string;
          specific_date: string | null;
          staff_id: string | null;
          start_time: string | null;
          valid_from: string | null;
          valid_until: string | null;
        };
        Insert: {
          calendar_id?: string | null;
          created_at?: string;
          day_of_week?: number | null;
          end_time?: string | null;
          id?: string;
          label?: string | null;
          priority?: number | null;
          rule_type: string;
          service_id?: string | null;
          site_id: string;
          specific_date?: string | null;
          staff_id?: string | null;
          start_time?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Update: {
          calendar_id?: string | null;
          created_at?: string;
          day_of_week?: number | null;
          end_time?: string | null;
          id?: string;
          label?: string | null;
          priority?: number | null;
          rule_type?: string;
          service_id?: string | null;
          site_id?: string;
          specific_date?: string | null;
          staff_id?: string | null;
          start_time?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_availability_calendar_id_fkey";
            columns: ["calendar_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_calendars";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_availability_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_availability_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_availability_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_calendars: {
        Row: {
          created_at: string;
          description: string | null;
          external_calendar_type: string | null;
          external_calendar_url: string | null;
          id: string;
          is_active: boolean | null;
          last_synced_at: string | null;
          name: string;
          site_id: string;
          staff_id: string | null;
          timezone: string | null;
          type: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          external_calendar_type?: string | null;
          external_calendar_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_synced_at?: string | null;
          name: string;
          site_id: string;
          staff_id?: string | null;
          timezone?: string | null;
          type?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          external_calendar_type?: string | null;
          external_calendar_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_synced_at?: string | null;
          name?: string;
          site_id?: string;
          staff_id?: string | null;
          timezone?: string | null;
          type?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_calendars_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_calendars_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_reminders: {
        Row: {
          appointment_id: string;
          body: string | null;
          created_at: string;
          error: string | null;
          id: string;
          send_at: string;
          sent_at: string | null;
          site_id: string;
          status: string;
          subject: string | null;
          type: string;
        };
        Insert: {
          appointment_id: string;
          body?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          send_at: string;
          sent_at?: string | null;
          site_id: string;
          status?: string;
          subject?: string | null;
          type: string;
        };
        Update: {
          appointment_id?: string;
          body?: string | null;
          created_at?: string;
          error?: string | null;
          id?: string;
          send_at?: string;
          sent_at?: string | null;
          site_id?: string;
          status?: string;
          subject?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_reminders_appointment_id_fkey";
            columns: ["appointment_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_appointments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_reminders_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_services: {
        Row: {
          allow_online_booking: boolean | null;
          buffer_after_minutes: number | null;
          buffer_before_minutes: number | null;
          color: string | null;
          created_at: string;
          created_by: string | null;
          currency: string | null;
          custom_fields: Json;
          description: string | null;
          duration_minutes: number;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          max_attendees: number | null;
          name: string;
          price: number | null;
          require_confirmation: boolean | null;
          require_payment: boolean | null;
          site_id: string;
          slug: string;
          sort_order: number | null;
          updated_at: string;
        };
        Insert: {
          allow_online_booking?: boolean | null;
          buffer_after_minutes?: number | null;
          buffer_before_minutes?: number | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          custom_fields?: Json;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          max_attendees?: number | null;
          name: string;
          price?: number | null;
          require_confirmation?: boolean | null;
          require_payment?: boolean | null;
          site_id: string;
          slug: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Update: {
          allow_online_booking?: boolean | null;
          buffer_after_minutes?: number | null;
          buffer_before_minutes?: number | null;
          color?: string | null;
          created_at?: string;
          created_by?: string | null;
          currency?: string | null;
          custom_fields?: Json;
          description?: string | null;
          duration_minutes?: number;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          max_attendees?: number | null;
          name?: string;
          price?: number | null;
          require_confirmation?: boolean | null;
          require_payment?: boolean | null;
          site_id?: string;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_services_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_settings: {
        Row: {
          accent_color: string | null;
          auto_confirm: boolean | null;
          auto_create_crm_contact: boolean | null;
          business_name: string | null;
          cancellation_notice_hours: number | null;
          confirmation_email_enabled: boolean | null;
          created_at: string;
          currency: string;
          date_format: string | null;
          id: string;
          logo_url: string | null;
          manual_payment_instructions: string | null;
          max_booking_advance_days: number | null;
          min_booking_notice_hours: number | null;
          notification_email: string | null;
          payment_provider: string | null;
          reminder_hours: Json | null;
          require_payment: boolean | null;
          site_id: string;
          slot_interval_minutes: number | null;
          time_format: string | null;
          timezone: string | null;
          updated_at: string;
        };
        Insert: {
          accent_color?: string | null;
          auto_confirm?: boolean | null;
          auto_create_crm_contact?: boolean | null;
          business_name?: string | null;
          cancellation_notice_hours?: number | null;
          confirmation_email_enabled?: boolean | null;
          created_at?: string;
          currency?: string;
          date_format?: string | null;
          id?: string;
          logo_url?: string | null;
          manual_payment_instructions?: string | null;
          max_booking_advance_days?: number | null;
          min_booking_notice_hours?: number | null;
          notification_email?: string | null;
          payment_provider?: string | null;
          reminder_hours?: Json | null;
          require_payment?: boolean | null;
          site_id: string;
          slot_interval_minutes?: number | null;
          time_format?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
        Update: {
          accent_color?: string | null;
          auto_confirm?: boolean | null;
          auto_create_crm_contact?: boolean | null;
          business_name?: string | null;
          cancellation_notice_hours?: number | null;
          confirmation_email_enabled?: boolean | null;
          created_at?: string;
          currency?: string;
          date_format?: string | null;
          id?: string;
          logo_url?: string | null;
          manual_payment_instructions?: string | null;
          max_booking_advance_days?: number | null;
          min_booking_notice_hours?: number | null;
          notification_email?: string | null;
          payment_provider?: string | null;
          reminder_hours?: Json | null;
          require_payment?: boolean | null;
          site_id?: string;
          slot_interval_minutes?: number | null;
          time_format?: string | null;
          timezone?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_settings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: true;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_staff: {
        Row: {
          accept_bookings: boolean | null;
          avatar_url: string | null;
          bio: string | null;
          created_at: string;
          default_availability: Json;
          email: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          phone: string | null;
          site_id: string;
          timezone: string | null;
          updated_at: string;
          user_id: string | null;
        };
        Insert: {
          accept_bookings?: boolean | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          default_availability?: Json;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          phone?: string | null;
          site_id: string;
          timezone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Update: {
          accept_bookings?: boolean | null;
          avatar_url?: string | null;
          bio?: string | null;
          created_at?: string;
          default_availability?: Json;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          phone?: string | null;
          site_id?: string;
          timezone?: string | null;
          updated_at?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_staff_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_bookmod01_staff_services: {
        Row: {
          created_at: string;
          custom_duration_minutes: number | null;
          custom_price: number | null;
          id: string;
          service_id: string;
          site_id: string;
          staff_id: string;
        };
        Insert: {
          created_at?: string;
          custom_duration_minutes?: number | null;
          custom_price?: number | null;
          id?: string;
          service_id: string;
          site_id: string;
          staff_id: string;
        };
        Update: {
          created_at?: string;
          custom_duration_minutes?: number | null;
          custom_price?: number | null;
          id?: string;
          service_id?: string;
          site_id?: string;
          staff_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_bookmod01_staff_services_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_staff_services_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_bookmod01_staff_services_staff_id_fkey";
            columns: ["staff_id"];
            isOneToOne: false;
            referencedRelation: "mod_bookmod01_staff";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_agents: {
        Row: {
          avatar_url: string | null;
          avg_rating: number | null;
          avg_response_time_seconds: number | null;
          created_at: string | null;
          current_chat_count: number | null;
          department_id: string | null;
          display_name: string;
          email: string | null;
          id: string;
          is_active: boolean | null;
          last_active_at: string | null;
          max_concurrent_chats: number | null;
          permissions: Json | null;
          role: string;
          site_id: string;
          source: string | null;
          status: string;
          total_chats_handled: number | null;
          total_ratings: number | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          avatar_url?: string | null;
          avg_rating?: number | null;
          avg_response_time_seconds?: number | null;
          created_at?: string | null;
          current_chat_count?: number | null;
          department_id?: string | null;
          display_name: string;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          max_concurrent_chats?: number | null;
          permissions?: Json | null;
          role?: string;
          site_id: string;
          source?: string | null;
          status?: string;
          total_chats_handled?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          avatar_url?: string | null;
          avg_rating?: number | null;
          avg_response_time_seconds?: number | null;
          created_at?: string | null;
          current_chat_count?: number | null;
          department_id?: string | null;
          display_name?: string;
          email?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_active_at?: string | null;
          max_concurrent_chats?: number | null;
          permissions?: Json | null;
          role?: string;
          site_id?: string;
          source?: string | null;
          status?: string;
          total_chats_handled?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_agents_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "mod_chat_departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_chat_agents_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_analytics: {
        Row: {
          agent_id: string | null;
          ai_auto_responses: number | null;
          ai_resolved: number | null;
          avg_first_response_seconds: number | null;
          avg_messages_per_conversation: number | null;
          avg_rating: number | null;
          avg_resolution_seconds: number | null;
          avg_wait_seconds: number | null;
          created_at: string | null;
          date: string;
          id: string;
          missed_conversations: number | null;
          new_visitors: number | null;
          resolved_conversations: number | null;
          returning_visitors: number | null;
          satisfaction_score: number | null;
          site_id: string;
          total_conversations: number | null;
          total_messages: number | null;
          total_ratings: number | null;
          updated_at: string | null;
          whatsapp_conversations: number | null;
          widget_conversations: number | null;
        };
        Insert: {
          agent_id?: string | null;
          ai_auto_responses?: number | null;
          ai_resolved?: number | null;
          avg_first_response_seconds?: number | null;
          avg_messages_per_conversation?: number | null;
          avg_rating?: number | null;
          avg_resolution_seconds?: number | null;
          avg_wait_seconds?: number | null;
          created_at?: string | null;
          date: string;
          id?: string;
          missed_conversations?: number | null;
          new_visitors?: number | null;
          resolved_conversations?: number | null;
          returning_visitors?: number | null;
          satisfaction_score?: number | null;
          site_id: string;
          total_conversations?: number | null;
          total_messages?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          whatsapp_conversations?: number | null;
          widget_conversations?: number | null;
        };
        Update: {
          agent_id?: string | null;
          ai_auto_responses?: number | null;
          ai_resolved?: number | null;
          avg_first_response_seconds?: number | null;
          avg_messages_per_conversation?: number | null;
          avg_rating?: number | null;
          avg_resolution_seconds?: number | null;
          avg_wait_seconds?: number | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          missed_conversations?: number | null;
          new_visitors?: number | null;
          resolved_conversations?: number | null;
          returning_visitors?: number | null;
          satisfaction_score?: number | null;
          site_id?: string;
          total_conversations?: number | null;
          total_messages?: number | null;
          total_ratings?: number | null;
          updated_at?: string | null;
          whatsapp_conversations?: number | null;
          widget_conversations?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_analytics_agent_id_fkey";
            columns: ["agent_id"];
            isOneToOne: false;
            referencedRelation: "mod_chat_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_chat_analytics_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_canned_responses: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          is_shared: boolean | null;
          last_used_at: string | null;
          shortcut: string | null;
          site_id: string;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_shared?: boolean | null;
          last_used_at?: string | null;
          shortcut?: string | null;
          site_id: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_shared?: boolean | null;
          last_used_at?: string | null;
          shortcut?: string | null;
          site_id?: string;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_canned_responses_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_conversations: {
        Row: {
          assigned_agent_id: string | null;
          channel: string;
          closed_at: string | null;
          created_at: string | null;
          department_id: string | null;
          first_response_time_seconds: number | null;
          id: string;
          internal_notes: string | null;
          last_message_at: string | null;
          last_message_by: string | null;
          last_message_text: string | null;
          message_count: number | null;
          metadata: Json | null;
          priority: string | null;
          rated_at: string | null;
          rating: number | null;
          rating_comment: string | null;
          resolution_time_seconds: number | null;
          resolved_at: string | null;
          site_id: string;
          status: string;
          subject: string | null;
          tags: string[] | null;
          unread_agent_count: number | null;
          unread_visitor_count: number | null;
          updated_at: string | null;
          visitor_id: string;
          wait_time_seconds: number | null;
          whatsapp_conversation_id: string | null;
          whatsapp_window_expires_at: string | null;
        };
        Insert: {
          assigned_agent_id?: string | null;
          channel?: string;
          closed_at?: string | null;
          created_at?: string | null;
          department_id?: string | null;
          first_response_time_seconds?: number | null;
          id?: string;
          internal_notes?: string | null;
          last_message_at?: string | null;
          last_message_by?: string | null;
          last_message_text?: string | null;
          message_count?: number | null;
          metadata?: Json | null;
          priority?: string | null;
          rated_at?: string | null;
          rating?: number | null;
          rating_comment?: string | null;
          resolution_time_seconds?: number | null;
          resolved_at?: string | null;
          site_id: string;
          status?: string;
          subject?: string | null;
          tags?: string[] | null;
          unread_agent_count?: number | null;
          unread_visitor_count?: number | null;
          updated_at?: string | null;
          visitor_id: string;
          wait_time_seconds?: number | null;
          whatsapp_conversation_id?: string | null;
          whatsapp_window_expires_at?: string | null;
        };
        Update: {
          assigned_agent_id?: string | null;
          channel?: string;
          closed_at?: string | null;
          created_at?: string | null;
          department_id?: string | null;
          first_response_time_seconds?: number | null;
          id?: string;
          internal_notes?: string | null;
          last_message_at?: string | null;
          last_message_by?: string | null;
          last_message_text?: string | null;
          message_count?: number | null;
          metadata?: Json | null;
          priority?: string | null;
          rated_at?: string | null;
          rating?: number | null;
          rating_comment?: string | null;
          resolution_time_seconds?: number | null;
          resolved_at?: string | null;
          site_id?: string;
          status?: string;
          subject?: string | null;
          tags?: string[] | null;
          unread_agent_count?: number | null;
          unread_visitor_count?: number | null;
          updated_at?: string | null;
          visitor_id?: string;
          wait_time_seconds?: number | null;
          whatsapp_conversation_id?: string | null;
          whatsapp_window_expires_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_conversations_assigned_agent_id_fkey";
            columns: ["assigned_agent_id"];
            isOneToOne: false;
            referencedRelation: "mod_chat_agents";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_chat_conversations_department_id_fkey";
            columns: ["department_id"];
            isOneToOne: false;
            referencedRelation: "mod_chat_departments";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_chat_conversations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_chat_conversations_visitor_id_fkey";
            columns: ["visitor_id"];
            isOneToOne: false;
            referencedRelation: "mod_chat_visitors";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_departments: {
        Row: {
          auto_assign: boolean | null;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          max_concurrent_chats: number | null;
          name: string;
          site_id: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          auto_assign?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          max_concurrent_chats?: number | null;
          name: string;
          site_id: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          auto_assign?: boolean | null;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          max_concurrent_chats?: number | null;
          name?: string;
          site_id?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_departments_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_knowledge_base: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          last_matched_at: string | null;
          site_id: string;
          tags: string[] | null;
          title: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_matched_at?: string | null;
          site_id: string;
          tags?: string[] | null;
          title: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_matched_at?: string | null;
          site_id?: string;
          tags?: string[] | null;
          title?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_knowledge_base_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_message_templates: {
        Row: {
          created_at: string;
          enabled: boolean;
          event_type: string;
          id: string;
          message_template: string;
          site_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          enabled?: boolean;
          event_type: string;
          id?: string;
          message_template: string;
          site_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          enabled?: boolean;
          event_type?: string;
          id?: string;
          message_template?: string;
          site_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_message_templates_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_messages: {
        Row: {
          ai_confidence: number | null;
          content: string | null;
          content_type: string | null;
          conversation_id: string;
          created_at: string | null;
          file_mime_type: string | null;
          file_name: string | null;
          file_size: number | null;
          file_url: string | null;
          id: string;
          is_ai_generated: boolean | null;
          is_internal_note: boolean | null;
          mentioned_agent_ids: string[] | null;
          sender_avatar: string | null;
          sender_id: string | null;
          sender_name: string | null;
          sender_type: string;
          site_id: string;
          status: string | null;
          updated_at: string | null;
          whatsapp_message_id: string | null;
          whatsapp_status: string | null;
        };
        Insert: {
          ai_confidence?: number | null;
          content?: string | null;
          content_type?: string | null;
          conversation_id: string;
          created_at?: string | null;
          file_mime_type?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          is_ai_generated?: boolean | null;
          is_internal_note?: boolean | null;
          mentioned_agent_ids?: string[] | null;
          sender_avatar?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type: string;
          site_id: string;
          status?: string | null;
          updated_at?: string | null;
          whatsapp_message_id?: string | null;
          whatsapp_status?: string | null;
        };
        Update: {
          ai_confidence?: number | null;
          content?: string | null;
          content_type?: string | null;
          conversation_id?: string;
          created_at?: string | null;
          file_mime_type?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          file_url?: string | null;
          id?: string;
          is_ai_generated?: boolean | null;
          is_internal_note?: boolean | null;
          mentioned_agent_ids?: string[] | null;
          sender_avatar?: string | null;
          sender_id?: string | null;
          sender_name?: string | null;
          sender_type?: string;
          site_id?: string;
          status?: string | null;
          updated_at?: string | null;
          whatsapp_message_id?: string | null;
          whatsapp_status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "mod_chat_conversations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_chat_messages_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_visitors: {
        Row: {
          avatar_url: string | null;
          browser: string | null;
          channel: string | null;
          city: string | null;
          country: string | null;
          created_at: string | null;
          crm_contact_id: string | null;
          current_page_title: string | null;
          current_page_url: string | null;
          custom_data: Json | null;
          device: string | null;
          email: string | null;
          external_id: string | null;
          first_seen_at: string | null;
          id: string;
          ip_address: unknown;
          landing_page_url: string | null;
          last_seen_at: string | null;
          name: string | null;
          notes: string | null;
          os: string | null;
          phone: string | null;
          referrer_url: string | null;
          site_id: string;
          tags: string[] | null;
          total_conversations: number | null;
          total_messages: number | null;
          total_visits: number | null;
          updated_at: string | null;
          whatsapp_phone: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          browser?: string | null;
          channel?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          crm_contact_id?: string | null;
          current_page_title?: string | null;
          current_page_url?: string | null;
          custom_data?: Json | null;
          device?: string | null;
          email?: string | null;
          external_id?: string | null;
          first_seen_at?: string | null;
          id?: string;
          ip_address?: unknown;
          landing_page_url?: string | null;
          last_seen_at?: string | null;
          name?: string | null;
          notes?: string | null;
          os?: string | null;
          phone?: string | null;
          referrer_url?: string | null;
          site_id: string;
          tags?: string[] | null;
          total_conversations?: number | null;
          total_messages?: number | null;
          total_visits?: number | null;
          updated_at?: string | null;
          whatsapp_phone?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          browser?: string | null;
          channel?: string | null;
          city?: string | null;
          country?: string | null;
          created_at?: string | null;
          crm_contact_id?: string | null;
          current_page_title?: string | null;
          current_page_url?: string | null;
          custom_data?: Json | null;
          device?: string | null;
          email?: string | null;
          external_id?: string | null;
          first_seen_at?: string | null;
          id?: string;
          ip_address?: unknown;
          landing_page_url?: string | null;
          last_seen_at?: string | null;
          name?: string | null;
          notes?: string | null;
          os?: string | null;
          phone?: string | null;
          referrer_url?: string | null;
          site_id?: string;
          tags?: string[] | null;
          total_conversations?: number | null;
          total_messages?: number | null;
          total_visits?: number | null;
          updated_at?: string | null;
          whatsapp_phone?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_visitors_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_chat_widget_settings: {
        Row: {
          ai_assistant_name: string | null;
          ai_auto_response_enabled: boolean | null;
          ai_confidence_threshold: number | null;
          ai_custom_instructions: string | null;
          ai_handoff_keywords: Json | null;
          ai_handoff_message: string | null;
          ai_payment_greeting: string | null;
          ai_payment_guidance_enabled: boolean | null;
          ai_response_tone: string | null;
          allowed_domains: string[] | null;
          allowed_file_types: string[] | null;
          auto_close_enabled: boolean | null;
          auto_close_message: string | null;
          auto_close_minutes: number | null;
          auto_open_delay_seconds: number | null;
          away_message: string | null;
          blocked_ips: string[] | null;
          border_radius: number | null;
          business_hours: Json | null;
          business_hours_enabled: boolean | null;
          company_name: string | null;
          created_at: string | null;
          custom_translations: Json | null;
          enable_emoji: boolean | null;
          enable_file_uploads: boolean | null;
          enable_satisfaction_rating: boolean | null;
          enable_sound_notifications: boolean | null;
          id: string;
          language: string | null;
          launcher_icon: string | null;
          launcher_size: number | null;
          logo_url: string | null;
          max_file_size_mb: number | null;
          offline_message: string | null;
          position: string | null;
          pre_chat_department_selector: boolean | null;
          pre_chat_email_required: boolean | null;
          pre_chat_enabled: boolean | null;
          pre_chat_message_required: boolean | null;
          pre_chat_name_required: boolean | null;
          pre_chat_phone_enabled: boolean | null;
          pre_chat_phone_required: boolean | null;
          primary_color: string | null;
          show_agent_avatar: boolean | null;
          show_agent_name: boolean | null;
          show_typing_indicator: boolean | null;
          site_id: string;
          text_color: string | null;
          timezone: string | null;
          updated_at: string | null;
          welcome_message: string | null;
          whatsapp_business_account_id: string | null;
          whatsapp_enabled: boolean | null;
          whatsapp_phone_number: string | null;
          whatsapp_phone_number_id: string | null;
          whatsapp_welcome_template: string | null;
          z_index: number | null;
        };
        Insert: {
          ai_assistant_name?: string | null;
          ai_auto_response_enabled?: boolean | null;
          ai_confidence_threshold?: number | null;
          ai_custom_instructions?: string | null;
          ai_handoff_keywords?: Json | null;
          ai_handoff_message?: string | null;
          ai_payment_greeting?: string | null;
          ai_payment_guidance_enabled?: boolean | null;
          ai_response_tone?: string | null;
          allowed_domains?: string[] | null;
          allowed_file_types?: string[] | null;
          auto_close_enabled?: boolean | null;
          auto_close_message?: string | null;
          auto_close_minutes?: number | null;
          auto_open_delay_seconds?: number | null;
          away_message?: string | null;
          blocked_ips?: string[] | null;
          border_radius?: number | null;
          business_hours?: Json | null;
          business_hours_enabled?: boolean | null;
          company_name?: string | null;
          created_at?: string | null;
          custom_translations?: Json | null;
          enable_emoji?: boolean | null;
          enable_file_uploads?: boolean | null;
          enable_satisfaction_rating?: boolean | null;
          enable_sound_notifications?: boolean | null;
          id?: string;
          language?: string | null;
          launcher_icon?: string | null;
          launcher_size?: number | null;
          logo_url?: string | null;
          max_file_size_mb?: number | null;
          offline_message?: string | null;
          position?: string | null;
          pre_chat_department_selector?: boolean | null;
          pre_chat_email_required?: boolean | null;
          pre_chat_enabled?: boolean | null;
          pre_chat_message_required?: boolean | null;
          pre_chat_name_required?: boolean | null;
          pre_chat_phone_enabled?: boolean | null;
          pre_chat_phone_required?: boolean | null;
          primary_color?: string | null;
          show_agent_avatar?: boolean | null;
          show_agent_name?: boolean | null;
          show_typing_indicator?: boolean | null;
          site_id: string;
          text_color?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          welcome_message?: string | null;
          whatsapp_business_account_id?: string | null;
          whatsapp_enabled?: boolean | null;
          whatsapp_phone_number?: string | null;
          whatsapp_phone_number_id?: string | null;
          whatsapp_welcome_template?: string | null;
          z_index?: number | null;
        };
        Update: {
          ai_assistant_name?: string | null;
          ai_auto_response_enabled?: boolean | null;
          ai_confidence_threshold?: number | null;
          ai_custom_instructions?: string | null;
          ai_handoff_keywords?: Json | null;
          ai_handoff_message?: string | null;
          ai_payment_greeting?: string | null;
          ai_payment_guidance_enabled?: boolean | null;
          ai_response_tone?: string | null;
          allowed_domains?: string[] | null;
          allowed_file_types?: string[] | null;
          auto_close_enabled?: boolean | null;
          auto_close_message?: string | null;
          auto_close_minutes?: number | null;
          auto_open_delay_seconds?: number | null;
          away_message?: string | null;
          blocked_ips?: string[] | null;
          border_radius?: number | null;
          business_hours?: Json | null;
          business_hours_enabled?: boolean | null;
          company_name?: string | null;
          created_at?: string | null;
          custom_translations?: Json | null;
          enable_emoji?: boolean | null;
          enable_file_uploads?: boolean | null;
          enable_satisfaction_rating?: boolean | null;
          enable_sound_notifications?: boolean | null;
          id?: string;
          language?: string | null;
          launcher_icon?: string | null;
          launcher_size?: number | null;
          logo_url?: string | null;
          max_file_size_mb?: number | null;
          offline_message?: string | null;
          position?: string | null;
          pre_chat_department_selector?: boolean | null;
          pre_chat_email_required?: boolean | null;
          pre_chat_enabled?: boolean | null;
          pre_chat_message_required?: boolean | null;
          pre_chat_name_required?: boolean | null;
          pre_chat_phone_enabled?: boolean | null;
          pre_chat_phone_required?: boolean | null;
          primary_color?: string | null;
          show_agent_avatar?: boolean | null;
          show_agent_name?: boolean | null;
          show_typing_indicator?: boolean | null;
          site_id?: string;
          text_color?: string | null;
          timezone?: string | null;
          updated_at?: string | null;
          welcome_message?: string | null;
          whatsapp_business_account_id?: string | null;
          whatsapp_enabled?: boolean | null;
          whatsapp_phone_number?: string | null;
          whatsapp_phone_number_id?: string | null;
          whatsapp_welcome_template?: string | null;
          z_index?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_chat_widget_settings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: true;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_activities: {
        Row: {
          activity_type: string;
          assigned_to: string | null;
          call_direction: string | null;
          call_duration_seconds: number | null;
          call_recording_url: string | null;
          company_id: string | null;
          completed_at: string | null;
          contact_id: string | null;
          created_at: string;
          created_by: string | null;
          deal_id: string | null;
          description: string | null;
          email_message_id: string | null;
          email_thread_id: string | null;
          id: string;
          meeting_attendees: Json | null;
          meeting_location: string | null;
          outcome: string | null;
          scheduled_at: string | null;
          site_id: string;
          subject: string | null;
          task_completed: boolean;
          task_due_date: string | null;
          task_priority: string | null;
          updated_at: string;
        };
        Insert: {
          activity_type: string;
          assigned_to?: string | null;
          call_direction?: string | null;
          call_duration_seconds?: number | null;
          call_recording_url?: string | null;
          company_id?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deal_id?: string | null;
          description?: string | null;
          email_message_id?: string | null;
          email_thread_id?: string | null;
          id?: string;
          meeting_attendees?: Json | null;
          meeting_location?: string | null;
          outcome?: string | null;
          scheduled_at?: string | null;
          site_id: string;
          subject?: string | null;
          task_completed?: boolean;
          task_due_date?: string | null;
          task_priority?: string | null;
          updated_at?: string;
        };
        Update: {
          activity_type?: string;
          assigned_to?: string | null;
          call_direction?: string | null;
          call_duration_seconds?: number | null;
          call_recording_url?: string | null;
          company_id?: string | null;
          completed_at?: string | null;
          contact_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          deal_id?: string | null;
          description?: string | null;
          email_message_id?: string | null;
          email_thread_id?: string | null;
          id?: string;
          meeting_attendees?: Json | null;
          meeting_location?: string | null;
          outcome?: string | null;
          scheduled_at?: string | null;
          site_id?: string;
          subject?: string | null;
          task_completed?: boolean;
          task_due_date?: string | null;
          task_priority?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_activities_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_activities_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_activities_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_activities_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_companies: {
        Row: {
          account_type: string | null;
          address_line_1: string | null;
          address_line_2: string | null;
          annual_revenue: number | null;
          city: string | null;
          country: string | null;
          created_at: string;
          custom_fields: Json;
          description: string | null;
          domain: string | null;
          employee_count: number | null;
          id: string;
          industry: string | null;
          name: string;
          owner_id: string | null;
          phone: string | null;
          postal_code: string | null;
          site_id: string;
          state: string | null;
          status: string;
          tags: string[];
          updated_at: string;
          website: string | null;
        };
        Insert: {
          account_type?: string | null;
          address_line_1?: string | null;
          address_line_2?: string | null;
          annual_revenue?: number | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          custom_fields?: Json;
          description?: string | null;
          domain?: string | null;
          employee_count?: number | null;
          id?: string;
          industry?: string | null;
          name: string;
          owner_id?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          site_id: string;
          state?: string | null;
          status?: string;
          tags?: string[];
          updated_at?: string;
          website?: string | null;
        };
        Update: {
          account_type?: string | null;
          address_line_1?: string | null;
          address_line_2?: string | null;
          annual_revenue?: number | null;
          city?: string | null;
          country?: string | null;
          created_at?: string;
          custom_fields?: Json;
          description?: string | null;
          domain?: string | null;
          employee_count?: number | null;
          id?: string;
          industry?: string | null;
          name?: string;
          owner_id?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          site_id?: string;
          state?: string | null;
          status?: string;
          tags?: string[];
          updated_at?: string;
          website?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_companies_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_contact_notes: {
        Row: {
          company_id: string | null;
          contact_id: string | null;
          content: string;
          content_plain: string | null;
          created_at: string | null;
          created_by: string | null;
          deal_id: string | null;
          id: string;
          is_pinned: boolean | null;
          site_id: string;
          title: string | null;
          updated_at: string | null;
        };
        Insert: {
          company_id?: string | null;
          contact_id?: string | null;
          content: string;
          content_plain?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          site_id: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Update: {
          company_id?: string | null;
          contact_id?: string | null;
          content?: string;
          content_plain?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          deal_id?: string | null;
          id?: string;
          is_pinned?: boolean | null;
          site_id?: string;
          title?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_contact_notes_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_contact_notes_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_contact_notes_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_contact_notes_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_contacts: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          company_id: string | null;
          country: string | null;
          created_at: string;
          custom_fields: Json;
          department: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          job_title: string | null;
          last_contacted_at: string | null;
          last_name: string | null;
          lead_score: number;
          lead_status: string | null;
          linkedin_url: string | null;
          mobile: string | null;
          owner_id: string | null;
          phone: string | null;
          postal_code: string | null;
          site_id: string;
          source: string | null;
          source_details: string | null;
          state: string | null;
          status: string;
          tags: string[];
          twitter_url: string | null;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          company_id?: string | null;
          country?: string | null;
          created_at?: string;
          custom_fields?: Json;
          department?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          job_title?: string | null;
          last_contacted_at?: string | null;
          last_name?: string | null;
          lead_score?: number;
          lead_status?: string | null;
          linkedin_url?: string | null;
          mobile?: string | null;
          owner_id?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          site_id: string;
          source?: string | null;
          source_details?: string | null;
          state?: string | null;
          status?: string;
          tags?: string[];
          twitter_url?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          company_id?: string | null;
          country?: string | null;
          created_at?: string;
          custom_fields?: Json;
          department?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          job_title?: string | null;
          last_contacted_at?: string | null;
          last_name?: string | null;
          lead_score?: number;
          lead_status?: string | null;
          linkedin_url?: string | null;
          mobile?: string | null;
          owner_id?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          site_id?: string;
          source?: string | null;
          source_details?: string | null;
          state?: string | null;
          status?: string;
          tags?: string[];
          twitter_url?: string | null;
          updated_at?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_contacts_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_contacts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_custom_fields: {
        Row: {
          created_at: string;
          description: string | null;
          entity_type: string;
          field_key: string;
          field_type: string;
          id: string;
          is_required: boolean;
          name: string;
          options: Json | null;
          position: number;
          site_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          entity_type: string;
          field_key: string;
          field_type: string;
          id?: string;
          is_required?: boolean;
          name: string;
          options?: Json | null;
          position?: number;
          site_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          entity_type?: string;
          field_key?: string;
          field_type?: string;
          id?: string;
          is_required?: boolean;
          name?: string;
          options?: Json | null;
          position?: number;
          site_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_custom_fields_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_deals: {
        Row: {
          actual_close_date: string | null;
          amount: number | null;
          close_reason: string | null;
          company_id: string | null;
          contact_id: string | null;
          created_at: string;
          currency: string;
          custom_fields: Json;
          description: string | null;
          expected_close_date: string | null;
          id: string;
          name: string;
          owner_id: string | null;
          pipeline_id: string | null;
          probability: number;
          site_id: string;
          stage_id: string | null;
          status: string;
          tags: string[];
          updated_at: string;
        };
        Insert: {
          actual_close_date?: string | null;
          amount?: number | null;
          close_reason?: string | null;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          currency?: string;
          custom_fields?: Json;
          description?: string | null;
          expected_close_date?: string | null;
          id?: string;
          name: string;
          owner_id?: string | null;
          pipeline_id?: string | null;
          probability?: number;
          site_id: string;
          stage_id?: string | null;
          status?: string;
          tags?: string[];
          updated_at?: string;
        };
        Update: {
          actual_close_date?: string | null;
          amount?: number | null;
          close_reason?: string | null;
          company_id?: string | null;
          contact_id?: string | null;
          created_at?: string;
          currency?: string;
          custom_fields?: Json;
          description?: string | null;
          expected_close_date?: string | null;
          id?: string;
          name?: string;
          owner_id?: string | null;
          pipeline_id?: string | null;
          probability?: number;
          site_id?: string;
          stage_id?: string | null;
          status?: string;
          tags?: string[];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_deals_company_id_fkey";
            columns: ["company_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_companies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_deals_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_deals_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_pipelines";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_deals_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_deals_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_pipeline_stages";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_form_captures: {
        Row: {
          contact_id: string | null;
          created_at: string | null;
          deal_id: string | null;
          form_data: Json;
          form_name: string | null;
          form_type: string;
          id: string;
          ip_address: string | null;
          page_url: string | null;
          processing_notes: string | null;
          referrer_url: string | null;
          site_id: string;
          status: string | null;
          user_agent: string | null;
          utm_campaign: string | null;
          utm_content: string | null;
          utm_medium: string | null;
          utm_source: string | null;
        };
        Insert: {
          contact_id?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          form_data?: Json;
          form_name?: string | null;
          form_type?: string;
          id?: string;
          ip_address?: string | null;
          page_url?: string | null;
          processing_notes?: string | null;
          referrer_url?: string | null;
          site_id: string;
          status?: string | null;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Update: {
          contact_id?: string | null;
          created_at?: string | null;
          deal_id?: string | null;
          form_data?: Json;
          form_name?: string | null;
          form_type?: string;
          id?: string;
          ip_address?: string | null;
          page_url?: string | null;
          processing_notes?: string | null;
          referrer_url?: string | null;
          site_id?: string;
          status?: string | null;
          user_agent?: string | null;
          utm_campaign?: string | null;
          utm_content?: string | null;
          utm_medium?: string | null;
          utm_source?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_form_captures_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_form_captures_deal_id_fkey";
            columns: ["deal_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_deals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_form_captures_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_lead_scoring_rules: {
        Row: {
          category: string;
          condition: Json;
          created_at: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          max_applications: number | null;
          name: string;
          points: number;
          priority: number | null;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          category?: string;
          condition: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_applications?: number | null;
          name: string;
          points?: number;
          priority?: number | null;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          condition?: Json;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          max_applications?: number | null;
          name?: string;
          points?: number;
          priority?: number | null;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_lead_scoring_rules_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_pipeline_stages: {
        Row: {
          color: string;
          created_at: string;
          description: string | null;
          id: string;
          name: string;
          pipeline_id: string;
          position: number;
          probability: number;
          stage_type: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name: string;
          pipeline_id: string;
          position?: number;
          probability?: number;
          stage_type?: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          description?: string | null;
          id?: string;
          name?: string;
          pipeline_id?: string;
          position?: number;
          probability?: number;
          stage_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_pipeline_stages_pipeline_id_fkey";
            columns: ["pipeline_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_pipelines";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_pipelines: {
        Row: {
          created_at: string;
          deal_rotting_days: number;
          description: string | null;
          id: string;
          is_active: boolean;
          is_default: boolean;
          name: string;
          site_id: string;
        };
        Insert: {
          created_at?: string;
          deal_rotting_days?: number;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name: string;
          site_id: string;
        };
        Update: {
          created_at?: string;
          deal_rotting_days?: number;
          description?: string | null;
          id?: string;
          is_active?: boolean;
          is_default?: boolean;
          name?: string;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_pipelines_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_segment_members: {
        Row: {
          added_at: string | null;
          contact_id: string;
          id: string;
          segment_id: string;
        };
        Insert: {
          added_at?: string | null;
          contact_id: string;
          id?: string;
          segment_id: string;
        };
        Update: {
          added_at?: string | null;
          contact_id?: string;
          id?: string;
          segment_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_segment_members_contact_id_fkey";
            columns: ["contact_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_contacts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_crmmod01_segment_members_segment_id_fkey";
            columns: ["segment_id"];
            isOneToOne: false;
            referencedRelation: "mod_crmmod01_segments";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_segments: {
        Row: {
          color: string | null;
          contact_count: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          filter_logic: string | null;
          filters: Json;
          id: string;
          is_active: boolean | null;
          last_evaluated_at: string | null;
          name: string;
          segment_type: string;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          contact_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          filter_logic?: string | null;
          filters?: Json;
          id?: string;
          is_active?: boolean | null;
          last_evaluated_at?: string | null;
          name: string;
          segment_type?: string;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          contact_count?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          filter_logic?: string | null;
          filters?: Json;
          id?: string;
          is_active?: boolean | null;
          last_evaluated_at?: string | null;
          name?: string;
          segment_type?: string;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_segments_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_crmmod01_tags: {
        Row: {
          color: string;
          created_at: string;
          entity_type: string;
          id: string;
          name: string;
          site_id: string;
        };
        Insert: {
          color?: string;
          created_at?: string;
          entity_type: string;
          id?: string;
          name: string;
          site_id: string;
        };
        Update: {
          color?: string;
          created_at?: string;
          entity_type?: string;
          id?: string;
          name?: string;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_crmmod01_tags_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_analytics_snapshots: {
        Row: {
          average_order_value_cents: number | null;
          cart_abandonment_rate: number | null;
          conversion_rate: number | null;
          created_at: string | null;
          id: string;
          items_sold: number | null;
          metadata: Json | null;
          new_customers: number | null;
          sales_by_channel: Json | null;
          site_id: string;
          snapshot_date: string;
          snapshot_type: string;
          top_categories: Json | null;
          top_products: Json | null;
          total_customers: number | null;
          total_orders: number | null;
          total_revenue_cents: number | null;
        };
        Insert: {
          average_order_value_cents?: number | null;
          cart_abandonment_rate?: number | null;
          conversion_rate?: number | null;
          created_at?: string | null;
          id?: string;
          items_sold?: number | null;
          metadata?: Json | null;
          new_customers?: number | null;
          sales_by_channel?: Json | null;
          site_id: string;
          snapshot_date: string;
          snapshot_type: string;
          top_categories?: Json | null;
          top_products?: Json | null;
          total_customers?: number | null;
          total_orders?: number | null;
          total_revenue_cents?: number | null;
        };
        Update: {
          average_order_value_cents?: number | null;
          cart_abandonment_rate?: number | null;
          conversion_rate?: number | null;
          created_at?: string | null;
          id?: string;
          items_sold?: number | null;
          metadata?: Json | null;
          new_customers?: number | null;
          sales_by_channel?: Json | null;
          site_id?: string;
          snapshot_date?: string;
          snapshot_type?: string;
          top_categories?: Json | null;
          top_products?: Json | null;
          total_customers?: number | null;
          total_orders?: number | null;
          total_revenue_cents?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_analytics_snapshots_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_api_keys: {
        Row: {
          allowed_ips: Json | null;
          allowed_origins: Json | null;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          name: string;
          rate_limit_requests: number | null;
          rate_limit_window: number | null;
          scopes: Json;
          site_id: string;
          usage_count: number | null;
        };
        Insert: {
          allowed_ips?: Json | null;
          allowed_origins?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          name: string;
          rate_limit_requests?: number | null;
          rate_limit_window?: number | null;
          scopes?: Json;
          site_id: string;
          usage_count?: number | null;
        };
        Update: {
          allowed_ips?: Json | null;
          allowed_origins?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          name?: string;
          rate_limit_requests?: number | null;
          rate_limit_window?: number | null;
          scopes?: Json;
          site_id?: string;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_api_keys_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_bundle_items: {
        Row: {
          bundle_id: string;
          created_at: string | null;
          id: string;
          is_optional: boolean | null;
          price_override: number | null;
          product_id: string;
          quantity: number;
          sort_order: number | null;
          variant_id: string | null;
        };
        Insert: {
          bundle_id: string;
          created_at?: string | null;
          id?: string;
          is_optional?: boolean | null;
          price_override?: number | null;
          product_id: string;
          quantity?: number;
          sort_order?: number | null;
          variant_id?: string | null;
        };
        Update: {
          bundle_id?: string;
          created_at?: string | null;
          id?: string;
          is_optional?: boolean | null;
          price_override?: number | null;
          product_id?: string;
          quantity?: number;
          sort_order?: number | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_bundle_items_bundle_id_fkey";
            columns: ["bundle_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_bundles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_bundle_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_bundle_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_bundles: {
        Row: {
          available_from: string | null;
          available_until: string | null;
          badge_text: string | null;
          bundle_price: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          discount_percentage: number | null;
          fixed_price: number | null;
          id: string;
          images: string[] | null;
          is_active: boolean | null;
          name: string;
          original_total: number | null;
          pricing_type: string;
          quantity: number | null;
          savings: number | null;
          show_savings: boolean | null;
          site_id: string;
          sku: string | null;
          slug: string;
          track_inventory: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          available_from?: string | null;
          available_until?: string | null;
          badge_text?: string | null;
          bundle_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          discount_percentage?: number | null;
          fixed_price?: number | null;
          id?: string;
          images?: string[] | null;
          is_active?: boolean | null;
          name: string;
          original_total?: number | null;
          pricing_type: string;
          quantity?: number | null;
          savings?: number | null;
          show_savings?: boolean | null;
          site_id: string;
          sku?: string | null;
          slug: string;
          track_inventory?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          available_from?: string | null;
          available_until?: string | null;
          badge_text?: string | null;
          bundle_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          discount_percentage?: number | null;
          fixed_price?: number | null;
          id?: string;
          images?: string[] | null;
          is_active?: boolean | null;
          name?: string;
          original_total?: number | null;
          pricing_type?: string;
          quantity?: number | null;
          savings?: number | null;
          show_savings?: boolean | null;
          site_id?: string;
          sku?: string | null;
          slug?: string;
          track_inventory?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_bundles_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_cart_items: {
        Row: {
          cart_id: string;
          created_at: string | null;
          custom_options: Json | null;
          id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          variant_id: string | null;
        };
        Insert: {
          cart_id: string;
          created_at?: string | null;
          custom_options?: Json | null;
          id?: string;
          product_id: string;
          quantity?: number;
          unit_price: number;
          variant_id?: string | null;
        };
        Update: {
          cart_id?: string;
          created_at?: string | null;
          custom_options?: Json | null;
          id?: string;
          product_id?: string;
          quantity?: number;
          unit_price?: number;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_cart_items_cart_id_fkey";
            columns: ["cart_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_carts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_cart_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_cart_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_carts: {
        Row: {
          created_at: string | null;
          currency: string | null;
          customer_email: string | null;
          customer_name: string | null;
          discount_amount: number | null;
          discount_code: string | null;
          discount_type: string | null;
          expires_at: string | null;
          id: string;
          recovery_email_count: number | null;
          recovery_email_sent_at: string | null;
          recovery_token: string | null;
          session_id: string | null;
          site_id: string;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          currency?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          discount_amount?: number | null;
          discount_code?: string | null;
          discount_type?: string | null;
          expires_at?: string | null;
          id?: string;
          recovery_email_count?: number | null;
          recovery_email_sent_at?: string | null;
          recovery_token?: string | null;
          session_id?: string | null;
          site_id: string;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          currency?: string | null;
          customer_email?: string | null;
          customer_name?: string | null;
          discount_amount?: number | null;
          discount_code?: string | null;
          discount_type?: string | null;
          expires_at?: string | null;
          id?: string;
          recovery_email_count?: number | null;
          recovery_email_sent_at?: string | null;
          recovery_token?: string | null;
          session_id?: string | null;
          site_id?: string;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_carts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_categories: {
        Row: {
          agency_id: string;
          created_at: string | null;
          description: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          name: string;
          parent_id: string | null;
          seo_description: string | null;
          seo_title: string | null;
          site_id: string;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name: string;
          parent_id?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          site_id: string;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          created_at?: string | null;
          description?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          name?: string;
          parent_id?: string | null;
          seo_description?: string | null;
          seo_title?: string | null;
          site_id?: string;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_categories_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_categories_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_categories_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_customer_addresses: {
        Row: {
          address_line_1: string;
          address_line_2: string | null;
          address_type: string | null;
          city: string;
          company: string | null;
          country: string;
          created_at: string | null;
          customer_id: string;
          first_name: string | null;
          id: string;
          is_default_billing: boolean | null;
          is_default_shipping: boolean | null;
          last_name: string | null;
          phone: string | null;
          postal_code: string | null;
          state: string | null;
          updated_at: string | null;
        };
        Insert: {
          address_line_1: string;
          address_line_2?: string | null;
          address_type?: string | null;
          city: string;
          company?: string | null;
          country?: string;
          created_at?: string | null;
          customer_id: string;
          first_name?: string | null;
          id?: string;
          is_default_billing?: boolean | null;
          is_default_shipping?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          state?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address_line_1?: string;
          address_line_2?: string | null;
          address_type?: string | null;
          city?: string;
          company?: string | null;
          country?: string;
          created_at?: string | null;
          customer_id?: string;
          first_name?: string | null;
          id?: string;
          is_default_billing?: boolean | null;
          is_default_shipping?: boolean | null;
          last_name?: string | null;
          phone?: string | null;
          postal_code?: string | null;
          state?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_customer_addresses_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_customer_group_members: {
        Row: {
          added_at: string | null;
          customer_id: string;
          group_id: string;
          id: string;
        };
        Insert: {
          added_at?: string | null;
          customer_id: string;
          group_id: string;
          id?: string;
        };
        Update: {
          added_at?: string | null;
          customer_id?: string;
          group_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_customer_group_members_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_customer_group_members_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_customer_groups";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_customer_groups: {
        Row: {
          agency_id: string;
          color: string | null;
          created_at: string | null;
          customer_count: number | null;
          description: string | null;
          discount_percent: number | null;
          id: string;
          name: string;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          color?: string | null;
          created_at?: string | null;
          customer_count?: number | null;
          description?: string | null;
          discount_percent?: number | null;
          id?: string;
          name: string;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          color?: string | null;
          created_at?: string | null;
          customer_count?: number | null;
          description?: string | null;
          discount_percent?: number | null;
          id?: string;
          name?: string;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_customer_groups_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_customer_groups_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_customer_notes: {
        Row: {
          author_id: string | null;
          author_name: string | null;
          content: string;
          created_at: string | null;
          customer_id: string;
          id: string;
        };
        Insert: {
          author_id?: string | null;
          author_name?: string | null;
          content: string;
          created_at?: string | null;
          customer_id: string;
          id?: string;
        };
        Update: {
          author_id?: string | null;
          author_name?: string | null;
          content?: string;
          created_at?: string | null;
          customer_id?: string;
          id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_customer_notes_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_customer_sessions: {
        Row: {
          created_at: string;
          customer_id: string;
          expires_at: string;
          id: string;
          ip_address: string | null;
          is_magic_link: boolean;
          last_used_at: string;
          site_id: string;
          token_hash: string;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string;
          customer_id: string;
          expires_at?: string;
          id?: string;
          ip_address?: string | null;
          is_magic_link?: boolean;
          last_used_at?: string;
          site_id: string;
          token_hash: string;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string;
          customer_id?: string;
          expires_at?: string;
          id?: string;
          ip_address?: string | null;
          is_magic_link?: boolean;
          last_used_at?: string;
          site_id?: string;
          token_hash?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_customer_sessions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_customers: {
        Row: {
          accepts_marketing: boolean | null;
          agency_id: string;
          auth_user_id: string | null;
          avatar_url: string | null;
          average_order_value: number | null;
          created_at: string | null;
          email: string;
          email_verified: boolean;
          first_name: string;
          id: string;
          is_guest: boolean;
          last_name: string;
          last_order_date: string | null;
          last_seen_at: string | null;
          marketing_opt_in_at: string | null;
          metadata: Json | null;
          notes_count: number | null;
          orders_count: number | null;
          password_hash: string | null;
          password_set_at: string | null;
          phone: string | null;
          site_id: string;
          status: string | null;
          tags: string[] | null;
          total_spent: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          accepts_marketing?: boolean | null;
          agency_id: string;
          auth_user_id?: string | null;
          avatar_url?: string | null;
          average_order_value?: number | null;
          created_at?: string | null;
          email: string;
          email_verified?: boolean;
          first_name: string;
          id?: string;
          is_guest?: boolean;
          last_name: string;
          last_order_date?: string | null;
          last_seen_at?: string | null;
          marketing_opt_in_at?: string | null;
          metadata?: Json | null;
          notes_count?: number | null;
          orders_count?: number | null;
          password_hash?: string | null;
          password_set_at?: string | null;
          phone?: string | null;
          site_id: string;
          status?: string | null;
          tags?: string[] | null;
          total_spent?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          accepts_marketing?: boolean | null;
          agency_id?: string;
          auth_user_id?: string | null;
          avatar_url?: string | null;
          average_order_value?: number | null;
          created_at?: string | null;
          email?: string;
          email_verified?: boolean;
          first_name?: string;
          id?: string;
          is_guest?: boolean;
          last_name?: string;
          last_order_date?: string | null;
          last_seen_at?: string | null;
          marketing_opt_in_at?: string | null;
          metadata?: Json | null;
          notes_count?: number | null;
          orders_count?: number | null;
          password_hash?: string | null;
          password_set_at?: string | null;
          phone?: string | null;
          site_id?: string;
          status?: string | null;
          tags?: string[] | null;
          total_spent?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_customers_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_customers_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_discounts: {
        Row: {
          agency_id: string;
          applies_to: string | null;
          applies_to_ids: string[] | null;
          code: string;
          created_at: string | null;
          description: string | null;
          ends_at: string | null;
          id: string;
          is_active: boolean | null;
          minimum_order_amount: number | null;
          minimum_quantity: number | null;
          once_per_customer: boolean | null;
          site_id: string;
          starts_at: string | null;
          type: string;
          usage_count: number | null;
          usage_limit: number | null;
          value: number;
        };
        Insert: {
          agency_id: string;
          applies_to?: string | null;
          applies_to_ids?: string[] | null;
          code: string;
          created_at?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          minimum_order_amount?: number | null;
          minimum_quantity?: number | null;
          once_per_customer?: boolean | null;
          site_id: string;
          starts_at?: string | null;
          type: string;
          usage_count?: number | null;
          usage_limit?: number | null;
          value: number;
        };
        Update: {
          agency_id?: string;
          applies_to?: string | null;
          applies_to_ids?: string[] | null;
          code?: string;
          created_at?: string | null;
          description?: string | null;
          ends_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          minimum_order_amount?: number | null;
          minimum_quantity?: number | null;
          once_per_customer?: boolean | null;
          site_id?: string;
          starts_at?: string | null;
          type?: string;
          usage_count?: number | null;
          usage_limit?: number | null;
          value?: number;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_discounts_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_discounts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_email_verifications: {
        Row: {
          attempts: number;
          code_hash: string;
          created_at: string;
          email: string;
          expires_at: string;
          id: string;
          site_id: string;
          verified: boolean;
        };
        Insert: {
          attempts?: number;
          code_hash: string;
          created_at?: string;
          email: string;
          expires_at: string;
          id?: string;
          site_id: string;
          verified?: boolean;
        };
        Update: {
          attempts?: number;
          code_hash?: string;
          created_at?: string;
          email?: string;
          expires_at?: string;
          id?: string;
          site_id?: string;
          verified?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_email_verifications_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_flash_sale_products: {
        Row: {
          created_at: string | null;
          discount_type: string | null;
          discount_value: number | null;
          flash_sale_id: string;
          id: string;
          product_id: string;
          quantity_limit: number | null;
          quantity_sold: number | null;
          sort_order: number | null;
        };
        Insert: {
          created_at?: string | null;
          discount_type?: string | null;
          discount_value?: number | null;
          flash_sale_id: string;
          id?: string;
          product_id: string;
          quantity_limit?: number | null;
          quantity_sold?: number | null;
          sort_order?: number | null;
        };
        Update: {
          created_at?: string | null;
          discount_type?: string | null;
          discount_value?: number | null;
          flash_sale_id?: string;
          id?: string;
          product_id?: string;
          quantity_limit?: number | null;
          quantity_sold?: number | null;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_flash_sale_products_flash_sale_id_fkey";
            columns: ["flash_sale_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_flash_sales";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_flash_sale_products_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_flash_sales: {
        Row: {
          badge_text: string | null;
          banner_image: string | null;
          created_at: string | null;
          created_by: string | null;
          current_uses: number | null;
          description: string | null;
          discount_type: string;
          discount_value: number;
          ends_at: string;
          id: string;
          is_featured: boolean | null;
          max_uses: number | null;
          max_uses_per_customer: number | null;
          name: string;
          show_countdown: boolean | null;
          site_id: string;
          slug: string;
          starts_at: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          badge_text?: string | null;
          banner_image?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_uses?: number | null;
          description?: string | null;
          discount_type: string;
          discount_value: number;
          ends_at: string;
          id?: string;
          is_featured?: boolean | null;
          max_uses?: number | null;
          max_uses_per_customer?: number | null;
          name: string;
          show_countdown?: boolean | null;
          site_id: string;
          slug: string;
          starts_at: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          badge_text?: string | null;
          banner_image?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          current_uses?: number | null;
          description?: string | null;
          discount_type?: string;
          discount_value?: number;
          ends_at?: string;
          id?: string;
          is_featured?: boolean | null;
          max_uses?: number | null;
          max_uses_per_customer?: number | null;
          name?: string;
          show_countdown?: boolean | null;
          site_id?: string;
          slug?: string;
          starts_at?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_flash_sales_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_gift_card_transactions: {
        Row: {
          amount: number;
          balance_after: number;
          created_at: string | null;
          gift_card_id: string;
          id: string;
          notes: string | null;
          order_id: string | null;
          performed_by: string | null;
          type: string;
        };
        Insert: {
          amount: number;
          balance_after: number;
          created_at?: string | null;
          gift_card_id: string;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          performed_by?: string | null;
          type: string;
        };
        Update: {
          amount?: number;
          balance_after?: number;
          created_at?: string | null;
          gift_card_id?: string;
          id?: string;
          notes?: string | null;
          order_id?: string | null;
          performed_by?: string | null;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_gift_card_transactions_gift_card_id_fkey";
            columns: ["gift_card_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_gift_cards";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_gift_cards: {
        Row: {
          code: string;
          created_at: string | null;
          currency: string | null;
          current_balance: number;
          current_uses: number | null;
          delivered_at: string | null;
          delivery_method: string | null;
          expires_at: string | null;
          id: string;
          initial_balance: number;
          is_active: boolean | null;
          max_uses: number | null;
          minimum_order: number | null;
          order_id: string | null;
          personal_message: string | null;
          pin: string | null;
          purchased_by: string | null;
          recipient_email: string | null;
          recipient_name: string | null;
          sender_email: string | null;
          sender_name: string | null;
          site_id: string;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          code: string;
          created_at?: string | null;
          currency?: string | null;
          current_balance: number;
          current_uses?: number | null;
          delivered_at?: string | null;
          delivery_method?: string | null;
          expires_at?: string | null;
          id?: string;
          initial_balance: number;
          is_active?: boolean | null;
          max_uses?: number | null;
          minimum_order?: number | null;
          order_id?: string | null;
          personal_message?: string | null;
          pin?: string | null;
          purchased_by?: string | null;
          recipient_email?: string | null;
          recipient_name?: string | null;
          sender_email?: string | null;
          sender_name?: string | null;
          site_id: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          code?: string;
          created_at?: string | null;
          currency?: string | null;
          current_balance?: number;
          current_uses?: number | null;
          delivered_at?: string | null;
          delivery_method?: string | null;
          expires_at?: string | null;
          id?: string;
          initial_balance?: number;
          is_active?: boolean | null;
          max_uses?: number | null;
          minimum_order?: number | null;
          order_id?: string | null;
          personal_message?: string | null;
          pin?: string | null;
          purchased_by?: string | null;
          recipient_email?: string | null;
          recipient_name?: string | null;
          sender_email?: string | null;
          sender_name?: string | null;
          site_id?: string;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_gift_cards_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_integration_logs: {
        Row: {
          action: string;
          created_at: string | null;
          direction: string;
          duration_ms: number | null;
          error_message: string | null;
          id: string;
          integration_id: string;
          request_data: Json | null;
          response_data: Json | null;
          status: string;
        };
        Insert: {
          action: string;
          created_at?: string | null;
          direction: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          integration_id: string;
          request_data?: Json | null;
          response_data?: Json | null;
          status: string;
        };
        Update: {
          action?: string;
          created_at?: string | null;
          direction?: string;
          duration_ms?: number | null;
          error_message?: string | null;
          id?: string;
          integration_id?: string;
          request_data?: Json | null;
          response_data?: Json | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_integration_logs_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_integrations: {
        Row: {
          category: string;
          config: Json;
          created_at: string | null;
          credentials: Json;
          features: Json | null;
          id: string;
          is_active: boolean | null;
          is_test_mode: boolean | null;
          last_error: string | null;
          last_sync_at: string | null;
          name: string;
          provider: string;
          site_id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          category: string;
          config?: Json;
          created_at?: string | null;
          credentials?: Json;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_test_mode?: boolean | null;
          last_error?: string | null;
          last_sync_at?: string | null;
          name: string;
          provider: string;
          site_id: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          category?: string;
          config?: Json;
          created_at?: string | null;
          credentials?: Json;
          features?: Json | null;
          id?: string;
          is_active?: boolean | null;
          is_test_mode?: boolean | null;
          last_error?: string | null;
          last_sync_at?: string | null;
          name?: string;
          provider?: string;
          site_id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_integrations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_inventory_locations: {
        Row: {
          address_line_1: string | null;
          address_line_2: string | null;
          city: string | null;
          code: string | null;
          contact_email: string | null;
          contact_name: string | null;
          contact_phone: string | null;
          country: string | null;
          created_at: string | null;
          fulfillment_priority: number | null;
          id: string;
          is_active: boolean | null;
          is_default: boolean | null;
          name: string;
          postal_code: string | null;
          site_id: string;
          state: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          code?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string | null;
          fulfillment_priority?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name: string;
          postal_code?: string | null;
          site_id: string;
          state?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address_line_1?: string | null;
          address_line_2?: string | null;
          city?: string | null;
          code?: string | null;
          contact_email?: string | null;
          contact_name?: string | null;
          contact_phone?: string | null;
          country?: string | null;
          created_at?: string | null;
          fulfillment_priority?: number | null;
          id?: string;
          is_active?: boolean | null;
          is_default?: boolean | null;
          name?: string;
          postal_code?: string | null;
          site_id?: string;
          state?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_inventory_locations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_inventory_movements: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          id: string;
          location_id: string | null;
          new_stock: number;
          previous_stock: number;
          product_id: string;
          quantity: number;
          reason: string | null;
          reference_id: string | null;
          reference_type: string | null;
          site_id: string;
          type: string;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          location_id?: string | null;
          new_stock: number;
          previous_stock: number;
          product_id: string;
          quantity: number;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          site_id: string;
          type: string;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          location_id?: string | null;
          new_stock?: number;
          previous_stock?: number;
          product_id?: string;
          quantity?: number;
          reason?: string | null;
          reference_id?: string | null;
          reference_type?: string | null;
          site_id?: string;
          type?: string;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_inventory_movements_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_inventory_movements_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_inventory_movements_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_location_stock: {
        Row: {
          available_quantity: number | null;
          bin_location: string | null;
          id: string;
          location_id: string;
          product_id: string;
          quantity: number;
          reorder_point: number | null;
          reserved_quantity: number;
          site_id: string;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          available_quantity?: number | null;
          bin_location?: string | null;
          id?: string;
          location_id: string;
          product_id: string;
          quantity?: number;
          reorder_point?: number | null;
          reserved_quantity?: number;
          site_id: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          available_quantity?: number | null;
          bin_location?: string | null;
          id?: string;
          location_id?: string;
          product_id?: string;
          quantity?: number;
          reorder_point?: number | null;
          reserved_quantity?: number;
          site_id?: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_location_stock_location_id_fkey";
            columns: ["location_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_inventory_locations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_location_stock_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_location_stock_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_location_stock_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_loyalty_config: {
        Row: {
          created_at: string | null;
          enable_tiers: boolean | null;
          id: string;
          is_enabled: boolean | null;
          maximum_redemption_percent: number | null;
          minimum_redemption: number | null;
          points_expire: boolean | null;
          points_expire_months: number | null;
          points_name: string | null;
          points_per_dollar: number | null;
          points_value_cents: number | null;
          program_name: string | null;
          referral_bonus: number | null;
          review_bonus: number | null;
          signup_bonus: number | null;
          site_id: string;
          tiers: Json | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          enable_tiers?: boolean | null;
          id?: string;
          is_enabled?: boolean | null;
          maximum_redemption_percent?: number | null;
          minimum_redemption?: number | null;
          points_expire?: boolean | null;
          points_expire_months?: number | null;
          points_name?: string | null;
          points_per_dollar?: number | null;
          points_value_cents?: number | null;
          program_name?: string | null;
          referral_bonus?: number | null;
          review_bonus?: number | null;
          signup_bonus?: number | null;
          site_id: string;
          tiers?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          enable_tiers?: boolean | null;
          id?: string;
          is_enabled?: boolean | null;
          maximum_redemption_percent?: number | null;
          minimum_redemption?: number | null;
          points_expire?: boolean | null;
          points_expire_months?: number | null;
          points_name?: string | null;
          points_per_dollar?: number | null;
          points_value_cents?: number | null;
          program_name?: string | null;
          referral_bonus?: number | null;
          review_bonus?: number | null;
          signup_bonus?: number | null;
          site_id?: string;
          tiers?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_loyalty_config_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: true;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_loyalty_points: {
        Row: {
          created_at: string | null;
          current_tier: string | null;
          customer_id: string;
          id: string;
          last_earned_at: string | null;
          last_redeemed_at: string | null;
          lifetime_points: number | null;
          points_balance: number | null;
          redeemed_points: number | null;
          site_id: string;
          tier_points: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          current_tier?: string | null;
          customer_id: string;
          id?: string;
          last_earned_at?: string | null;
          last_redeemed_at?: string | null;
          lifetime_points?: number | null;
          points_balance?: number | null;
          redeemed_points?: number | null;
          site_id: string;
          tier_points?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          current_tier?: string | null;
          customer_id?: string;
          id?: string;
          last_earned_at?: string | null;
          last_redeemed_at?: string | null;
          lifetime_points?: number | null;
          points_balance?: number | null;
          redeemed_points?: number | null;
          site_id?: string;
          tier_points?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_loyalty_points_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_loyalty_points_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_loyalty_transactions: {
        Row: {
          balance_after: number;
          created_at: string | null;
          customer_id: string;
          description: string | null;
          expires_at: string | null;
          id: string;
          multiplier: number | null;
          order_id: string | null;
          points: number;
          site_id: string;
          type: string;
        };
        Insert: {
          balance_after: number;
          created_at?: string | null;
          customer_id: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          multiplier?: number | null;
          order_id?: string | null;
          points: number;
          site_id: string;
          type: string;
        };
        Update: {
          balance_after?: number;
          created_at?: string | null;
          customer_id?: string;
          description?: string | null;
          expires_at?: string | null;
          id?: string;
          multiplier?: number | null;
          order_id?: string | null;
          points?: number;
          site_id?: string;
          type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_loyalty_transactions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_loyalty_transactions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_order_items: {
        Row: {
          created_at: string | null;
          fulfilled_quantity: number | null;
          id: string;
          image_url: string | null;
          order_id: string;
          product_id: string | null;
          product_name: string;
          product_sku: string | null;
          quantity: number;
          total_price: number;
          unit_price: number;
          variant_id: string | null;
          variant_options: Json | null;
        };
        Insert: {
          created_at?: string | null;
          fulfilled_quantity?: number | null;
          id?: string;
          image_url?: string | null;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          product_sku?: string | null;
          quantity: number;
          total_price: number;
          unit_price: number;
          variant_id?: string | null;
          variant_options?: Json | null;
        };
        Update: {
          created_at?: string | null;
          fulfilled_quantity?: number | null;
          id?: string;
          image_url?: string | null;
          order_id?: string;
          product_id?: string | null;
          product_name?: string;
          product_sku?: string | null;
          quantity?: number;
          total_price?: number;
          unit_price?: number;
          variant_id?: string | null;
          variant_options?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_order_items_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_order_items_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_order_notes: {
        Row: {
          content: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_internal: boolean | null;
          order_id: string;
        };
        Insert: {
          content: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_internal?: boolean | null;
          order_id: string;
        };
        Update: {
          content?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_internal?: boolean | null;
          order_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_order_notes_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_order_refunds: {
        Row: {
          amount: number;
          created_at: string | null;
          created_by: string | null;
          id: string;
          items: Json | null;
          notes: string | null;
          order_id: string;
          processed_at: string | null;
          processed_by: string | null;
          reason: string;
          refund_method: string;
          status: string | null;
        };
        Insert: {
          amount: number;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          items?: Json | null;
          notes?: string | null;
          order_id: string;
          processed_at?: string | null;
          processed_by?: string | null;
          reason: string;
          refund_method: string;
          status?: string | null;
        };
        Update: {
          amount?: number;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          items?: Json | null;
          notes?: string | null;
          order_id?: string;
          processed_at?: string | null;
          processed_by?: string | null;
          reason?: string;
          refund_method?: string;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_order_refunds_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_order_shipments: {
        Row: {
          carrier: string;
          created_at: string | null;
          delivered_at: string | null;
          id: string;
          metadata: Json | null;
          order_id: string;
          shipped_at: string | null;
          status: string | null;
          tracking_number: string | null;
          tracking_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          carrier: string;
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id: string;
          shipped_at?: string | null;
          status?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          carrier?: string;
          created_at?: string | null;
          delivered_at?: string | null;
          id?: string;
          metadata?: Json | null;
          order_id?: string;
          shipped_at?: string | null;
          status?: string | null;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_order_shipments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_order_timeline: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          event_type: string;
          id: string;
          metadata: Json | null;
          order_id: string;
          title: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          order_id: string;
          title: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          order_id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_order_timeline_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_orders";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_orders: {
        Row: {
          agency_id: string;
          billing_address: Json;
          created_at: string | null;
          currency: string | null;
          customer_email: string;
          customer_id: string | null;
          customer_name: string | null;
          customer_notes: string | null;
          customer_phone: string | null;
          delivered_at: string | null;
          discount_amount: number | null;
          discount_code: string | null;
          discount_type: string | null;
          fulfillment_status: string | null;
          id: string;
          internal_notes: string | null;
          metadata: Json | null;
          order_number: string;
          payment_method: string | null;
          payment_provider: string | null;
          payment_status: string | null;
          payment_transaction_id: string | null;
          shipped_at: string | null;
          shipping_address: Json;
          shipping_amount: number | null;
          shipping_method: string | null;
          site_id: string;
          status: string | null;
          subtotal: number;
          tax_amount: number | null;
          total: number;
          tracking_number: string | null;
          tracking_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          billing_address: Json;
          created_at?: string | null;
          currency?: string | null;
          customer_email: string;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_notes?: string | null;
          customer_phone?: string | null;
          delivered_at?: string | null;
          discount_amount?: number | null;
          discount_code?: string | null;
          discount_type?: string | null;
          fulfillment_status?: string | null;
          id?: string;
          internal_notes?: string | null;
          metadata?: Json | null;
          order_number: string;
          payment_method?: string | null;
          payment_provider?: string | null;
          payment_status?: string | null;
          payment_transaction_id?: string | null;
          shipped_at?: string | null;
          shipping_address: Json;
          shipping_amount?: number | null;
          shipping_method?: string | null;
          site_id: string;
          status?: string | null;
          subtotal: number;
          tax_amount?: number | null;
          total: number;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          billing_address?: Json;
          created_at?: string | null;
          currency?: string | null;
          customer_email?: string;
          customer_id?: string | null;
          customer_name?: string | null;
          customer_notes?: string | null;
          customer_phone?: string | null;
          delivered_at?: string | null;
          discount_amount?: number | null;
          discount_code?: string | null;
          discount_type?: string | null;
          fulfillment_status?: string | null;
          id?: string;
          internal_notes?: string | null;
          metadata?: Json | null;
          order_number?: string;
          payment_method?: string | null;
          payment_provider?: string | null;
          payment_status?: string | null;
          payment_transaction_id?: string | null;
          shipped_at?: string | null;
          shipping_address?: Json;
          shipping_amount?: number | null;
          shipping_method?: string | null;
          site_id?: string;
          status?: string | null;
          subtotal?: number;
          tax_amount?: number | null;
          total?: number;
          tracking_number?: string | null;
          tracking_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_orders_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_orders_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_product_categories: {
        Row: {
          category_id: string;
          id: string;
          product_id: string;
          sort_order: number | null;
        };
        Insert: {
          category_id: string;
          id?: string;
          product_id: string;
          sort_order?: number | null;
        };
        Update: {
          category_id?: string;
          id?: string;
          product_id?: string;
          sort_order?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_product_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_product_options: {
        Row: {
          id: string;
          name: string;
          product_id: string;
          sort_order: number | null;
          values: Json;
        };
        Insert: {
          id?: string;
          name: string;
          product_id: string;
          sort_order?: number | null;
          values: Json;
        };
        Update: {
          id?: string;
          name?: string;
          product_id?: string;
          sort_order?: number | null;
          values?: Json;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_product_options_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_product_variants: {
        Row: {
          barcode: string | null;
          compare_at_price: number | null;
          created_at: string | null;
          id: string;
          image_url: string | null;
          is_active: boolean | null;
          options: Json;
          price: number | null;
          product_id: string;
          quantity: number | null;
          sku: string | null;
        };
        Insert: {
          barcode?: string | null;
          compare_at_price?: number | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          options?: Json;
          price?: number | null;
          product_id: string;
          quantity?: number | null;
          sku?: string | null;
        };
        Update: {
          barcode?: string | null;
          compare_at_price?: number | null;
          created_at?: string | null;
          id?: string;
          image_url?: string | null;
          is_active?: boolean | null;
          options?: Json;
          price?: number | null;
          product_id?: string;
          quantity?: number | null;
          sku?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_product_variants_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_products: {
        Row: {
          agency_id: string;
          average_rating: number | null;
          barcode: string | null;
          base_price: number;
          compare_at_price: number | null;
          cost_price: number | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          images: Json | null;
          is_featured: boolean | null;
          is_taxable: boolean | null;
          low_stock_threshold: number | null;
          metadata: Json | null;
          name: string;
          quantity: number | null;
          review_count: number | null;
          seo_description: string | null;
          seo_title: string | null;
          short_description: string | null;
          site_id: string;
          sku: string | null;
          slug: string;
          status: string | null;
          tax_class: string | null;
          track_inventory: boolean | null;
          updated_at: string | null;
          weight: number | null;
          weight_unit: string | null;
        };
        Insert: {
          agency_id: string;
          average_rating?: number | null;
          barcode?: string | null;
          base_price: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          images?: Json | null;
          is_featured?: boolean | null;
          is_taxable?: boolean | null;
          low_stock_threshold?: number | null;
          metadata?: Json | null;
          name: string;
          quantity?: number | null;
          review_count?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          site_id: string;
          sku?: string | null;
          slug: string;
          status?: string | null;
          tax_class?: string | null;
          track_inventory?: boolean | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
        };
        Update: {
          agency_id?: string;
          average_rating?: number | null;
          barcode?: string | null;
          base_price?: number;
          compare_at_price?: number | null;
          cost_price?: number | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          images?: Json | null;
          is_featured?: boolean | null;
          is_taxable?: boolean | null;
          low_stock_threshold?: number | null;
          metadata?: Json | null;
          name?: string;
          quantity?: number | null;
          review_count?: number | null;
          seo_description?: string | null;
          seo_title?: string | null;
          short_description?: string | null;
          site_id?: string;
          sku?: string | null;
          slug?: string;
          status?: string | null;
          tax_class?: string | null;
          track_inventory?: boolean | null;
          updated_at?: string | null;
          weight?: number | null;
          weight_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_products_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_products_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_quote_activities: {
        Row: {
          activity_type: string;
          created_at: string | null;
          description: string;
          id: string;
          ip_address: string | null;
          metadata: Json | null;
          new_value: Json | null;
          old_value: Json | null;
          performed_by: string | null;
          performed_by_name: string | null;
          quote_id: string;
          user_agent: string | null;
        };
        Insert: {
          activity_type: string;
          created_at?: string | null;
          description: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_value?: Json | null;
          old_value?: Json | null;
          performed_by?: string | null;
          performed_by_name?: string | null;
          quote_id: string;
          user_agent?: string | null;
        };
        Update: {
          activity_type?: string;
          created_at?: string | null;
          description?: string;
          id?: string;
          ip_address?: string | null;
          metadata?: Json | null;
          new_value?: Json | null;
          old_value?: Json | null;
          performed_by?: string | null;
          performed_by_name?: string | null;
          quote_id?: string;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_quote_activities_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_quote_items: {
        Row: {
          created_at: string | null;
          description: string | null;
          discount_percent: number | null;
          id: string;
          image_url: string | null;
          line_total: number;
          name: string;
          options: Json | null;
          product_id: string | null;
          quantity: number;
          quote_id: string;
          sku: string | null;
          sort_order: number | null;
          tax_rate: number | null;
          unit_price: number;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          discount_percent?: number | null;
          id?: string;
          image_url?: string | null;
          line_total: number;
          name: string;
          options?: Json | null;
          product_id?: string | null;
          quantity?: number;
          quote_id: string;
          sku?: string | null;
          sort_order?: number | null;
          tax_rate?: number | null;
          unit_price: number;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          discount_percent?: number | null;
          id?: string;
          image_url?: string | null;
          line_total?: number;
          name?: string;
          options?: Json | null;
          product_id?: string | null;
          quantity?: number;
          quote_id?: string;
          sku?: string | null;
          sort_order?: number | null;
          tax_rate?: number | null;
          unit_price?: number;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_quote_items_quote_id_fkey";
            columns: ["quote_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_quotes";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_quote_settings: {
        Row: {
          admin_notification_email: string | null;
          agency_id: string | null;
          auto_expire_enabled: boolean | null;
          auto_reminder_enabled: boolean | null;
          cc_email_on_send: string | null;
          company_address: string | null;
          company_email: string | null;
          company_name: string | null;
          company_phone: string | null;
          created_at: string | null;
          default_currency: string | null;
          default_footer: string | null;
          default_introduction: string | null;
          default_tax_rate: number | null;
          default_terms: string | null;
          default_validity_days: number | null;
          id: string;
          logo_url: string | null;
          max_reminders: number | null;
          next_quote_number: number | null;
          pdf_bank_details: string | null;
          pdf_header_color: string | null;
          pdf_logo_url: string | null;
          pdf_show_bank_details: boolean | null;
          primary_color: string | null;
          quote_number_counter: number | null;
          quote_number_format: string | null;
          quote_number_padding: number | null;
          quote_number_prefix: string | null;
          reminder_days_before: number | null;
          reminder_days_before_expiry: number | null;
          reminder_enabled: boolean | null;
          send_acceptance_notification: boolean | null;
          send_copy_to_admin: boolean | null;
          send_rejection_notification: boolean | null;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          admin_notification_email?: string | null;
          agency_id?: string | null;
          auto_expire_enabled?: boolean | null;
          auto_reminder_enabled?: boolean | null;
          cc_email_on_send?: string | null;
          company_address?: string | null;
          company_email?: string | null;
          company_name?: string | null;
          company_phone?: string | null;
          created_at?: string | null;
          default_currency?: string | null;
          default_footer?: string | null;
          default_introduction?: string | null;
          default_tax_rate?: number | null;
          default_terms?: string | null;
          default_validity_days?: number | null;
          id?: string;
          logo_url?: string | null;
          max_reminders?: number | null;
          next_quote_number?: number | null;
          pdf_bank_details?: string | null;
          pdf_header_color?: string | null;
          pdf_logo_url?: string | null;
          pdf_show_bank_details?: boolean | null;
          primary_color?: string | null;
          quote_number_counter?: number | null;
          quote_number_format?: string | null;
          quote_number_padding?: number | null;
          quote_number_prefix?: string | null;
          reminder_days_before?: number | null;
          reminder_days_before_expiry?: number | null;
          reminder_enabled?: boolean | null;
          send_acceptance_notification?: boolean | null;
          send_copy_to_admin?: boolean | null;
          send_rejection_notification?: boolean | null;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          admin_notification_email?: string | null;
          agency_id?: string | null;
          auto_expire_enabled?: boolean | null;
          auto_reminder_enabled?: boolean | null;
          cc_email_on_send?: string | null;
          company_address?: string | null;
          company_email?: string | null;
          company_name?: string | null;
          company_phone?: string | null;
          created_at?: string | null;
          default_currency?: string | null;
          default_footer?: string | null;
          default_introduction?: string | null;
          default_tax_rate?: number | null;
          default_terms?: string | null;
          default_validity_days?: number | null;
          id?: string;
          logo_url?: string | null;
          max_reminders?: number | null;
          next_quote_number?: number | null;
          pdf_bank_details?: string | null;
          pdf_header_color?: string | null;
          pdf_logo_url?: string | null;
          pdf_show_bank_details?: boolean | null;
          primary_color?: string | null;
          quote_number_counter?: number | null;
          quote_number_format?: string | null;
          quote_number_padding?: number | null;
          quote_number_prefix?: string | null;
          reminder_days_before?: number | null;
          reminder_days_before_expiry?: number | null;
          reminder_enabled?: boolean | null;
          send_acceptance_notification?: boolean | null;
          send_copy_to_admin?: boolean | null;
          send_rejection_notification?: boolean | null;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_quote_settings_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_quote_settings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: true;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_quote_templates: {
        Row: {
          agency_id: string;
          created_at: string | null;
          created_by: string | null;
          currency: string | null;
          default_discount_type: string | null;
          default_discount_value: number | null;
          default_introduction: string | null;
          default_items: Json | null;
          default_notes: string | null;
          default_tax_rate: number | null;
          default_terms: string | null;
          default_title: string | null;
          default_validity_days: number | null;
          description: string | null;
          id: string;
          introduction_template: string | null;
          is_active: boolean | null;
          is_default: boolean | null;
          items: Json | null;
          last_used_at: string | null;
          name: string;
          notes_template: string | null;
          primary_color: string | null;
          show_company_logo: boolean | null;
          site_id: string;
          terms_and_conditions: string | null;
          title_template: string | null;
          updated_at: string | null;
          usage_count: number | null;
          use_count: number | null;
        };
        Insert: {
          agency_id: string;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          default_discount_type?: string | null;
          default_discount_value?: number | null;
          default_introduction?: string | null;
          default_items?: Json | null;
          default_notes?: string | null;
          default_tax_rate?: number | null;
          default_terms?: string | null;
          default_title?: string | null;
          default_validity_days?: number | null;
          description?: string | null;
          id?: string;
          introduction_template?: string | null;
          is_active?: boolean | null;
          is_default?: boolean | null;
          items?: Json | null;
          last_used_at?: string | null;
          name: string;
          notes_template?: string | null;
          primary_color?: string | null;
          show_company_logo?: boolean | null;
          site_id: string;
          terms_and_conditions?: string | null;
          title_template?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          use_count?: number | null;
        };
        Update: {
          agency_id?: string;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string | null;
          default_discount_type?: string | null;
          default_discount_value?: number | null;
          default_introduction?: string | null;
          default_items?: Json | null;
          default_notes?: string | null;
          default_tax_rate?: number | null;
          default_terms?: string | null;
          default_title?: string | null;
          default_validity_days?: number | null;
          description?: string | null;
          id?: string;
          introduction_template?: string | null;
          is_active?: boolean | null;
          is_default?: boolean | null;
          items?: Json | null;
          last_used_at?: string | null;
          name?: string;
          notes_template?: string | null;
          primary_color?: string | null;
          show_company_logo?: boolean | null;
          site_id?: string;
          terms_and_conditions?: string | null;
          title_template?: string | null;
          updated_at?: string | null;
          usage_count?: number | null;
          use_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_quote_templates_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_quote_templates_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_quotes: {
        Row: {
          access_token: string;
          agency_id: string;
          billing_address: Json | null;
          converted_at: string | null;
          converted_to_order_id: string | null;
          created_at: string | null;
          created_by: string | null;
          currency: string;
          customer_company: string | null;
          customer_email: string;
          customer_id: string | null;
          customer_name: string;
          customer_phone: string | null;
          discount_amount: number | null;
          discount_type: string | null;
          discount_value: number | null;
          first_viewed_at: string | null;
          id: string;
          internal_notes: string | null;
          introduction: string | null;
          last_modified_by: string | null;
          last_reminder_at: string | null;
          metadata: Json | null;
          notes_to_customer: string | null;
          quote_number: string;
          reference_number: string | null;
          reminder_count: number | null;
          responded_at: string | null;
          response_notes: string | null;
          sent_at: string | null;
          shipping_address: Json | null;
          shipping_amount: number | null;
          site_id: string;
          status: string;
          subtotal: number;
          tax_amount: number | null;
          tax_rate: number | null;
          template_id: string | null;
          terms_and_conditions: string | null;
          title: string | null;
          total: number;
          updated_at: string | null;
          valid_from: string | null;
          valid_until: string | null;
          view_count: number | null;
          viewed_at: string | null;
        };
        Insert: {
          access_token?: string;
          agency_id: string;
          billing_address?: Json | null;
          converted_at?: string | null;
          converted_to_order_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          customer_company?: string | null;
          customer_email: string;
          customer_id?: string | null;
          customer_name: string;
          customer_phone?: string | null;
          discount_amount?: number | null;
          discount_type?: string | null;
          discount_value?: number | null;
          first_viewed_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          introduction?: string | null;
          last_modified_by?: string | null;
          last_reminder_at?: string | null;
          metadata?: Json | null;
          notes_to_customer?: string | null;
          quote_number: string;
          reference_number?: string | null;
          reminder_count?: number | null;
          responded_at?: string | null;
          response_notes?: string | null;
          sent_at?: string | null;
          shipping_address?: Json | null;
          shipping_amount?: number | null;
          site_id: string;
          status?: string;
          subtotal?: number;
          tax_amount?: number | null;
          tax_rate?: number | null;
          template_id?: string | null;
          terms_and_conditions?: string | null;
          title?: string | null;
          total?: number;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          view_count?: number | null;
          viewed_at?: string | null;
        };
        Update: {
          access_token?: string;
          agency_id?: string;
          billing_address?: Json | null;
          converted_at?: string | null;
          converted_to_order_id?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          currency?: string;
          customer_company?: string | null;
          customer_email?: string;
          customer_id?: string | null;
          customer_name?: string;
          customer_phone?: string | null;
          discount_amount?: number | null;
          discount_type?: string | null;
          discount_value?: number | null;
          first_viewed_at?: string | null;
          id?: string;
          internal_notes?: string | null;
          introduction?: string | null;
          last_modified_by?: string | null;
          last_reminder_at?: string | null;
          metadata?: Json | null;
          notes_to_customer?: string | null;
          quote_number?: string;
          reference_number?: string | null;
          reminder_count?: number | null;
          responded_at?: string | null;
          response_notes?: string | null;
          sent_at?: string | null;
          shipping_address?: Json | null;
          shipping_amount?: number | null;
          site_id?: string;
          status?: string;
          subtotal?: number;
          tax_amount?: number | null;
          tax_rate?: number | null;
          template_id?: string | null;
          terms_and_conditions?: string | null;
          title?: string | null;
          total?: number;
          updated_at?: string | null;
          valid_from?: string | null;
          valid_until?: string | null;
          view_count?: number | null;
          viewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_quotes_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_quotes_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_report_history: {
        Row: {
          config: Json;
          executed_at: string | null;
          executed_by: string | null;
          execution_time_ms: number | null;
          exported_at: string | null;
          exported_format: string | null;
          id: string;
          report_id: string | null;
          report_type: string;
          result_data: Json | null;
          result_summary: string | null;
          row_count: number | null;
          site_id: string;
        };
        Insert: {
          config: Json;
          executed_at?: string | null;
          executed_by?: string | null;
          execution_time_ms?: number | null;
          exported_at?: string | null;
          exported_format?: string | null;
          id?: string;
          report_id?: string | null;
          report_type: string;
          result_data?: Json | null;
          result_summary?: string | null;
          row_count?: number | null;
          site_id: string;
        };
        Update: {
          config?: Json;
          executed_at?: string | null;
          executed_by?: string | null;
          execution_time_ms?: number | null;
          exported_at?: string | null;
          exported_format?: string | null;
          id?: string;
          report_id?: string | null;
          report_type?: string;
          result_data?: Json | null;
          result_summary?: string | null;
          row_count?: number | null;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_report_history_report_id_fkey";
            columns: ["report_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_saved_reports";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_report_history_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_reviews: {
        Row: {
          admin_response: string | null;
          admin_response_at: string | null;
          body: string | null;
          created_at: string | null;
          helpful_count: number | null;
          id: string;
          product_id: string;
          rating: number;
          reviewer_email: string | null;
          reviewer_name: string;
          site_id: string;
          status: string;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
          verified_purchase: boolean | null;
        };
        Insert: {
          admin_response?: string | null;
          admin_response_at?: string | null;
          body?: string | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          product_id: string;
          rating: number;
          reviewer_email?: string | null;
          reviewer_name: string;
          site_id: string;
          status?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          verified_purchase?: boolean | null;
        };
        Update: {
          admin_response?: string | null;
          admin_response_at?: string | null;
          body?: string | null;
          created_at?: string | null;
          helpful_count?: number | null;
          id?: string;
          product_id?: string;
          rating?: number;
          reviewer_email?: string | null;
          reviewer_name?: string;
          site_id?: string;
          status?: string;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          verified_purchase?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_reviews_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_saved_reports: {
        Row: {
          config: Json;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_favorite: boolean | null;
          is_scheduled: boolean | null;
          last_run_at: string | null;
          name: string;
          report_type: string;
          schedule_config: Json | null;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          config?: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_scheduled?: boolean | null;
          last_run_at?: string | null;
          name: string;
          report_type: string;
          schedule_config?: Json | null;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          config?: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_favorite?: boolean | null;
          is_scheduled?: boolean | null;
          last_run_at?: string | null;
          name?: string;
          report_type?: string;
          schedule_config?: Json | null;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_saved_reports_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_settings: {
        Row: {
          agency_id: string;
          checkout_settings: Json | null;
          continue_selling_when_out_of_stock: boolean | null;
          created_at: string | null;
          currency: string | null;
          currency_settings: Json | null;
          dpo_config: Json | null;
          enable_guest_checkout: boolean | null;
          flutterwave_config: Json | null;
          free_shipping_threshold: number | null;
          general_settings: Json | null;
          id: string;
          inventory_settings: Json | null;
          legal_settings: Json | null;
          manual_payment_instructions: string | null;
          notification_settings: Json | null;
          order_notification_email: string | null;
          paddle_config: Json | null;
          payment_provider: string | null;
          payment_settings: Json | null;
          pesapal_config: Json | null;
          quotation_button_label: string | null;
          quotation_hide_prices: boolean;
          quotation_mode_enabled: boolean;
          quotation_redirect_url: string | null;
          require_phone: boolean | null;
          send_order_confirmation: boolean | null;
          shipping_settings: Json | null;
          shipping_zones: Json | null;
          site_id: string;
          store_address: Json | null;
          store_email: string | null;
          store_name: string | null;
          store_phone: string | null;
          store_url: string | null;
          tax_included_in_price: boolean | null;
          tax_rate: number | null;
          tax_settings: Json | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          checkout_settings?: Json | null;
          continue_selling_when_out_of_stock?: boolean | null;
          created_at?: string | null;
          currency?: string | null;
          currency_settings?: Json | null;
          dpo_config?: Json | null;
          enable_guest_checkout?: boolean | null;
          flutterwave_config?: Json | null;
          free_shipping_threshold?: number | null;
          general_settings?: Json | null;
          id?: string;
          inventory_settings?: Json | null;
          legal_settings?: Json | null;
          manual_payment_instructions?: string | null;
          notification_settings?: Json | null;
          order_notification_email?: string | null;
          paddle_config?: Json | null;
          payment_provider?: string | null;
          payment_settings?: Json | null;
          pesapal_config?: Json | null;
          quotation_button_label?: string | null;
          quotation_hide_prices?: boolean;
          quotation_mode_enabled?: boolean;
          quotation_redirect_url?: string | null;
          require_phone?: boolean | null;
          send_order_confirmation?: boolean | null;
          shipping_settings?: Json | null;
          shipping_zones?: Json | null;
          site_id: string;
          store_address?: Json | null;
          store_email?: string | null;
          store_name?: string | null;
          store_phone?: string | null;
          store_url?: string | null;
          tax_included_in_price?: boolean | null;
          tax_rate?: number | null;
          tax_settings?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          checkout_settings?: Json | null;
          continue_selling_when_out_of_stock?: boolean | null;
          created_at?: string | null;
          currency?: string | null;
          currency_settings?: Json | null;
          dpo_config?: Json | null;
          enable_guest_checkout?: boolean | null;
          flutterwave_config?: Json | null;
          free_shipping_threshold?: number | null;
          general_settings?: Json | null;
          id?: string;
          inventory_settings?: Json | null;
          legal_settings?: Json | null;
          manual_payment_instructions?: string | null;
          notification_settings?: Json | null;
          order_notification_email?: string | null;
          paddle_config?: Json | null;
          payment_provider?: string | null;
          payment_settings?: Json | null;
          pesapal_config?: Json | null;
          quotation_button_label?: string | null;
          quotation_hide_prices?: boolean;
          quotation_mode_enabled?: boolean;
          quotation_redirect_url?: string | null;
          require_phone?: boolean | null;
          send_order_confirmation?: boolean | null;
          shipping_settings?: Json | null;
          shipping_zones?: Json | null;
          site_id?: string;
          store_address?: Json | null;
          store_email?: string | null;
          store_name?: string | null;
          store_phone?: string | null;
          store_url?: string | null;
          tax_included_in_price?: boolean | null;
          tax_rate?: number | null;
          tax_settings?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_settings_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_settings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: true;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_stock_alerts: {
        Row: {
          alert_dismissed_at: string | null;
          created_at: string | null;
          critical_stock_threshold: number;
          current_alert_level: string | null;
          dismissed_by: string | null;
          id: string;
          is_active: boolean | null;
          last_alerted_at: string | null;
          low_stock_threshold: number;
          notify_dashboard: boolean | null;
          notify_email: boolean | null;
          notify_webhook: boolean | null;
          out_of_stock_threshold: number;
          product_id: string | null;
          reorder_point: number | null;
          reorder_quantity: number | null;
          site_id: string;
          updated_at: string | null;
          variant_id: string | null;
        };
        Insert: {
          alert_dismissed_at?: string | null;
          created_at?: string | null;
          critical_stock_threshold?: number;
          current_alert_level?: string | null;
          dismissed_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_alerted_at?: string | null;
          low_stock_threshold?: number;
          notify_dashboard?: boolean | null;
          notify_email?: boolean | null;
          notify_webhook?: boolean | null;
          out_of_stock_threshold?: number;
          product_id?: string | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          site_id: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Update: {
          alert_dismissed_at?: string | null;
          created_at?: string | null;
          critical_stock_threshold?: number;
          current_alert_level?: string | null;
          dismissed_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_alerted_at?: string | null;
          low_stock_threshold?: number;
          notify_dashboard?: boolean | null;
          notify_email?: boolean | null;
          notify_webhook?: boolean | null;
          out_of_stock_threshold?: number;
          product_id?: string | null;
          reorder_point?: number | null;
          reorder_quantity?: number | null;
          site_id?: string;
          updated_at?: string | null;
          variant_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_stock_alerts_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_stock_alerts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "mod_ecommod01_stock_alerts_variant_id_fkey";
            columns: ["variant_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_product_variants";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_sync_jobs: {
        Row: {
          created_at: string | null;
          failed_items: number | null;
          id: string;
          integration_id: string;
          job_type: string;
          last_error: string | null;
          last_result: Json | null;
          last_run_at: string | null;
          next_run_at: string | null;
          processed_items: number | null;
          schedule: Json | null;
          status: string | null;
          total_items: number | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          failed_items?: number | null;
          id?: string;
          integration_id: string;
          job_type: string;
          last_error?: string | null;
          last_result?: Json | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          processed_items?: number | null;
          schedule?: Json | null;
          status?: string | null;
          total_items?: number | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          failed_items?: number | null;
          id?: string;
          integration_id?: string;
          job_type?: string;
          last_error?: string | null;
          last_result?: Json | null;
          last_run_at?: string | null;
          next_run_at?: string | null;
          processed_items?: number | null;
          schedule?: Json | null;
          status?: string | null;
          total_items?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_sync_jobs_integration_id_fkey";
            columns: ["integration_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_integrations";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_webhook_deliveries: {
        Row: {
          attempt_number: number | null;
          created_at: string | null;
          delivered_at: string | null;
          endpoint_id: string;
          error_message: string | null;
          event_id: string;
          event_type: string;
          id: string;
          next_retry_at: string | null;
          payload: Json;
          response_body: string | null;
          response_headers: Json | null;
          response_status: number | null;
          response_time_ms: number | null;
          scheduled_at: string | null;
          status: string;
        };
        Insert: {
          attempt_number?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          endpoint_id: string;
          error_message?: string | null;
          event_id: string;
          event_type: string;
          id?: string;
          next_retry_at?: string | null;
          payload: Json;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          response_time_ms?: number | null;
          scheduled_at?: string | null;
          status?: string;
        };
        Update: {
          attempt_number?: number | null;
          created_at?: string | null;
          delivered_at?: string | null;
          endpoint_id?: string;
          error_message?: string | null;
          event_id?: string;
          event_type?: string;
          id?: string;
          next_retry_at?: string | null;
          payload?: Json;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          response_time_ms?: number | null;
          scheduled_at?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_webhook_deliveries_endpoint_id_fkey";
            columns: ["endpoint_id"];
            isOneToOne: false;
            referencedRelation: "mod_ecommod01_webhook_endpoints";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_webhook_endpoints: {
        Row: {
          active: boolean | null;
          consecutive_failures: number | null;
          created_at: string | null;
          custom_headers: Json | null;
          description: string | null;
          events: Json;
          id: string;
          last_failure_at: string | null;
          last_success_at: string | null;
          last_triggered_at: string | null;
          max_retries: number | null;
          name: string;
          retry_delay_seconds: number | null;
          secret: string;
          secret_version: number | null;
          site_id: string;
          timeout_seconds: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          active?: boolean | null;
          consecutive_failures?: number | null;
          created_at?: string | null;
          custom_headers?: Json | null;
          description?: string | null;
          events?: Json;
          id?: string;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          last_triggered_at?: string | null;
          max_retries?: number | null;
          name: string;
          retry_delay_seconds?: number | null;
          secret: string;
          secret_version?: number | null;
          site_id: string;
          timeout_seconds?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          active?: boolean | null;
          consecutive_failures?: number | null;
          created_at?: string | null;
          custom_headers?: Json | null;
          description?: string | null;
          events?: Json;
          id?: string;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          last_triggered_at?: string | null;
          max_retries?: number | null;
          name?: string;
          retry_delay_seconds?: number | null;
          secret?: string;
          secret_version?: number | null;
          site_id?: string;
          timeout_seconds?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "mod_ecommod01_webhook_endpoints_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      mod_ecommod01_webhook_event_types: {
        Row: {
          category: string;
          created_at: string | null;
          description: string | null;
          event_type: string;
          id: string;
          is_active: boolean | null;
          name: string;
          payload_schema: Json | null;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          description?: string | null;
          event_type: string;
          id?: string;
          is_active?: boolean | null;
          name: string;
          payload_schema?: Json | null;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          description?: string | null;
          event_type?: string;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          payload_schema?: Json | null;
        };
        Relationships: [];
      };
      moderation_reports: {
        Row: {
          created_at: string | null;
          details: string | null;
          id: string;
          reason: string;
          reported_by: string;
          resolution_notes: string | null;
          resolved_at: string | null;
          resolved_by: string | null;
          status: string | null;
          target_id: string;
          type: string;
        };
        Insert: {
          created_at?: string | null;
          details?: string | null;
          id?: string;
          reason: string;
          reported_by: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string | null;
          target_id: string;
          type: string;
        };
        Update: {
          created_at?: string | null;
          details?: string | null;
          id?: string;
          reason?: string;
          reported_by?: string;
          resolution_notes?: string | null;
          resolved_at?: string | null;
          resolved_by?: string | null;
          status?: string | null;
          target_id?: string;
          type?: string;
        };
        Relationships: [];
      };
      module_access_logs: {
        Row: {
          agency_id: string | null;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          operation: string;
          site_id: string | null;
          source_module: string;
          table_name: string;
          target_module: string;
          user_id: string | null;
        };
        Insert: {
          agency_id?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          operation: string;
          site_id?: string | null;
          source_module: string;
          table_name: string;
          target_module: string;
          user_id?: string | null;
        };
        Update: {
          agency_id?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          operation?: string;
          site_id?: string | null;
          source_module?: string;
          table_name?: string;
          target_module?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_access_logs_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_access_logs_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_allowed_domains: {
        Row: {
          allow_api: boolean | null;
          allow_embed: boolean | null;
          created_at: string | null;
          domain: string;
          embed_types: string[] | null;
          id: string;
          module_id: string;
          rate_limit: number | null;
          site_id: string;
          updated_at: string | null;
          verification_token: string | null;
          verified: boolean | null;
          verified_at: string | null;
        };
        Insert: {
          allow_api?: boolean | null;
          allow_embed?: boolean | null;
          created_at?: string | null;
          domain: string;
          embed_types?: string[] | null;
          id?: string;
          module_id: string;
          rate_limit?: number | null;
          site_id: string;
          updated_at?: string | null;
          verification_token?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
        };
        Update: {
          allow_api?: boolean | null;
          allow_embed?: boolean | null;
          created_at?: string | null;
          domain?: string;
          embed_types?: string[] | null;
          id?: string;
          module_id?: string;
          rate_limit?: number | null;
          site_id?: string;
          updated_at?: string | null;
          verification_token?: string | null;
          verified?: boolean | null;
          verified_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_allowed_domains_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_analytics: {
        Row: {
          active_installs: number | null;
          avg_load_time_ms: number | null;
          error_count: number | null;
          id: string;
          module_id: string;
          monthly_revenue_cents: number | null;
          total_installs: number | null;
          total_revenue_cents: number | null;
          uninstalls: number | null;
          updated_at: string | null;
          weekly_installs: number | null;
        };
        Insert: {
          active_installs?: number | null;
          avg_load_time_ms?: number | null;
          error_count?: number | null;
          id?: string;
          module_id: string;
          monthly_revenue_cents?: number | null;
          total_installs?: number | null;
          total_revenue_cents?: number | null;
          uninstalls?: number | null;
          updated_at?: string | null;
          weekly_installs?: number | null;
        };
        Update: {
          active_installs?: number | null;
          avg_load_time_ms?: number | null;
          error_count?: number | null;
          id?: string;
          module_id?: string;
          monthly_revenue_cents?: number | null;
          total_installs?: number | null;
          total_revenue_cents?: number | null;
          uninstalls?: number | null;
          updated_at?: string | null;
          weekly_installs?: number | null;
        };
        Relationships: [];
      };
      module_analytics_daily: {
        Row: {
          active_users: number | null;
          avg_load_time_ms: number | null;
          avg_session_duration_seconds: number | null;
          crash_count: number | null;
          created_at: string | null;
          error_count: number | null;
          events_by_type: Json | null;
          events_total: number | null;
          id: string;
          module_id: string;
          new_installs: number | null;
          new_users: number | null;
          returning_users: number | null;
          revenue_cents: number | null;
          sessions: number | null;
          site_id: string | null;
          stat_date: string;
          uninstalls: number | null;
          unique_visitors: number | null;
          updated_at: string | null;
          views: number | null;
        };
        Insert: {
          active_users?: number | null;
          avg_load_time_ms?: number | null;
          avg_session_duration_seconds?: number | null;
          crash_count?: number | null;
          created_at?: string | null;
          error_count?: number | null;
          events_by_type?: Json | null;
          events_total?: number | null;
          id?: string;
          module_id: string;
          new_installs?: number | null;
          new_users?: number | null;
          returning_users?: number | null;
          revenue_cents?: number | null;
          sessions?: number | null;
          site_id?: string | null;
          stat_date: string;
          uninstalls?: number | null;
          unique_visitors?: number | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Update: {
          active_users?: number | null;
          avg_load_time_ms?: number | null;
          avg_session_duration_seconds?: number | null;
          crash_count?: number | null;
          created_at?: string | null;
          error_count?: number | null;
          events_by_type?: Json | null;
          events_total?: number | null;
          id?: string;
          module_id?: string;
          new_installs?: number | null;
          new_users?: number | null;
          returning_users?: number | null;
          revenue_cents?: number | null;
          sessions?: number | null;
          site_id?: string | null;
          stat_date?: string;
          uninstalls?: number | null;
          unique_visitors?: number | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Relationships: [];
      };
      module_analytics_events: {
        Row: {
          agency_id: string | null;
          country: string | null;
          created_at: string | null;
          device_type: string | null;
          event_date: string | null;
          event_name: string;
          event_type: string;
          id: string;
          ip_hash: string | null;
          module_id: string;
          properties: Json | null;
          session_id: string | null;
          site_id: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          agency_id?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          event_date?: string | null;
          event_name: string;
          event_type: string;
          id?: string;
          ip_hash?: string | null;
          module_id: string;
          properties?: Json | null;
          session_id?: string | null;
          site_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          agency_id?: string | null;
          country?: string | null;
          created_at?: string | null;
          device_type?: string | null;
          event_date?: string | null;
          event_name?: string;
          event_type?: string;
          id?: string;
          ip_hash?: string | null;
          module_id?: string;
          properties?: Json | null;
          session_id?: string | null;
          site_id?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [];
      };
      module_api_consumers: {
        Row: {
          allowed_endpoints: string[] | null;
          allowed_ips: unknown[] | null;
          api_key: string;
          api_secret_hash: string | null;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          last_request_at: string | null;
          metadata: Json | null;
          name: string;
          oauth_client_id: string | null;
          rate_limit_per_day: number | null;
          rate_limit_per_minute: number | null;
          scopes: string[] | null;
          site_module_installation_id: string;
          total_requests: number | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_endpoints?: string[] | null;
          allowed_ips?: unknown[] | null;
          api_key: string;
          api_secret_hash?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_request_at?: string | null;
          metadata?: Json | null;
          name: string;
          oauth_client_id?: string | null;
          rate_limit_per_day?: number | null;
          rate_limit_per_minute?: number | null;
          scopes?: string[] | null;
          site_module_installation_id: string;
          total_requests?: number | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_endpoints?: string[] | null;
          allowed_ips?: unknown[] | null;
          api_key?: string;
          api_secret_hash?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          last_request_at?: string | null;
          metadata?: Json | null;
          name?: string;
          oauth_client_id?: string | null;
          rate_limit_per_day?: number | null;
          rate_limit_per_minute?: number | null;
          scopes?: string[] | null;
          site_module_installation_id?: string;
          total_requests?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_api_consumers_oauth_client_id_fkey";
            columns: ["oauth_client_id"];
            isOneToOne: false;
            referencedRelation: "module_oauth_clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_api_consumers_site_module_installation_id_fkey";
            columns: ["site_module_installation_id"];
            isOneToOne: false;
            referencedRelation: "site_module_installations";
            referencedColumns: ["id"];
          },
        ];
      };
      module_api_endpoints: {
        Row: {
          config: Json | null;
          created_at: string | null;
          description: string | null;
          entity_name: string;
          id: string;
          is_active: boolean | null;
          is_public: boolean | null;
          method: string;
          module_id: string;
          operation: string;
          path: string;
          rate_limit_override: number | null;
          required_scopes: string[] | null;
          summary: string | null;
          updated_at: string | null;
        };
        Insert: {
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          entity_name: string;
          id?: string;
          is_active?: boolean | null;
          is_public?: boolean | null;
          method: string;
          module_id: string;
          operation: string;
          path: string;
          rate_limit_override?: number | null;
          required_scopes?: string[] | null;
          summary?: string | null;
          updated_at?: string | null;
        };
        Update: {
          config?: Json | null;
          created_at?: string | null;
          description?: string | null;
          entity_name?: string;
          id?: string;
          is_active?: boolean | null;
          is_public?: boolean | null;
          method?: string;
          module_id?: string;
          operation?: string;
          path?: string;
          rate_limit_override?: number | null;
          required_scopes?: string[] | null;
          summary?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_api_endpoints_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      module_api_keys: {
        Row: {
          agency_id: string;
          allowed_ips: string[] | null;
          allowed_origins: string[] | null;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at: string | null;
          module_id: string;
          name: string;
          rate_limit_per_day: number | null;
          rate_limit_per_minute: number | null;
          request_count: number | null;
          revoked_at: string | null;
          revoked_by: string | null;
          scopes: string[] | null;
          site_id: string;
        };
        Insert: {
          agency_id: string;
          allowed_ips?: string[] | null;
          allowed_origins?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash: string;
          key_prefix: string;
          last_used_at?: string | null;
          module_id: string;
          name: string;
          rate_limit_per_day?: number | null;
          rate_limit_per_minute?: number | null;
          request_count?: number | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          scopes?: string[] | null;
          site_id: string;
        };
        Update: {
          agency_id?: string;
          allowed_ips?: string[] | null;
          allowed_origins?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          key_hash?: string;
          key_prefix?: string;
          last_used_at?: string | null;
          module_id?: string;
          name?: string;
          rate_limit_per_day?: number | null;
          rate_limit_per_minute?: number | null;
          request_count?: number | null;
          revoked_at?: string | null;
          revoked_by?: string | null;
          scopes?: string[] | null;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_api_keys_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_api_keys_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_api_logs: {
        Row: {
          api_key_id: string | null;
          auth_type: string | null;
          created_at: string | null;
          error_message: string | null;
          id: string;
          ip_address: string | null;
          method: string;
          module_id: string;
          path: string;
          query_params: Json | null;
          response_time_ms: number | null;
          route_id: string | null;
          site_id: string | null;
          status_code: number | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          api_key_id?: string | null;
          auth_type?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          ip_address?: string | null;
          method: string;
          module_id: string;
          path: string;
          query_params?: Json | null;
          response_time_ms?: number | null;
          route_id?: string | null;
          site_id?: string | null;
          status_code?: number | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          api_key_id?: string | null;
          auth_type?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          ip_address?: string | null;
          method?: string;
          module_id?: string;
          path?: string;
          query_params?: Json | null;
          response_time_ms?: number | null;
          route_id?: string | null;
          site_id?: string | null;
          status_code?: number | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_api_logs_api_key_id_fkey";
            columns: ["api_key_id"];
            isOneToOne: false;
            referencedRelation: "module_api_keys";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_api_logs_route_id_fkey";
            columns: ["route_id"];
            isOneToOne: false;
            referencedRelation: "module_api_routes";
            referencedColumns: ["id"];
          },
        ];
      };
      module_api_requests: {
        Row: {
          consumer_id: string | null;
          created_at: string | null;
          error_code: string | null;
          error_message: string | null;
          graphql_operation_name: string | null;
          graphql_operation_type: string | null;
          id: string;
          ip_address: unknown;
          is_graphql: boolean | null;
          method: string;
          path: string;
          query_params: Json | null;
          request_body: Json | null;
          request_headers: Json | null;
          response_size_bytes: number | null;
          response_time_ms: number | null;
          site_module_installation_id: string;
          status_code: number | null;
          user_agent: string | null;
        };
        Insert: {
          consumer_id?: string | null;
          created_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          graphql_operation_name?: string | null;
          graphql_operation_type?: string | null;
          id?: string;
          ip_address?: unknown;
          is_graphql?: boolean | null;
          method: string;
          path: string;
          query_params?: Json | null;
          request_body?: Json | null;
          request_headers?: Json | null;
          response_size_bytes?: number | null;
          response_time_ms?: number | null;
          site_module_installation_id: string;
          status_code?: number | null;
          user_agent?: string | null;
        };
        Update: {
          consumer_id?: string | null;
          created_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          graphql_operation_name?: string | null;
          graphql_operation_type?: string | null;
          id?: string;
          ip_address?: unknown;
          is_graphql?: boolean | null;
          method?: string;
          path?: string;
          query_params?: Json | null;
          request_body?: Json | null;
          request_headers?: Json | null;
          response_size_bytes?: number | null;
          response_time_ms?: number | null;
          site_module_installation_id?: string;
          status_code?: number | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_api_requests_consumer_id_fkey";
            columns: ["consumer_id"];
            isOneToOne: false;
            referencedRelation: "module_api_consumers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_api_requests_site_module_installation_id_fkey";
            columns: ["site_module_installation_id"];
            isOneToOne: false;
            referencedRelation: "site_module_installations";
            referencedColumns: ["id"];
          },
        ];
      };
      module_api_routes: {
        Row: {
          cache_ttl_seconds: number | null;
          created_at: string | null;
          description: string | null;
          handler_code: string | null;
          handler_type: string;
          handler_url: string | null;
          id: string;
          is_active: boolean | null;
          method: string;
          module_id: string;
          path: string;
          rate_limit_per_minute: number | null;
          request_schema: Json | null;
          required_scopes: string[] | null;
          requires_auth: boolean | null;
          response_schema: Json | null;
          summary: string | null;
          updated_at: string | null;
        };
        Insert: {
          cache_ttl_seconds?: number | null;
          created_at?: string | null;
          description?: string | null;
          handler_code?: string | null;
          handler_type?: string;
          handler_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          method: string;
          module_id: string;
          path: string;
          rate_limit_per_minute?: number | null;
          request_schema?: Json | null;
          required_scopes?: string[] | null;
          requires_auth?: boolean | null;
          response_schema?: Json | null;
          summary?: string | null;
          updated_at?: string | null;
        };
        Update: {
          cache_ttl_seconds?: number | null;
          created_at?: string | null;
          description?: string | null;
          handler_code?: string | null;
          handler_type?: string;
          handler_url?: string | null;
          id?: string;
          is_active?: boolean | null;
          method?: string;
          module_id?: string;
          path?: string;
          rate_limit_per_minute?: number | null;
          request_schema?: Json | null;
          required_scopes?: string[] | null;
          requires_auth?: boolean | null;
          response_schema?: Json | null;
          summary?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      module_api_webhook_deliveries: {
        Row: {
          attempt_number: number | null;
          completed_at: string | null;
          created_at: string | null;
          error_message: string | null;
          event: string;
          id: string;
          next_retry_at: string | null;
          payload: Json;
          response_body: string | null;
          response_headers: Json | null;
          response_status_code: number | null;
          response_time_ms: number | null;
          signature: string | null;
          status: string | null;
          webhook_id: string;
        };
        Insert: {
          attempt_number?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          event: string;
          id?: string;
          next_retry_at?: string | null;
          payload: Json;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status_code?: number | null;
          response_time_ms?: number | null;
          signature?: string | null;
          status?: string | null;
          webhook_id: string;
        };
        Update: {
          attempt_number?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          error_message?: string | null;
          event?: string;
          id?: string;
          next_retry_at?: string | null;
          payload?: Json;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status_code?: number | null;
          response_time_ms?: number | null;
          signature?: string | null;
          status?: string | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_api_webhook_deliveries_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "module_api_webhooks";
            referencedColumns: ["id"];
          },
        ];
      };
      module_api_webhooks: {
        Row: {
          consumer_id: string;
          created_at: string | null;
          custom_headers: Json | null;
          events: string[];
          failed_deliveries: number | null;
          id: string;
          is_active: boolean | null;
          last_delivery_at: string | null;
          last_error: string | null;
          last_success_at: string | null;
          max_retries: number | null;
          name: string;
          retry_delay_seconds: number | null;
          secret: string | null;
          successful_deliveries: number | null;
          timeout_seconds: number | null;
          total_deliveries: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          consumer_id: string;
          created_at?: string | null;
          custom_headers?: Json | null;
          events: string[];
          failed_deliveries?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_delivery_at?: string | null;
          last_error?: string | null;
          last_success_at?: string | null;
          max_retries?: number | null;
          name: string;
          retry_delay_seconds?: number | null;
          secret?: string | null;
          successful_deliveries?: number | null;
          timeout_seconds?: number | null;
          total_deliveries?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          consumer_id?: string;
          created_at?: string | null;
          custom_headers?: Json | null;
          events?: string[];
          failed_deliveries?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_delivery_at?: string | null;
          last_error?: string | null;
          last_success_at?: string | null;
          max_retries?: number | null;
          name?: string;
          retry_delay_seconds?: number | null;
          secret?: string | null;
          successful_deliveries?: number | null;
          timeout_seconds?: number | null;
          total_deliveries?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_api_webhooks_consumer_id_fkey";
            columns: ["consumer_id"];
            isOneToOne: false;
            referencedRelation: "module_api_consumers";
            referencedColumns: ["id"];
          },
        ];
      };
      module_collection_items: {
        Row: {
          collection_id: string;
          display_order: number | null;
          id: string;
          module_id: string;
        };
        Insert: {
          collection_id: string;
          display_order?: number | null;
          id?: string;
          module_id: string;
        };
        Update: {
          collection_id?: string;
          display_order?: number | null;
          id?: string;
          module_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_collection_items_collection_id_fkey";
            columns: ["collection_id"];
            isOneToOne: false;
            referencedRelation: "module_collections";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_collection_items_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      module_collections: {
        Row: {
          banner_image: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon: string | null;
          id: string;
          is_visible: boolean | null;
          name: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          banner_image?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          banner_image?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon?: string | null;
          id?: string;
          is_visible?: boolean | null;
          name?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      module_custom_domains: {
        Row: {
          bandwidth_bytes: number | null;
          config: Json | null;
          created_at: string | null;
          domain: string;
          id: string;
          site_module_installation_id: string;
          ssl_auto_renew: boolean | null;
          ssl_certificate: string | null;
          ssl_expires_at: string | null;
          ssl_private_key_encrypted: string | null;
          ssl_provider: string | null;
          ssl_status: string | null;
          status: string | null;
          subdomain: string | null;
          total_requests: number | null;
          updated_at: string | null;
          verification_method: string | null;
          verification_token: string | null;
          verification_value: string | null;
          verified_at: string | null;
          white_label: Json | null;
        };
        Insert: {
          bandwidth_bytes?: number | null;
          config?: Json | null;
          created_at?: string | null;
          domain: string;
          id?: string;
          site_module_installation_id: string;
          ssl_auto_renew?: boolean | null;
          ssl_certificate?: string | null;
          ssl_expires_at?: string | null;
          ssl_private_key_encrypted?: string | null;
          ssl_provider?: string | null;
          ssl_status?: string | null;
          status?: string | null;
          subdomain?: string | null;
          total_requests?: number | null;
          updated_at?: string | null;
          verification_method?: string | null;
          verification_token?: string | null;
          verification_value?: string | null;
          verified_at?: string | null;
          white_label?: Json | null;
        };
        Update: {
          bandwidth_bytes?: number | null;
          config?: Json | null;
          created_at?: string | null;
          domain?: string;
          id?: string;
          site_module_installation_id?: string;
          ssl_auto_renew?: boolean | null;
          ssl_certificate?: string | null;
          ssl_expires_at?: string | null;
          ssl_private_key_encrypted?: string | null;
          ssl_provider?: string | null;
          ssl_status?: string | null;
          status?: string | null;
          subdomain?: string | null;
          total_requests?: number | null;
          updated_at?: string | null;
          verification_method?: string | null;
          verification_token?: string | null;
          verification_value?: string | null;
          verified_at?: string | null;
          white_label?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_custom_domains_site_module_installation_id_fkey";
            columns: ["site_module_installation_id"];
            isOneToOne: false;
            referencedRelation: "site_module_installations";
            referencedColumns: ["id"];
          },
        ];
      };
      module_data: {
        Row: {
          created_at: string | null;
          data_key: string;
          data_type: string | null;
          data_value: Json | null;
          expires_at: string | null;
          id: string;
          module_id: string;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          data_key: string;
          data_type?: string | null;
          data_value?: Json | null;
          expires_at?: string | null;
          id?: string;
          module_id: string;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          data_key?: string;
          data_type?: string | null;
          data_value?: Json | null;
          expires_at?: string | null;
          id?: string;
          module_id?: string;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_data_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_data_backups: {
        Row: {
          backup_url: string;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          module_id: string;
          site_id: string;
          size_bytes: number | null;
          table_counts: Json | null;
          type: string | null;
          version: string;
        };
        Insert: {
          backup_url: string;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          module_id: string;
          site_id: string;
          size_bytes?: number | null;
          table_counts?: Json | null;
          type?: string | null;
          version: string;
        };
        Update: {
          backup_url?: string;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          module_id?: string;
          site_id?: string;
          size_bytes?: number | null;
          table_counts?: Json | null;
          type?: string | null;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_data_backups_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_data_backups_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_database_registry: {
        Row: {
          created_at: string | null;
          full_table_names: string[] | null;
          id: string;
          last_error: string | null;
          last_error_at: string | null;
          last_metrics_at: string | null;
          module_id: string;
          module_name: string | null;
          module_short_id: string;
          module_version: string | null;
          schema_name: string | null;
          status: string | null;
          storage_bytes: number | null;
          table_names: string[] | null;
          total_rows: number | null;
          updated_at: string | null;
          uses_schema: boolean | null;
        };
        Insert: {
          created_at?: string | null;
          full_table_names?: string[] | null;
          id?: string;
          last_error?: string | null;
          last_error_at?: string | null;
          last_metrics_at?: string | null;
          module_id: string;
          module_name?: string | null;
          module_short_id: string;
          module_version?: string | null;
          schema_name?: string | null;
          status?: string | null;
          storage_bytes?: number | null;
          table_names?: string[] | null;
          total_rows?: number | null;
          updated_at?: string | null;
          uses_schema?: boolean | null;
        };
        Update: {
          created_at?: string | null;
          full_table_names?: string[] | null;
          id?: string;
          last_error?: string | null;
          last_error_at?: string | null;
          last_metrics_at?: string | null;
          module_id?: string;
          module_name?: string | null;
          module_short_id?: string;
          module_version?: string | null;
          schema_name?: string | null;
          status?: string | null;
          storage_bytes?: number | null;
          table_names?: string[] | null;
          total_rows?: number | null;
          updated_at?: string | null;
          uses_schema?: boolean | null;
        };
        Relationships: [];
      };
      module_dependencies: {
        Row: {
          cdn_provider: string | null;
          cdn_url: string | null;
          created_at: string | null;
          id: string;
          is_dev_dependency: boolean | null;
          is_peer_dependency: boolean | null;
          module_source_id: string;
          package_name: string;
          version: string;
        };
        Insert: {
          cdn_provider?: string | null;
          cdn_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_dev_dependency?: boolean | null;
          is_peer_dependency?: boolean | null;
          module_source_id: string;
          package_name: string;
          version: string;
        };
        Update: {
          cdn_provider?: string | null;
          cdn_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_dev_dependency?: boolean | null;
          is_peer_dependency?: boolean | null;
          module_source_id?: string;
          package_name?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_dependencies_module_source_id_fkey";
            columns: ["module_source_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
        ];
      };
      module_dependencies_graph: {
        Row: {
          created_at: string | null;
          dependency_type: string;
          depends_on_module_id: string;
          id: string;
          max_version: string | null;
          min_version: string | null;
          module_source_id: string;
        };
        Insert: {
          created_at?: string | null;
          dependency_type?: string;
          depends_on_module_id: string;
          id?: string;
          max_version?: string | null;
          min_version?: string | null;
          module_source_id: string;
        };
        Update: {
          created_at?: string | null;
          dependency_type?: string;
          depends_on_module_id?: string;
          id?: string;
          max_version?: string | null;
          min_version?: string | null;
          module_source_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_dependencies_graph_depends_on_module_id_fkey";
            columns: ["depends_on_module_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_dependencies_graph_module_source_id_fkey";
            columns: ["module_source_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
        ];
      };
      module_deployments: {
        Row: {
          completed_at: string | null;
          deployed_by: string | null;
          environment: string;
          error_message: string | null;
          id: string;
          module_source_id: string;
          started_at: string | null;
          status: string | null;
          version_id: string;
        };
        Insert: {
          completed_at?: string | null;
          deployed_by?: string | null;
          environment: string;
          error_message?: string | null;
          id?: string;
          module_source_id: string;
          started_at?: string | null;
          status?: string | null;
          version_id: string;
        };
        Update: {
          completed_at?: string | null;
          deployed_by?: string | null;
          environment?: string;
          error_message?: string | null;
          id?: string;
          module_source_id?: string;
          started_at?: string | null;
          status?: string | null;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_deployments_deployed_by_fkey";
            columns: ["deployed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_deployments_module_source_id_fkey";
            columns: ["module_source_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_deployments_version_id_fkey";
            columns: ["version_id"];
            isOneToOne: false;
            referencedRelation: "module_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      module_embed_tokens: {
        Row: {
          allowed_domains: string[] | null;
          created_at: string | null;
          expires_at: string;
          id: string;
          is_revoked: boolean | null;
          last_used_at: string | null;
          module_id: string;
          site_id: string;
          token_hash: string;
          updated_at: string | null;
          usage_count: number | null;
        };
        Insert: {
          allowed_domains?: string[] | null;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          is_revoked?: boolean | null;
          last_used_at?: string | null;
          module_id: string;
          site_id: string;
          token_hash: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Update: {
          allowed_domains?: string[] | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          is_revoked?: boolean | null;
          last_used_at?: string | null;
          module_id?: string;
          site_id?: string;
          token_hash?: string;
          updated_at?: string | null;
          usage_count?: number | null;
        };
        Relationships: [];
      };
      module_error_logs: {
        Row: {
          agency_id: string | null;
          client_id: string | null;
          component_stack: string | null;
          created_at: string | null;
          error_message: string;
          error_stack: string | null;
          id: string;
          module_id: string;
          site_id: string | null;
          url: string | null;
          user_agent: string | null;
        };
        Insert: {
          agency_id?: string | null;
          client_id?: string | null;
          component_stack?: string | null;
          created_at?: string | null;
          error_message: string;
          error_stack?: string | null;
          id?: string;
          module_id: string;
          site_id?: string | null;
          url?: string | null;
          user_agent?: string | null;
        };
        Update: {
          agency_id?: string | null;
          client_id?: string | null;
          component_stack?: string | null;
          created_at?: string | null;
          error_message?: string;
          error_stack?: string | null;
          id?: string;
          module_id?: string;
          site_id?: string | null;
          url?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_error_logs_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_error_logs_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_error_logs_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_error_logs_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_events: {
        Row: {
          created_at: string | null;
          event_name: string;
          id: string;
          payload: Json | null;
          processed: boolean | null;
          processed_at: string | null;
          site_id: string;
          source_module_id: string;
          target_module_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_name: string;
          id?: string;
          payload?: Json | null;
          processed?: boolean | null;
          processed_at?: string | null;
          site_id: string;
          source_module_id: string;
          target_module_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_name?: string;
          id?: string;
          payload?: Json | null;
          processed?: boolean | null;
          processed_at?: string | null;
          site_id?: string;
          source_module_id?: string;
          target_module_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_events_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_external_requests: {
        Row: {
          created_at: string | null;
          error_code: string | null;
          error_message: string | null;
          id: string;
          ip_address: unknown;
          method: string | null;
          module_id: string;
          origin: string | null;
          path: string | null;
          response_time_ms: number | null;
          site_id: string;
          status_code: number | null;
          token_id: string | null;
          user_agent: string | null;
        };
        Insert: {
          created_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          ip_address?: unknown;
          method?: string | null;
          module_id: string;
          origin?: string | null;
          path?: string | null;
          response_time_ms?: number | null;
          site_id: string;
          status_code?: number | null;
          token_id?: string | null;
          user_agent?: string | null;
        };
        Update: {
          created_at?: string | null;
          error_code?: string | null;
          error_message?: string | null;
          id?: string;
          ip_address?: unknown;
          method?: string | null;
          module_id?: string;
          origin?: string | null;
          path?: string | null;
          response_time_ms?: number | null;
          site_id?: string;
          status_code?: number | null;
          token_id?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_external_requests_token_id_fkey";
            columns: ["token_id"];
            isOneToOne: false;
            referencedRelation: "module_external_tokens";
            referencedColumns: ["id"];
          },
        ];
      };
      module_external_tokens: {
        Row: {
          allowed_domains: string[] | null;
          allowed_ips: string[] | null;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          last_used_at: string | null;
          module_id: string;
          name: string;
          rate_limit: number | null;
          revoked_at: string | null;
          scopes: string[] | null;
          site_id: string;
          token_hash: string;
          token_prefix: string;
          usage_count: number | null;
        };
        Insert: {
          allowed_domains?: string[] | null;
          allowed_ips?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          last_used_at?: string | null;
          module_id: string;
          name: string;
          rate_limit?: number | null;
          revoked_at?: string | null;
          scopes?: string[] | null;
          site_id: string;
          token_hash: string;
          token_prefix: string;
          usage_count?: number | null;
        };
        Update: {
          allowed_domains?: string[] | null;
          allowed_ips?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          last_used_at?: string | null;
          module_id?: string;
          name?: string;
          rate_limit?: number | null;
          revoked_at?: string | null;
          scopes?: string[] | null;
          site_id?: string;
          token_hash?: string;
          token_prefix?: string;
          usage_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_external_tokens_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_files: {
        Row: {
          checksum: string | null;
          content: string | null;
          created_at: string | null;
          file_path: string;
          file_type: string;
          id: string;
          is_entry_point: boolean | null;
          module_source_id: string;
          size_bytes: number | null;
          storage_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          checksum?: string | null;
          content?: string | null;
          created_at?: string | null;
          file_path: string;
          file_type: string;
          id?: string;
          is_entry_point?: boolean | null;
          module_source_id: string;
          size_bytes?: number | null;
          storage_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          checksum?: string | null;
          content?: string | null;
          created_at?: string | null;
          file_path?: string;
          file_type?: string;
          id?: string;
          is_entry_point?: boolean | null;
          module_source_id?: string;
          size_bytes?: number | null;
          storage_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_files_module_source_id_fkey";
            columns: ["module_source_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
        ];
      };
      module_graphql_schemas: {
        Row: {
          generated_at: string | null;
          generated_from: Json | null;
          id: string;
          introspection_json: Json | null;
          is_active: boolean | null;
          module_id: string;
          sdl: string;
          version: string;
        };
        Insert: {
          generated_at?: string | null;
          generated_from?: Json | null;
          id?: string;
          introspection_json?: Json | null;
          is_active?: boolean | null;
          module_id: string;
          sdl: string;
          version: string;
        };
        Update: {
          generated_at?: string | null;
          generated_from?: Json | null;
          id?: string;
          introspection_json?: Json | null;
          is_active?: boolean | null;
          module_id?: string;
          sdl?: string;
          version?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_graphql_schemas_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      module_health_checks: {
        Row: {
          checked_at: string | null;
          cpu_usage_percent: number | null;
          error_count_last_hour: number | null;
          id: string;
          last_error: string | null;
          memory_usage_mb: number | null;
          module_id: string;
          response_time_ms: number | null;
          site_id: string | null;
          status: string;
        };
        Insert: {
          checked_at?: string | null;
          cpu_usage_percent?: number | null;
          error_count_last_hour?: number | null;
          id?: string;
          last_error?: string | null;
          memory_usage_mb?: number | null;
          module_id: string;
          response_time_ms?: number | null;
          site_id?: string | null;
          status: string;
        };
        Update: {
          checked_at?: string | null;
          cpu_usage_percent?: number | null;
          error_count_last_hour?: number | null;
          id?: string;
          last_error?: string | null;
          memory_usage_mb?: number | null;
          module_id?: string;
          response_time_ms?: number | null;
          site_id?: string | null;
          status?: string;
        };
        Relationships: [];
      };
      module_invitations: {
        Row: {
          accepted_at: string | null;
          accepted_by: string | null;
          created_at: string | null;
          email: string;
          expires_at: string;
          id: string;
          invited_by: string;
          message: string | null;
          module_id: string;
          role_id: string;
          site_id: string;
          status: string | null;
          token: string;
        };
        Insert: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string | null;
          email: string;
          expires_at: string;
          id?: string;
          invited_by: string;
          message?: string | null;
          module_id: string;
          role_id: string;
          site_id: string;
          status?: string | null;
          token: string;
        };
        Update: {
          accepted_at?: string | null;
          accepted_by?: string | null;
          created_at?: string | null;
          email?: string;
          expires_at?: string;
          id?: string;
          invited_by?: string;
          message?: string | null;
          module_id?: string;
          role_id?: string;
          site_id?: string;
          status?: string | null;
          token?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_invitations_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "module_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_invitations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_manifests: {
        Row: {
          build_target: string | null;
          created_at: string | null;
          default_height: string | null;
          default_width: string | null;
          entry_point: string | null;
          id: string;
          main_component: string | null;
          manifest_version: string | null;
          minify: boolean | null;
          module_source_id: string;
          permissions: string[] | null;
          raw_manifest: Json | null;
          render_mode: string | null;
          resizable: boolean | null;
          source_maps: boolean | null;
          supports_dark_mode: boolean | null;
          supports_mobile: boolean | null;
          supports_offline: boolean | null;
          updated_at: string | null;
        };
        Insert: {
          build_target?: string | null;
          created_at?: string | null;
          default_height?: string | null;
          default_width?: string | null;
          entry_point?: string | null;
          id?: string;
          main_component?: string | null;
          manifest_version?: string | null;
          minify?: boolean | null;
          module_source_id: string;
          permissions?: string[] | null;
          raw_manifest?: Json | null;
          render_mode?: string | null;
          resizable?: boolean | null;
          source_maps?: boolean | null;
          supports_dark_mode?: boolean | null;
          supports_mobile?: boolean | null;
          supports_offline?: boolean | null;
          updated_at?: string | null;
        };
        Update: {
          build_target?: string | null;
          created_at?: string | null;
          default_height?: string | null;
          default_width?: string | null;
          entry_point?: string | null;
          id?: string;
          main_component?: string | null;
          manifest_version?: string | null;
          minify?: boolean | null;
          module_source_id?: string;
          permissions?: string[] | null;
          raw_manifest?: Json | null;
          render_mode?: string | null;
          resizable?: boolean | null;
          source_maps?: boolean | null;
          supports_dark_mode?: boolean | null;
          supports_mobile?: boolean | null;
          supports_offline?: boolean | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_manifests_module_source_id_fkey";
            columns: ["module_source_id"];
            isOneToOne: true;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
        ];
      };
      module_migration_runs: {
        Row: {
          backup_id: string | null;
          completed_at: string | null;
          direction: string;
          error_message: string | null;
          executed_by: string | null;
          id: string;
          migration_id: string;
          module_id: string;
          site_id: string;
          started_at: string | null;
          status: string | null;
        };
        Insert: {
          backup_id?: string | null;
          completed_at?: string | null;
          direction: string;
          error_message?: string | null;
          executed_by?: string | null;
          id?: string;
          migration_id: string;
          module_id: string;
          site_id: string;
          started_at?: string | null;
          status?: string | null;
        };
        Update: {
          backup_id?: string | null;
          completed_at?: string | null;
          direction?: string;
          error_message?: string | null;
          executed_by?: string | null;
          id?: string;
          migration_id?: string;
          module_id?: string;
          site_id?: string;
          started_at?: string | null;
          status?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_migration_runs_backup_id_fkey";
            columns: ["backup_id"];
            isOneToOne: false;
            referencedRelation: "module_data_backups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_migration_runs_executed_by_fkey";
            columns: ["executed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_migration_runs_migration_id_fkey";
            columns: ["migration_id"];
            isOneToOne: false;
            referencedRelation: "module_migrations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_migration_runs_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_migrations: {
        Row: {
          created_at: string | null;
          description: string | null;
          down_sql: string | null;
          estimated_duration_seconds: number | null;
          from_version: string | null;
          id: string;
          is_reversible: boolean | null;
          module_id: string;
          requires_maintenance: boolean | null;
          sequence: number;
          to_version: string;
          up_sql: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          down_sql?: string | null;
          estimated_duration_seconds?: number | null;
          from_version?: string | null;
          id?: string;
          is_reversible?: boolean | null;
          module_id: string;
          requires_maintenance?: boolean | null;
          sequence: number;
          to_version: string;
          up_sql: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          down_sql?: string | null;
          estimated_duration_seconds?: number | null;
          from_version?: string | null;
          id?: string;
          is_reversible?: boolean | null;
          module_id?: string;
          requires_maintenance?: boolean | null;
          sequence?: number;
          to_version?: string;
          up_sql?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_migrations_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
        ];
      };
      module_oauth_clients: {
        Row: {
          client_id: string;
          client_secret_hash: string;
          created_at: string | null;
          created_by: string | null;
          id: string;
          is_active: boolean | null;
          module_id: string;
          name: string;
          redirect_uris: string[];
          scopes: string[];
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          client_id: string;
          client_secret_hash: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          module_id: string;
          name: string;
          redirect_uris?: string[];
          scopes?: string[];
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          client_id?: string;
          client_secret_hash?: string;
          created_at?: string | null;
          created_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          module_id?: string;
          name?: string;
          redirect_uris?: string[];
          scopes?: string[];
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_oauth_clients_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_oauth_codes: {
        Row: {
          client_id: string;
          code_challenge: string | null;
          code_challenge_method: string | null;
          code_hash: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          redirect_uri: string;
          scopes: string[];
          used_at: string | null;
          user_id: string;
        };
        Insert: {
          client_id: string;
          code_challenge?: string | null;
          code_challenge_method?: string | null;
          code_hash: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          redirect_uri: string;
          scopes?: string[];
          used_at?: string | null;
          user_id: string;
        };
        Update: {
          client_id?: string;
          code_challenge?: string | null;
          code_challenge_method?: string | null;
          code_hash?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          redirect_uri?: string;
          scopes?: string[];
          used_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      module_oauth_refresh_tokens: {
        Row: {
          client_id: string;
          created_at: string | null;
          expires_at: string;
          id: string;
          revoked_at: string | null;
          scopes: string[];
          token_hash: string;
          user_id: string;
        };
        Insert: {
          client_id: string;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          revoked_at?: string | null;
          scopes?: string[];
          token_hash: string;
          user_id: string;
        };
        Update: {
          client_id?: string;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          revoked_at?: string | null;
          scopes?: string[];
          token_hash?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      module_permissions: {
        Row: {
          category: string | null;
          description: string | null;
          id: string;
          is_active: boolean | null;
          key: string;
          module_id: string;
          name: string;
        };
        Insert: {
          category?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key: string;
          module_id: string;
          name: string;
        };
        Update: {
          category?: string | null;
          description?: string | null;
          id?: string;
          is_active?: boolean | null;
          key?: string;
          module_id?: string;
          name?: string;
        };
        Relationships: [];
      };
      module_rate_limits: {
        Row: {
          id: string;
          rate_limit_key: string;
          request_count: number | null;
          window_minutes: number | null;
          window_start: string | null;
        };
        Insert: {
          id?: string;
          rate_limit_key: string;
          request_count?: number | null;
          window_minutes?: number | null;
          window_start?: string | null;
        };
        Update: {
          id?: string;
          rate_limit_key?: string;
          request_count?: number | null;
          window_minutes?: number | null;
          window_start?: string | null;
        };
        Relationships: [];
      };
      module_request_votes: {
        Row: {
          agency_id: string;
          id: string;
          request_id: string;
          voted_at: string | null;
        };
        Insert: {
          agency_id: string;
          id?: string;
          request_id: string;
          voted_at?: string | null;
        };
        Update: {
          agency_id?: string;
          id?: string;
          request_id?: string;
          voted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_request_votes_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_request_votes_request_id_fkey";
            columns: ["request_id"];
            isOneToOne: false;
            referencedRelation: "module_requests";
            referencedColumns: ["id"];
          },
        ];
      };
      module_requests: {
        Row: {
          admin_notes: string | null;
          agency_id: string;
          assigned_to: string | null;
          budget_range: string | null;
          completed_at: string | null;
          description: string;
          id: string;
          priority: string | null;
          resulting_module_id: string | null;
          status: string | null;
          submitted_at: string | null;
          submitted_by: string | null;
          suggested_category: string | null;
          suggested_install_level: string | null;
          target_audience: string | null;
          title: string;
          updated_at: string | null;
          upvotes: number | null;
          use_case: string | null;
          willing_to_fund: boolean | null;
        };
        Insert: {
          admin_notes?: string | null;
          agency_id: string;
          assigned_to?: string | null;
          budget_range?: string | null;
          completed_at?: string | null;
          description: string;
          id?: string;
          priority?: string | null;
          resulting_module_id?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          suggested_category?: string | null;
          suggested_install_level?: string | null;
          target_audience?: string | null;
          title: string;
          updated_at?: string | null;
          upvotes?: number | null;
          use_case?: string | null;
          willing_to_fund?: boolean | null;
        };
        Update: {
          admin_notes?: string | null;
          agency_id?: string;
          assigned_to?: string | null;
          budget_range?: string | null;
          completed_at?: string | null;
          description?: string;
          id?: string;
          priority?: string | null;
          resulting_module_id?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          submitted_by?: string | null;
          suggested_category?: string | null;
          suggested_install_level?: string | null;
          target_audience?: string | null;
          title?: string;
          updated_at?: string | null;
          upvotes?: number | null;
          use_case?: string | null;
          willing_to_fund?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_requests_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_requests_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_requests_resulting_module_id_fkey";
            columns: ["resulting_module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_requests_submitted_by_fkey";
            columns: ["submitted_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      module_review_votes: {
        Row: {
          created_at: string | null;
          id: string;
          is_helpful: boolean;
          review_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          is_helpful: boolean;
          review_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          is_helpful?: boolean;
          review_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_review_votes_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "module_reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      module_reviews: {
        Row: {
          agency_id: string;
          agency_name: string | null;
          cons: string[] | null;
          content: string | null;
          created_at: string | null;
          developer_responded_at: string | null;
          developer_response: string | null;
          helpful_count: number | null;
          id: string;
          is_verified_purchase: boolean | null;
          module_id: string;
          pros: string[] | null;
          rating: number;
          report_count: number | null;
          response: string | null;
          response_at: string | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
          verified_purchase: boolean | null;
        };
        Insert: {
          agency_id: string;
          agency_name?: string | null;
          cons?: string[] | null;
          content?: string | null;
          created_at?: string | null;
          developer_responded_at?: string | null;
          developer_response?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_verified_purchase?: boolean | null;
          module_id: string;
          pros?: string[] | null;
          rating: number;
          report_count?: number | null;
          response?: string | null;
          response_at?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          verified_purchase?: boolean | null;
        };
        Update: {
          agency_id?: string;
          agency_name?: string | null;
          cons?: string[] | null;
          content?: string | null;
          created_at?: string | null;
          developer_responded_at?: string | null;
          developer_response?: string | null;
          helpful_count?: number | null;
          id?: string;
          is_verified_purchase?: boolean | null;
          module_id?: string;
          pros?: string[] | null;
          rating?: number;
          report_count?: number | null;
          response?: string | null;
          response_at?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
          verified_purchase?: boolean | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_reviews_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_reviews_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      module_roles: {
        Row: {
          created_at: string | null;
          description: string | null;
          hierarchy_level: number | null;
          id: string;
          is_default: boolean | null;
          is_system: boolean | null;
          module_id: string;
          name: string;
          permissions: string[] | null;
          site_id: string;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          hierarchy_level?: number | null;
          id?: string;
          is_default?: boolean | null;
          is_system?: boolean | null;
          module_id: string;
          name: string;
          permissions?: string[] | null;
          site_id: string;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          hierarchy_level?: number | null;
          id?: string;
          is_default?: boolean | null;
          is_system?: boolean | null;
          module_id?: string;
          name?: string;
          permissions?: string[] | null;
          site_id?: string;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_roles_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_secrets: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          encrypted_value: string;
          id: string;
          module_id: string;
          secret_name: string;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          encrypted_value: string;
          id?: string;
          module_id: string;
          secret_name: string;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          encrypted_value?: string;
          id?: string;
          module_id?: string;
          secret_name?: string;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_secrets_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_sessions: {
        Row: {
          created_at: string | null;
          device_info: Json | null;
          expires_at: string;
          id: string;
          is_active: boolean | null;
          last_activity_at: string | null;
          module_id: string;
          referrer_url: string | null;
          session_token: string;
          site_id: string;
          source: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          device_info?: Json | null;
          expires_at: string;
          id?: string;
          is_active?: boolean | null;
          last_activity_at?: string | null;
          module_id: string;
          referrer_url?: string | null;
          session_token: string;
          site_id: string;
          source?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          device_info?: Json | null;
          expires_at?: string;
          id?: string;
          is_active?: boolean | null;
          last_activity_at?: string | null;
          module_id?: string;
          referrer_url?: string | null;
          session_token?: string;
          site_id?: string;
          source?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_sessions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_source: {
        Row: {
          api_routes: Json | null;
          capabilities: Json | null;
          catalog_module_id: string | null;
          catalog_synced_at: string | null;
          category: string | null;
          created_at: string | null;
          created_by: string | null;
          db_isolation: string | null;
          default_settings: Json | null;
          dependencies: string[] | null;
          description: string | null;
          icon: string | null;
          id: string;
          install_level: string | null;
          latest_version: string | null;
          module_id: string;
          module_type: string | null;
          name: string;
          pricing_tier: string | null;
          published_at: string | null;
          published_version: string | null;
          render_code: string | null;
          required_fields: string[] | null;
          requirements: Json | null;
          resources: Json | null;
          settings_schema: Json | null;
          short_id: string | null;
          slug: string;
          status: string | null;
          styles: string | null;
          suggested_retail_monthly: number | null;
          testing_tier: string | null;
          updated_at: string | null;
          updated_by: string | null;
          wholesale_price_monthly: number | null;
        };
        Insert: {
          api_routes?: Json | null;
          capabilities?: Json | null;
          catalog_module_id?: string | null;
          catalog_synced_at?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          db_isolation?: string | null;
          default_settings?: Json | null;
          dependencies?: string[] | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          install_level?: string | null;
          latest_version?: string | null;
          module_id: string;
          module_type?: string | null;
          name: string;
          pricing_tier?: string | null;
          published_at?: string | null;
          published_version?: string | null;
          render_code?: string | null;
          required_fields?: string[] | null;
          requirements?: Json | null;
          resources?: Json | null;
          settings_schema?: Json | null;
          short_id?: string | null;
          slug: string;
          status?: string | null;
          styles?: string | null;
          suggested_retail_monthly?: number | null;
          testing_tier?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          wholesale_price_monthly?: number | null;
        };
        Update: {
          api_routes?: Json | null;
          capabilities?: Json | null;
          catalog_module_id?: string | null;
          catalog_synced_at?: string | null;
          category?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          db_isolation?: string | null;
          default_settings?: Json | null;
          dependencies?: string[] | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          install_level?: string | null;
          latest_version?: string | null;
          module_id?: string;
          module_type?: string | null;
          name?: string;
          pricing_tier?: string | null;
          published_at?: string | null;
          published_version?: string | null;
          render_code?: string | null;
          required_fields?: string[] | null;
          requirements?: Json | null;
          resources?: Json | null;
          settings_schema?: Json | null;
          short_id?: string | null;
          slug?: string;
          status?: string | null;
          styles?: string | null;
          suggested_retail_monthly?: number | null;
          testing_tier?: string | null;
          updated_at?: string | null;
          updated_by?: string | null;
          wholesale_price_monthly?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_source_catalog_module_id_fkey";
            columns: ["catalog_module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_source_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_source_updated_by_fkey";
            columns: ["updated_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      module_stats_daily: {
        Row: {
          id: string;
          installs: number | null;
          module_id: string;
          stat_date: string;
          uninstalls: number | null;
          views: number | null;
        };
        Insert: {
          id?: string;
          installs?: number | null;
          module_id: string;
          stat_date: string;
          uninstalls?: number | null;
          views?: number | null;
        };
        Update: {
          id?: string;
          installs?: number | null;
          module_id?: string;
          stat_date?: string;
          uninstalls?: number | null;
          views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_stats_daily_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      module_storage_buckets: {
        Row: {
          bucket_name: string;
          created_at: string | null;
          file_count: number | null;
          id: string;
          last_accessed_at: string | null;
          max_size_bytes: number | null;
          module_id: string;
          site_id: string | null;
          used_size_bytes: number | null;
        };
        Insert: {
          bucket_name: string;
          created_at?: string | null;
          file_count?: number | null;
          id?: string;
          last_accessed_at?: string | null;
          max_size_bytes?: number | null;
          module_id: string;
          site_id?: string | null;
          used_size_bytes?: number | null;
        };
        Update: {
          bucket_name?: string;
          created_at?: string | null;
          file_count?: number | null;
          id?: string;
          last_accessed_at?: string | null;
          max_size_bytes?: number | null;
          module_id?: string;
          site_id?: string | null;
          used_size_bytes?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_storage_buckets_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_test_results: {
        Row: {
          category: string;
          created_at: string | null;
          details: Json | null;
          duration_ms: number | null;
          id: string;
          message: string | null;
          status: string;
          test_name: string;
          test_run_id: string;
        };
        Insert: {
          category: string;
          created_at?: string | null;
          details?: Json | null;
          duration_ms?: number | null;
          id?: string;
          message?: string | null;
          status: string;
          test_name: string;
          test_run_id: string;
        };
        Update: {
          category?: string;
          created_at?: string | null;
          details?: Json | null;
          duration_ms?: number | null;
          id?: string;
          message?: string | null;
          status?: string;
          test_name?: string;
          test_run_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_test_results_test_run_id_fkey";
            columns: ["test_run_id"];
            isOneToOne: false;
            referencedRelation: "module_test_runs";
            referencedColumns: ["id"];
          },
        ];
      };
      module_test_runs: {
        Row: {
          completed_at: string | null;
          created_at: string | null;
          environment: Json | null;
          id: string;
          module_source_id: string;
          module_version: string;
          started_at: string | null;
          status: string;
          test_site_id: string | null;
          test_type: string;
          triggered_by: string | null;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string | null;
          environment?: Json | null;
          id?: string;
          module_source_id: string;
          module_version: string;
          started_at?: string | null;
          status?: string;
          test_site_id?: string | null;
          test_type: string;
          triggered_by?: string | null;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string | null;
          environment?: Json | null;
          id?: string;
          module_source_id?: string;
          module_version?: string;
          started_at?: string | null;
          status?: string;
          test_site_id?: string | null;
          test_type?: string;
          triggered_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_test_runs_module_source_id_fkey";
            columns: ["module_source_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_test_runs_test_site_id_fkey";
            columns: ["test_site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_usage_events: {
        Row: {
          agency_id: string | null;
          client_id: string | null;
          created_at: string | null;
          event_name: string | null;
          event_type: string;
          id: string;
          load_time_ms: number | null;
          metadata: Json | null;
          module_id: string;
          site_id: string | null;
        };
        Insert: {
          agency_id?: string | null;
          client_id?: string | null;
          created_at?: string | null;
          event_name?: string | null;
          event_type: string;
          id?: string;
          load_time_ms?: number | null;
          metadata?: Json | null;
          module_id: string;
          site_id?: string | null;
        };
        Update: {
          agency_id?: string | null;
          client_id?: string | null;
          created_at?: string | null;
          event_name?: string | null;
          event_type?: string;
          id?: string;
          load_time_ms?: number | null;
          metadata?: Json | null;
          module_id?: string;
          site_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_usage_events_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_usage_events_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_usage_events_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_usage_events_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_user_roles: {
        Row: {
          expires_at: string | null;
          granted_at: string | null;
          granted_by: string | null;
          id: string;
          is_active: boolean | null;
          module_id: string;
          role_id: string;
          site_id: string;
          user_id: string;
        };
        Insert: {
          expires_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          module_id: string;
          role_id: string;
          site_id: string;
          user_id: string;
        };
        Update: {
          expires_at?: string | null;
          granted_at?: string | null;
          granted_by?: string | null;
          id?: string;
          is_active?: boolean | null;
          module_id?: string;
          role_id?: string;
          site_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_user_roles_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "module_roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_user_roles_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      module_versions: {
        Row: {
          active_installs: number | null;
          api_routes: Json | null;
          breaking_description: string | null;
          bundle_hash: string | null;
          bundle_url: string | null;
          changelog: string | null;
          created_at: string | null;
          created_by: string | null;
          default_settings: Json | null;
          dependencies: Json | null;
          download_count: number | null;
          id: string;
          is_breaking_change: boolean | null;
          min_platform_version: string | null;
          module_source_id: string;
          prerelease: string | null;
          published_at: string | null;
          published_by: string | null;
          release_notes: string | null;
          render_code: string | null;
          settings_schema: Json | null;
          source_url: string | null;
          status: string | null;
          styles: string | null;
          version: string;
          version_major: number | null;
          version_minor: number | null;
          version_patch: number | null;
        };
        Insert: {
          active_installs?: number | null;
          api_routes?: Json | null;
          breaking_description?: string | null;
          bundle_hash?: string | null;
          bundle_url?: string | null;
          changelog?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_settings?: Json | null;
          dependencies?: Json | null;
          download_count?: number | null;
          id?: string;
          is_breaking_change?: boolean | null;
          min_platform_version?: string | null;
          module_source_id: string;
          prerelease?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          release_notes?: string | null;
          render_code?: string | null;
          settings_schema?: Json | null;
          source_url?: string | null;
          status?: string | null;
          styles?: string | null;
          version: string;
          version_major?: number | null;
          version_minor?: number | null;
          version_patch?: number | null;
        };
        Update: {
          active_installs?: number | null;
          api_routes?: Json | null;
          breaking_description?: string | null;
          bundle_hash?: string | null;
          bundle_url?: string | null;
          changelog?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          default_settings?: Json | null;
          dependencies?: Json | null;
          download_count?: number | null;
          id?: string;
          is_breaking_change?: boolean | null;
          min_platform_version?: string | null;
          module_source_id?: string;
          prerelease?: string | null;
          published_at?: string | null;
          published_by?: string | null;
          release_notes?: string | null;
          render_code?: string | null;
          settings_schema?: Json | null;
          source_url?: string | null;
          status?: string | null;
          styles?: string | null;
          version?: string;
          version_major?: number | null;
          version_minor?: number | null;
          version_patch?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_versions_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_versions_module_source_id_fkey";
            columns: ["module_source_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "module_versions_published_by_fkey";
            columns: ["published_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      module_views: {
        Row: {
          clicked_install: boolean | null;
          created_at: string | null;
          id: string;
          module_id: string;
          scrolled_to_bottom: boolean | null;
          session_id: string | null;
          user_id: string | null;
          view_duration_seconds: number | null;
        };
        Insert: {
          clicked_install?: boolean | null;
          created_at?: string | null;
          id?: string;
          module_id: string;
          scrolled_to_bottom?: boolean | null;
          session_id?: string | null;
          user_id?: string | null;
          view_duration_seconds?: number | null;
        };
        Update: {
          clicked_install?: boolean | null;
          created_at?: string | null;
          id?: string;
          module_id?: string;
          scrolled_to_bottom?: boolean | null;
          session_id?: string | null;
          user_id?: string | null;
          view_duration_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "module_views_module_id_fkey";
            columns: ["module_id"];
            isOneToOne: false;
            referencedRelation: "modules_v2";
            referencedColumns: ["id"];
          },
        ];
      };
      module_webhook_deliveries: {
        Row: {
          attempts: number | null;
          completed_at: string | null;
          created_at: string | null;
          event: string;
          id: string;
          max_attempts: number | null;
          next_retry_at: string | null;
          payload: Json;
          response: string | null;
          status: string;
          status_code: number | null;
          webhook_id: string;
        };
        Insert: {
          attempts?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          event: string;
          id?: string;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          payload: Json;
          response?: string | null;
          status?: string;
          status_code?: number | null;
          webhook_id: string;
        };
        Update: {
          attempts?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          event?: string;
          id?: string;
          max_attempts?: number | null;
          next_retry_at?: string | null;
          payload?: Json;
          response?: string | null;
          status?: string;
          status_code?: number | null;
          webhook_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_webhook_deliveries_webhook_id_fkey";
            columns: ["webhook_id"];
            isOneToOne: false;
            referencedRelation: "module_webhooks";
            referencedColumns: ["id"];
          },
        ];
      };
      module_webhook_logs: {
        Row: {
          created_at: string | null;
          error_message: string | null;
          error_stack: string | null;
          id: string;
          processing_time_ms: number | null;
          request_body: string | null;
          request_headers: Json | null;
          request_ip: string | null;
          request_method: string;
          request_query: Json | null;
          response_body: string | null;
          response_headers: Json | null;
          response_status: number | null;
          success: boolean | null;
          webhook_id: string;
        };
        Insert: {
          created_at?: string | null;
          error_message?: string | null;
          error_stack?: string | null;
          id?: string;
          processing_time_ms?: number | null;
          request_body?: string | null;
          request_headers?: Json | null;
          request_ip?: string | null;
          request_method: string;
          request_query?: Json | null;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          success?: boolean | null;
          webhook_id: string;
        };
        Update: {
          created_at?: string | null;
          error_message?: string | null;
          error_stack?: string | null;
          id?: string;
          processing_time_ms?: number | null;
          request_body?: string | null;
          request_headers?: Json | null;
          request_ip?: string | null;
          request_method?: string;
          request_query?: Json | null;
          response_body?: string | null;
          response_headers?: Json | null;
          response_status?: number | null;
          success?: boolean | null;
          webhook_id?: string;
        };
        Relationships: [];
      };
      module_webhooks: {
        Row: {
          created_at: string | null;
          created_by: string | null;
          events: string[];
          failure_count: number | null;
          headers: Json | null;
          id: string;
          is_active: boolean | null;
          last_failure_at: string | null;
          last_success_at: string | null;
          last_triggered_at: string | null;
          module_id: string;
          name: string;
          secret: string;
          site_id: string;
          success_count: number | null;
          updated_at: string | null;
          url: string;
        };
        Insert: {
          created_at?: string | null;
          created_by?: string | null;
          events?: string[];
          failure_count?: number | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          last_triggered_at?: string | null;
          module_id: string;
          name: string;
          secret: string;
          site_id: string;
          success_count?: number | null;
          updated_at?: string | null;
          url: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string | null;
          events?: string[];
          failure_count?: number | null;
          headers?: Json | null;
          id?: string;
          is_active?: boolean | null;
          last_failure_at?: string | null;
          last_success_at?: string | null;
          last_triggered_at?: string | null;
          module_id?: string;
          name?: string;
          secret?: string;
          site_id?: string;
          success_count?: number | null;
          updated_at?: string | null;
          url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "module_webhooks_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      modules_v2: {
        Row: {
          author_name: string | null;
          author_verified: boolean | null;
          banner_image: string | null;
          capabilities: Json | null;
          category: string;
          changelog: Json | null;
          created_at: string | null;
          created_by: string | null;
          current_version: string;
          db_isolation: string | null;
          default_settings: Json | null;
          description: string | null;
          developer_profile_id: string | null;
          documentation_url: string | null;
          features: string[] | null;
          icon: string | null;
          id: string;
          install_count: number | null;
          install_level: string;
          is_featured: boolean | null;
          is_premium: boolean | null;
          lemon_product_id: string | null;
          lemon_variant_monthly_id: string | null;
          lemon_variant_one_time_id: string | null;
          lemon_variant_yearly_id: string | null;
          long_description: string | null;
          manifest: Json | null;
          min_platform_version: string | null;
          module_type: string | null;
          name: string;
          package_hash: string | null;
          package_url: string | null;
          pricing_type: string;
          provided_hooks: string[] | null;
          published_at: string | null;
          rating_average: number | null;
          rating_count: number | null;
          render_code: string | null;
          required_permissions: string[] | null;
          requirements: string[] | null;
          resources: Json | null;
          review_count: number | null;
          screenshots: string[] | null;
          search_vector: unknown;
          settings_schema: Json | null;
          short_id: string | null;
          slug: string;
          source: string | null;
          status: string | null;
          stripe_price_monthly_id: string | null;
          stripe_price_yearly_id: string | null;
          stripe_product_id: string | null;
          studio_module_id: string | null;
          studio_version: string | null;
          styles: string | null;
          suggested_retail_monthly: number | null;
          suggested_retail_yearly: number | null;
          support_url: string | null;
          tags: string[] | null;
          updated_at: string | null;
          wholesale_price_monthly: number | null;
          wholesale_price_one_time: number | null;
          wholesale_price_yearly: number | null;
        };
        Insert: {
          author_name?: string | null;
          author_verified?: boolean | null;
          banner_image?: string | null;
          capabilities?: Json | null;
          category: string;
          changelog?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          current_version?: string;
          db_isolation?: string | null;
          default_settings?: Json | null;
          description?: string | null;
          developer_profile_id?: string | null;
          documentation_url?: string | null;
          features?: string[] | null;
          icon?: string | null;
          id?: string;
          install_count?: number | null;
          install_level?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          lemon_product_id?: string | null;
          lemon_variant_monthly_id?: string | null;
          lemon_variant_one_time_id?: string | null;
          lemon_variant_yearly_id?: string | null;
          long_description?: string | null;
          manifest?: Json | null;
          min_platform_version?: string | null;
          module_type?: string | null;
          name: string;
          package_hash?: string | null;
          package_url?: string | null;
          pricing_type?: string;
          provided_hooks?: string[] | null;
          published_at?: string | null;
          rating_average?: number | null;
          rating_count?: number | null;
          render_code?: string | null;
          required_permissions?: string[] | null;
          requirements?: string[] | null;
          resources?: Json | null;
          review_count?: number | null;
          screenshots?: string[] | null;
          search_vector?: unknown;
          settings_schema?: Json | null;
          short_id?: string | null;
          slug: string;
          source?: string | null;
          status?: string | null;
          stripe_price_monthly_id?: string | null;
          stripe_price_yearly_id?: string | null;
          stripe_product_id?: string | null;
          studio_module_id?: string | null;
          studio_version?: string | null;
          styles?: string | null;
          suggested_retail_monthly?: number | null;
          suggested_retail_yearly?: number | null;
          support_url?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          wholesale_price_monthly?: number | null;
          wholesale_price_one_time?: number | null;
          wholesale_price_yearly?: number | null;
        };
        Update: {
          author_name?: string | null;
          author_verified?: boolean | null;
          banner_image?: string | null;
          capabilities?: Json | null;
          category?: string;
          changelog?: Json | null;
          created_at?: string | null;
          created_by?: string | null;
          current_version?: string;
          db_isolation?: string | null;
          default_settings?: Json | null;
          description?: string | null;
          developer_profile_id?: string | null;
          documentation_url?: string | null;
          features?: string[] | null;
          icon?: string | null;
          id?: string;
          install_count?: number | null;
          install_level?: string;
          is_featured?: boolean | null;
          is_premium?: boolean | null;
          lemon_product_id?: string | null;
          lemon_variant_monthly_id?: string | null;
          lemon_variant_one_time_id?: string | null;
          lemon_variant_yearly_id?: string | null;
          long_description?: string | null;
          manifest?: Json | null;
          min_platform_version?: string | null;
          module_type?: string | null;
          name?: string;
          package_hash?: string | null;
          package_url?: string | null;
          pricing_type?: string;
          provided_hooks?: string[] | null;
          published_at?: string | null;
          rating_average?: number | null;
          rating_count?: number | null;
          render_code?: string | null;
          required_permissions?: string[] | null;
          requirements?: string[] | null;
          resources?: Json | null;
          review_count?: number | null;
          screenshots?: string[] | null;
          search_vector?: unknown;
          settings_schema?: Json | null;
          short_id?: string | null;
          slug?: string;
          source?: string | null;
          status?: string | null;
          stripe_price_monthly_id?: string | null;
          stripe_price_yearly_id?: string | null;
          stripe_product_id?: string | null;
          studio_module_id?: string | null;
          studio_version?: string | null;
          styles?: string | null;
          suggested_retail_monthly?: number | null;
          suggested_retail_yearly?: number | null;
          support_url?: string | null;
          tags?: string[] | null;
          updated_at?: string | null;
          wholesale_price_monthly?: number | null;
          wholesale_price_one_time?: number | null;
          wholesale_price_yearly?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "modules_v2_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "modules_v2_developer_profile_id_fkey";
            columns: ["developer_profile_id"];
            isOneToOne: false;
            referencedRelation: "developer_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "modules_v2_studio_module_id_fkey";
            columns: ["studio_module_id"];
            isOneToOne: false;
            referencedRelation: "module_source";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_preferences: {
        Row: {
          digest_frequency: string | null;
          email_billing: boolean | null;
          email_marketing: boolean | null;
          email_security: boolean | null;
          email_team: boolean | null;
          email_updates: boolean | null;
          push_enabled: boolean | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          digest_frequency?: string | null;
          email_billing?: boolean | null;
          email_marketing?: boolean | null;
          email_security?: boolean | null;
          email_team?: boolean | null;
          email_updates?: boolean | null;
          push_enabled?: boolean | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          digest_frequency?: string | null;
          email_billing?: boolean | null;
          email_marketing?: boolean | null;
          email_security?: boolean | null;
          email_team?: boolean | null;
          email_updates?: boolean | null;
          push_enabled?: boolean | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          created_at: string | null;
          id: string;
          link: string | null;
          message: string;
          metadata: Json | null;
          read: boolean | null;
          title: string;
          type: string;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          link?: string | null;
          message: string;
          metadata?: Json | null;
          read?: boolean | null;
          title: string;
          type: string;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          link?: string | null;
          message?: string;
          metadata?: Json | null;
          read?: boolean | null;
          title?: string;
          type?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      paddle_customers: {
        Row: {
          address_city: string | null;
          address_country: string | null;
          address_line1: string | null;
          address_postal_code: string | null;
          agency_id: string;
          created_at: string | null;
          email: string;
          id: string;
          marketing_consent: boolean | null;
          name: string | null;
          paddle_customer_id: string;
          tax_identifier: string | null;
          updated_at: string | null;
        };
        Insert: {
          address_city?: string | null;
          address_country?: string | null;
          address_line1?: string | null;
          address_postal_code?: string | null;
          agency_id: string;
          created_at?: string | null;
          email: string;
          id?: string;
          marketing_consent?: boolean | null;
          name?: string | null;
          paddle_customer_id: string;
          tax_identifier?: string | null;
          updated_at?: string | null;
        };
        Update: {
          address_city?: string | null;
          address_country?: string | null;
          address_line1?: string | null;
          address_postal_code?: string | null;
          agency_id?: string;
          created_at?: string | null;
          email?: string;
          id?: string;
          marketing_consent?: boolean | null;
          name?: string | null;
          paddle_customer_id?: string;
          tax_identifier?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "paddle_customers_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      paddle_products: {
        Row: {
          billing_cycle: string | null;
          created_at: string | null;
          currency: string | null;
          description: string | null;
          display_order: number | null;
          features: Json | null;
          id: string;
          included_ai_actions: number | null;
          included_api_calls: number | null;
          included_automation_runs: number | null;
          is_active: boolean | null;
          max_modules: number | null;
          max_sites: number | null;
          max_team_members: number | null;
          name: string;
          overage_rate_ai: number | null;
          overage_rate_api: number | null;
          overage_rate_automation: number | null;
          paddle_price_id: string | null;
          paddle_product_id: string | null;
          plan_type: string;
          price_cents: number;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          billing_cycle?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          display_order?: number | null;
          features?: Json | null;
          id?: string;
          included_ai_actions?: number | null;
          included_api_calls?: number | null;
          included_automation_runs?: number | null;
          is_active?: boolean | null;
          max_modules?: number | null;
          max_sites?: number | null;
          max_team_members?: number | null;
          name: string;
          overage_rate_ai?: number | null;
          overage_rate_api?: number | null;
          overage_rate_automation?: number | null;
          paddle_price_id?: string | null;
          paddle_product_id?: string | null;
          plan_type: string;
          price_cents: number;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          billing_cycle?: string | null;
          created_at?: string | null;
          currency?: string | null;
          description?: string | null;
          display_order?: number | null;
          features?: Json | null;
          id?: string;
          included_ai_actions?: number | null;
          included_api_calls?: number | null;
          included_automation_runs?: number | null;
          is_active?: boolean | null;
          max_modules?: number | null;
          max_sites?: number | null;
          max_team_members?: number | null;
          name?: string;
          overage_rate_ai?: number | null;
          overage_rate_api?: number | null;
          overage_rate_automation?: number | null;
          paddle_price_id?: string | null;
          paddle_product_id?: string | null;
          plan_type?: string;
          price_cents?: number;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      paddle_subscriptions: {
        Row: {
          agency_id: string;
          billing_cycle: string;
          cancel_at_period_end: boolean | null;
          canceled_at: string | null;
          cancellation_reason: string | null;
          created_at: string | null;
          currency: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          customer_id: string;
          discount_ends_at: string | null;
          discount_id: string | null;
          discount_percentage: number | null;
          id: string;
          included_ai_actions: number | null;
          included_api_calls: number | null;
          included_automation_runs: number | null;
          metadata: Json | null;
          paddle_price_id: string;
          paddle_product_id: string;
          paddle_subscription_id: string;
          paused_at: string | null;
          plan_type: string;
          status: string;
          trial_end: string | null;
          unit_price: number;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          billing_cycle: string;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          customer_id: string;
          discount_ends_at?: string | null;
          discount_id?: string | null;
          discount_percentage?: number | null;
          id?: string;
          included_ai_actions?: number | null;
          included_api_calls?: number | null;
          included_automation_runs?: number | null;
          metadata?: Json | null;
          paddle_price_id: string;
          paddle_product_id: string;
          paddle_subscription_id: string;
          paused_at?: string | null;
          plan_type: string;
          status?: string;
          trial_end?: string | null;
          unit_price: number;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          billing_cycle?: string;
          cancel_at_period_end?: boolean | null;
          canceled_at?: string | null;
          cancellation_reason?: string | null;
          created_at?: string | null;
          currency?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          customer_id?: string;
          discount_ends_at?: string | null;
          discount_id?: string | null;
          discount_percentage?: number | null;
          id?: string;
          included_ai_actions?: number | null;
          included_api_calls?: number | null;
          included_automation_runs?: number | null;
          metadata?: Json | null;
          paddle_price_id?: string;
          paddle_product_id?: string;
          paddle_subscription_id?: string;
          paused_at?: string | null;
          plan_type?: string;
          status?: string;
          trial_end?: string | null;
          unit_price?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "paddle_subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "paddle_subscriptions_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "paddle_customers";
            referencedColumns: ["id"];
          },
        ];
      };
      paddle_transactions: {
        Row: {
          agency_id: string;
          billed_at: string | null;
          billing_period_end: string | null;
          billing_period_start: string | null;
          card_last_four: string | null;
          completed_at: string | null;
          created_at: string | null;
          currency: string | null;
          id: string;
          invoice_url: string | null;
          line_items: Json | null;
          origin: string | null;
          paddle_invoice_id: string | null;
          paddle_invoice_number: string | null;
          paddle_transaction_id: string;
          payment_method: string | null;
          receipt_url: string | null;
          status: string;
          subscription_id: string | null;
          subtotal: number;
          tax: number | null;
          tax_rate: number | null;
          tax_rates: Json | null;
          total: number;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          billed_at?: string | null;
          billing_period_end?: string | null;
          billing_period_start?: string | null;
          card_last_four?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          invoice_url?: string | null;
          line_items?: Json | null;
          origin?: string | null;
          paddle_invoice_id?: string | null;
          paddle_invoice_number?: string | null;
          paddle_transaction_id: string;
          payment_method?: string | null;
          receipt_url?: string | null;
          status: string;
          subscription_id?: string | null;
          subtotal: number;
          tax?: number | null;
          tax_rate?: number | null;
          tax_rates?: Json | null;
          total: number;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          billed_at?: string | null;
          billing_period_end?: string | null;
          billing_period_start?: string | null;
          card_last_four?: string | null;
          completed_at?: string | null;
          created_at?: string | null;
          currency?: string | null;
          id?: string;
          invoice_url?: string | null;
          line_items?: Json | null;
          origin?: string | null;
          paddle_invoice_id?: string | null;
          paddle_invoice_number?: string | null;
          paddle_transaction_id?: string;
          payment_method?: string | null;
          receipt_url?: string | null;
          status?: string;
          subscription_id?: string | null;
          subtotal?: number;
          tax?: number | null;
          tax_rate?: number | null;
          tax_rates?: Json | null;
          total?: number;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "paddle_transactions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "paddle_transactions_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "paddle_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      paddle_webhooks: {
        Row: {
          created_at: string | null;
          error: string | null;
          event_type: string;
          id: string;
          occurred_at: string | null;
          paddle_event_id: string | null;
          payload: Json;
          processed: boolean | null;
          processed_at: string | null;
          received_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          error?: string | null;
          event_type: string;
          id?: string;
          occurred_at?: string | null;
          paddle_event_id?: string | null;
          payload: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          error?: string | null;
          event_type?: string;
          id?: string;
          occurred_at?: string | null;
          paddle_event_id?: string | null;
          payload?: Json;
          processed?: boolean | null;
          processed_at?: string | null;
          received_at?: string | null;
        };
        Relationships: [];
      };
      page_content: {
        Row: {
          content: Json;
          id: string;
          page_id: string;
          updated_at: string | null;
          version: number | null;
        };
        Insert: {
          content?: Json;
          id?: string;
          page_id: string;
          updated_at?: string | null;
          version?: number | null;
        };
        Update: {
          content?: Json;
          id?: string;
          page_id?: string;
          updated_at?: string | null;
          version?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "page_content_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: true;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
        ];
      };
      pages: {
        Row: {
          canonical_url: string | null;
          created_at: string | null;
          id: string;
          is_homepage: boolean | null;
          name: string;
          og_description: string | null;
          og_image_url: string | null;
          og_title: string | null;
          robots_follow: boolean | null;
          robots_index: boolean | null;
          seo_description: string | null;
          seo_image: string | null;
          seo_keywords: string[] | null;
          seo_title: string | null;
          site_id: string;
          slug: string;
          sort_order: number | null;
          updated_at: string | null;
        };
        Insert: {
          canonical_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_homepage?: boolean | null;
          name: string;
          og_description?: string | null;
          og_image_url?: string | null;
          og_title?: string | null;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_keywords?: string[] | null;
          seo_title?: string | null;
          site_id: string;
          slug: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Update: {
          canonical_url?: string | null;
          created_at?: string | null;
          id?: string;
          is_homepage?: boolean | null;
          name?: string;
          og_description?: string | null;
          og_image_url?: string | null;
          og_title?: string | null;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_keywords?: string[] | null;
          seo_title?: string | null;
          site_id?: string;
          slug?: string;
          sort_order?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "pages_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      pending_purchases: {
        Row: {
          agency_id: string;
          client_id: string | null;
          created_at: string;
          currency: string;
          error_details: Json | null;
          error_message: string | null;
          expires_at: string;
          id: string;
          idempotency_key: string;
          last_retry_at: string | null;
          needs_manual_refund: boolean | null;
          paddle_checkout_url: string | null;
          paddle_refund_id: string | null;
          paddle_transaction_id: string | null;
          provisioned_at: string | null;
          provisioned_resource_id: string | null;
          purchase_data: Json;
          purchase_type: string;
          refund_reason: string | null;
          refunded_at: string | null;
          resellerclub_order_id: string | null;
          retail_amount: number;
          retry_count: number | null;
          status: string;
          updated_at: string;
          user_id: string;
          wholesale_amount: number;
        };
        Insert: {
          agency_id: string;
          client_id?: string | null;
          created_at?: string;
          currency?: string;
          error_details?: Json | null;
          error_message?: string | null;
          expires_at?: string;
          id?: string;
          idempotency_key: string;
          last_retry_at?: string | null;
          needs_manual_refund?: boolean | null;
          paddle_checkout_url?: string | null;
          paddle_refund_id?: string | null;
          paddle_transaction_id?: string | null;
          provisioned_at?: string | null;
          provisioned_resource_id?: string | null;
          purchase_data: Json;
          purchase_type: string;
          refund_reason?: string | null;
          refunded_at?: string | null;
          resellerclub_order_id?: string | null;
          retail_amount: number;
          retry_count?: number | null;
          status?: string;
          updated_at?: string;
          user_id: string;
          wholesale_amount: number;
        };
        Update: {
          agency_id?: string;
          client_id?: string | null;
          created_at?: string;
          currency?: string;
          error_details?: Json | null;
          error_message?: string | null;
          expires_at?: string;
          id?: string;
          idempotency_key?: string;
          last_retry_at?: string | null;
          needs_manual_refund?: boolean | null;
          paddle_checkout_url?: string | null;
          paddle_refund_id?: string | null;
          paddle_transaction_id?: string | null;
          provisioned_at?: string | null;
          provisioned_resource_id?: string | null;
          purchase_data?: Json;
          purchase_type?: string;
          refund_reason?: string | null;
          refunded_at?: string | null;
          resellerclub_order_id?: string | null;
          retail_amount?: number;
          retry_count?: number | null;
          status?: string;
          updated_at?: string;
          user_id?: string;
          wholesale_amount?: number;
        };
        Relationships: [
          {
            foreignKeyName: "pending_purchases_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pending_purchases_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      pricing_sync_log: {
        Row: {
          api_calls_made: number | null;
          completed_at: string | null;
          duration_ms: number | null;
          email_products_refreshed: number | null;
          error_details: Json | null;
          error_message: string | null;
          id: string;
          pricing_type: string;
          started_at: string;
          status: string;
          sync_type: string;
          tlds_refreshed: number | null;
          trigger_user_id: string | null;
          triggered_by: string | null;
        };
        Insert: {
          api_calls_made?: number | null;
          completed_at?: string | null;
          duration_ms?: number | null;
          email_products_refreshed?: number | null;
          error_details?: Json | null;
          error_message?: string | null;
          id?: string;
          pricing_type: string;
          started_at?: string;
          status: string;
          sync_type: string;
          tlds_refreshed?: number | null;
          trigger_user_id?: string | null;
          triggered_by?: string | null;
        };
        Update: {
          api_calls_made?: number | null;
          completed_at?: string | null;
          duration_ms?: number | null;
          email_products_refreshed?: number | null;
          error_details?: Json | null;
          error_message?: string | null;
          id?: string;
          pricing_type?: string;
          started_at?: string;
          status?: string;
          sync_type?: string;
          tlds_refreshed?: number | null;
          trigger_user_id?: string | null;
          triggered_by?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          agency_id: string | null;
          avatar_url: string | null;
          created_at: string | null;
          deleted_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          job_title: string | null;
          last_sign_in_at: string | null;
          name: string | null;
          onboarding_completed: boolean | null;
          role: string;
          updated_at: string | null;
        };
        Insert: {
          agency_id?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          job_title?: string | null;
          last_sign_in_at?: string | null;
          name?: string | null;
          onboarding_completed?: boolean | null;
          role?: string;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          deleted_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          job_title?: string | null;
          last_sign_in_at?: string | null;
          name?: string | null;
          onboarding_completed?: boolean | null;
          role?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      push_subscriptions: {
        Row: {
          auth: string;
          context: string;
          conversation_id: string | null;
          created_at: string | null;
          endpoint: string;
          id: string;
          p256dh: string;
          site_id: string | null;
          updated_at: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          auth?: string;
          context?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          endpoint: string;
          id?: string;
          p256dh?: string;
          site_id?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          auth?: string;
          context?: string;
          conversation_id?: string | null;
          created_at?: string | null;
          endpoint?: string;
          id?: string;
          p256dh?: string;
          site_id?: string | null;
          updated_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      rate_limits: {
        Row: {
          action_type: string;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          user_id: string;
        };
        Insert: {
          action_type: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id: string;
        };
        Update: {
          action_type?: string;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          user_id?: string;
        };
        Relationships: [];
      };
      reserved_table_names: {
        Row: {
          category: string | null;
          name: string;
          reason: string;
          reserved_at: string | null;
        };
        Insert: {
          category?: string | null;
          name: string;
          reason: string;
          reserved_at?: string | null;
        };
        Update: {
          category?: string | null;
          name?: string;
          reason?: string;
          reserved_at?: string | null;
        };
        Relationships: [];
      };
      review_votes: {
        Row: {
          created_at: string | null;
          id: string;
          review_id: string;
          user_id: string;
          vote_type: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          review_id: string;
          user_id: string;
          vote_type: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          review_id?: string;
          user_id?: string;
          vote_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey";
            columns: ["review_id"];
            isOneToOne: false;
            referencedRelation: "module_reviews";
            referencedColumns: ["id"];
          },
        ];
      };
      seo_audits: {
        Row: {
          created_at: string | null;
          id: string;
          issues: Json | null;
          page_id: string | null;
          score: number | null;
          site_id: string;
          suggestions: Json | null;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          issues?: Json | null;
          page_id?: string | null;
          score?: number | null;
          site_id: string;
          suggestions?: Json | null;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          issues?: Json | null;
          page_id?: string | null;
          score?: number | null;
          site_id?: string;
          suggestions?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "seo_audits_page_id_fkey";
            columns: ["page_id"];
            isOneToOne: false;
            referencedRelation: "pages";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "seo_audits_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      site_module_installations: {
        Row: {
          agency_subscription_id: string | null;
          client_installation_id: string | null;
          enabled_at: string | null;
          id: string;
          installed_at: string | null;
          installed_by: string | null;
          is_enabled: boolean | null;
          module_id: string;
          settings: Json | null;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          agency_subscription_id?: string | null;
          client_installation_id?: string | null;
          enabled_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          is_enabled?: boolean | null;
          module_id: string;
          settings?: Json | null;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          agency_subscription_id?: string | null;
          client_installation_id?: string | null;
          enabled_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          is_enabled?: boolean | null;
          module_id?: string;
          settings?: Json | null;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_module_installations_agency_subscription_id_fkey";
            columns: ["agency_subscription_id"];
            isOneToOne: false;
            referencedRelation: "agency_module_subscriptions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_module_installations_client_installation_id_fkey";
            columns: ["client_installation_id"];
            isOneToOne: false;
            referencedRelation: "client_module_installations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_module_installations_installed_by_fkey";
            columns: ["installed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_module_installations_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      site_module_versions: {
        Row: {
          activated_at: string | null;
          deactivated_at: string | null;
          id: string;
          installed_at: string | null;
          installed_by: string | null;
          site_module_id: string;
          status: string | null;
          version_id: string;
        };
        Insert: {
          activated_at?: string | null;
          deactivated_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          site_module_id: string;
          status?: string | null;
          version_id: string;
        };
        Update: {
          activated_at?: string | null;
          deactivated_at?: string | null;
          id?: string;
          installed_at?: string | null;
          installed_by?: string | null;
          site_module_id?: string;
          status?: string | null;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "site_module_versions_installed_by_fkey";
            columns: ["installed_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "site_module_versions_version_id_fkey";
            columns: ["version_id"];
            isOneToOne: false;
            referencedRelation: "module_versions";
            referencedColumns: ["id"];
          },
        ];
      };
      site_seo_settings: {
        Row: {
          bing_site_verification: string | null;
          created_at: string | null;
          default_description: string | null;
          default_keywords: string[] | null;
          default_title_template: string | null;
          facebook_pixel_id: string | null;
          google_analytics_id: string | null;
          google_site_verification: string | null;
          id: string;
          og_image_url: string | null;
          organization_logo_url: string | null;
          organization_name: string | null;
          robots_follow: boolean | null;
          robots_index: boolean | null;
          site_id: string;
          twitter_card_type: string | null;
          twitter_handle: string | null;
          updated_at: string | null;
        };
        Insert: {
          bing_site_verification?: string | null;
          created_at?: string | null;
          default_description?: string | null;
          default_keywords?: string[] | null;
          default_title_template?: string | null;
          facebook_pixel_id?: string | null;
          google_analytics_id?: string | null;
          google_site_verification?: string | null;
          id?: string;
          og_image_url?: string | null;
          organization_logo_url?: string | null;
          organization_name?: string | null;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          site_id: string;
          twitter_card_type?: string | null;
          twitter_handle?: string | null;
          updated_at?: string | null;
        };
        Update: {
          bing_site_verification?: string | null;
          created_at?: string | null;
          default_description?: string | null;
          default_keywords?: string[] | null;
          default_title_template?: string | null;
          facebook_pixel_id?: string | null;
          google_analytics_id?: string | null;
          google_site_verification?: string | null;
          id?: string;
          og_image_url?: string | null;
          organization_logo_url?: string | null;
          organization_name?: string | null;
          robots_follow?: boolean | null;
          robots_index?: boolean | null;
          site_id?: string;
          twitter_card_type?: string | null;
          twitter_handle?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "site_seo_settings_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: true;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      sites: {
        Row: {
          agency_id: string;
          bing_site_verification: string | null;
          client_id: string;
          created_at: string | null;
          custom_domain: string | null;
          custom_domain_verified: boolean | null;
          domain_last_checked: string | null;
          domain_verification_token: string | null;
          facebook_pixel_id: string | null;
          google_analytics_id: string | null;
          google_site_verification: string | null;
          id: string;
          name: string;
          published: boolean | null;
          published_at: string | null;
          robots_txt: string | null;
          seo_description: string | null;
          seo_image: string | null;
          seo_title: string | null;
          settings: Json | null;
          sitemap_changefreq: string | null;
          sitemap_enabled: boolean | null;
          sitemap_include_images: boolean | null;
          subdomain: string;
          twitter_handle: string | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          bing_site_verification?: string | null;
          client_id: string;
          created_at?: string | null;
          custom_domain?: string | null;
          custom_domain_verified?: boolean | null;
          domain_last_checked?: string | null;
          domain_verification_token?: string | null;
          facebook_pixel_id?: string | null;
          google_analytics_id?: string | null;
          google_site_verification?: string | null;
          id?: string;
          name: string;
          published?: boolean | null;
          published_at?: string | null;
          robots_txt?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_title?: string | null;
          settings?: Json | null;
          sitemap_changefreq?: string | null;
          sitemap_enabled?: boolean | null;
          sitemap_include_images?: boolean | null;
          subdomain: string;
          twitter_handle?: string | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          bing_site_verification?: string | null;
          client_id?: string;
          created_at?: string | null;
          custom_domain?: string | null;
          custom_domain_verified?: boolean | null;
          domain_last_checked?: string | null;
          domain_verification_token?: string | null;
          facebook_pixel_id?: string | null;
          google_analytics_id?: string | null;
          google_site_verification?: string | null;
          id?: string;
          name?: string;
          published?: boolean | null;
          published_at?: string | null;
          robots_txt?: string | null;
          seo_description?: string | null;
          seo_image?: string | null;
          seo_title?: string | null;
          settings?: Json | null;
          sitemap_changefreq?: string | null;
          sitemap_enabled?: boolean | null;
          sitemap_include_images?: boolean | null;
          subdomain?: string;
          twitter_handle?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "sites_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "sites_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
        ];
      };
      social_accounts: {
        Row: {
          access_token: string;
          account_avatar: string | null;
          account_bio: string | null;
          account_handle: string | null;
          account_name: string;
          account_type: string | null;
          account_url: string | null;
          auto_reply_enabled: boolean | null;
          connected_at: string | null;
          created_at: string | null;
          created_by: string | null;
          engagement_rate: number | null;
          followers_count: number | null;
          following_count: number | null;
          health_check_at: string | null;
          id: string;
          last_error: string | null;
          last_error_at: string | null;
          last_synced_at: string | null;
          metadata: Json | null;
          monitoring_enabled: boolean | null;
          platform: string;
          platform_account_id: string;
          posts_count: number | null;
          refresh_token: string | null;
          scopes: string[] | null;
          settings: Json | null;
          site_id: string;
          status: string | null;
          tenant_id: string;
          token_expires_at: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          access_token: string;
          account_avatar?: string | null;
          account_bio?: string | null;
          account_handle?: string | null;
          account_name: string;
          account_type?: string | null;
          account_url?: string | null;
          auto_reply_enabled?: boolean | null;
          connected_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          engagement_rate?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          health_check_at?: string | null;
          id?: string;
          last_error?: string | null;
          last_error_at?: string | null;
          last_synced_at?: string | null;
          metadata?: Json | null;
          monitoring_enabled?: boolean | null;
          platform: string;
          platform_account_id: string;
          posts_count?: number | null;
          refresh_token?: string | null;
          scopes?: string[] | null;
          settings?: Json | null;
          site_id: string;
          status?: string | null;
          tenant_id: string;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          access_token?: string;
          account_avatar?: string | null;
          account_bio?: string | null;
          account_handle?: string | null;
          account_name?: string;
          account_type?: string | null;
          account_url?: string | null;
          auto_reply_enabled?: boolean | null;
          connected_at?: string | null;
          created_at?: string | null;
          created_by?: string | null;
          engagement_rate?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          health_check_at?: string | null;
          id?: string;
          last_error?: string | null;
          last_error_at?: string | null;
          last_synced_at?: string | null;
          metadata?: Json | null;
          monitoring_enabled?: boolean | null;
          platform?: string;
          platform_account_id?: string;
          posts_count?: number | null;
          refresh_token?: string | null;
          scopes?: string[] | null;
          settings?: Json | null;
          site_id?: string;
          status?: string | null;
          tenant_id?: string;
          token_expires_at?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_accounts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_analytics_daily: {
        Row: {
          account_id: string;
          comments_count: number | null;
          created_at: string | null;
          date: string;
          engagement_rate: number | null;
          followers_change: number | null;
          followers_count: number | null;
          following_count: number | null;
          id: string;
          impressions: number | null;
          likes_count: number | null;
          link_clicks: number | null;
          metadata: Json | null;
          profile_views: number | null;
          reach: number | null;
          saves_count: number | null;
          shares_count: number | null;
          site_id: string;
          updated_at: string | null;
          website_clicks: number | null;
        };
        Insert: {
          account_id: string;
          comments_count?: number | null;
          created_at?: string | null;
          date: string;
          engagement_rate?: number | null;
          followers_change?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          id?: string;
          impressions?: number | null;
          likes_count?: number | null;
          link_clicks?: number | null;
          metadata?: Json | null;
          profile_views?: number | null;
          reach?: number | null;
          saves_count?: number | null;
          shares_count?: number | null;
          site_id: string;
          updated_at?: string | null;
          website_clicks?: number | null;
        };
        Update: {
          account_id?: string;
          comments_count?: number | null;
          created_at?: string | null;
          date?: string;
          engagement_rate?: number | null;
          followers_change?: number | null;
          followers_count?: number | null;
          following_count?: number | null;
          id?: string;
          impressions?: number | null;
          likes_count?: number | null;
          link_clicks?: number | null;
          metadata?: Json | null;
          profile_views?: number | null;
          reach?: number | null;
          saves_count?: number | null;
          shares_count?: number | null;
          site_id?: string;
          updated_at?: string | null;
          website_clicks?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_analytics_daily_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
        ];
      };
      social_approval_requests: {
        Row: {
          approvers: string[] | null;
          created_at: string | null;
          decision_at: string | null;
          decision_by: string | null;
          decision_notes: string | null;
          id: string;
          notes: string | null;
          post_id: string;
          requested_at: string | null;
          requested_by: string;
          site_id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          approvers?: string[] | null;
          created_at?: string | null;
          decision_at?: string | null;
          decision_by?: string | null;
          decision_notes?: string | null;
          id?: string;
          notes?: string | null;
          post_id: string;
          requested_at?: string | null;
          requested_by: string;
          site_id: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approvers?: string[] | null;
          created_at?: string | null;
          decision_at?: string | null;
          decision_by?: string | null;
          decision_notes?: string | null;
          id?: string;
          notes?: string | null;
          post_id?: string;
          requested_at?: string | null;
          requested_by?: string;
          site_id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_approval_requests_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      social_brand_mentions: {
        Row: {
          author_avatar: string | null;
          author_followers: number | null;
          author_handle: string | null;
          author_name: string | null;
          content: string | null;
          created_at: string | null;
          engagement: number | null;
          id: string;
          matched_keywords: string[] | null;
          mentioned_at: string;
          platform: string;
          platform_post_id: string;
          post_url: string | null;
          reach: number | null;
          sentiment: string | null;
          sentiment_score: number | null;
          site_id: string;
          status: string | null;
          tenant_id: string;
        };
        Insert: {
          author_avatar?: string | null;
          author_followers?: number | null;
          author_handle?: string | null;
          author_name?: string | null;
          content?: string | null;
          created_at?: string | null;
          engagement?: number | null;
          id?: string;
          matched_keywords?: string[] | null;
          mentioned_at: string;
          platform: string;
          platform_post_id: string;
          post_url?: string | null;
          reach?: number | null;
          sentiment?: string | null;
          sentiment_score?: number | null;
          site_id: string;
          status?: string | null;
          tenant_id: string;
        };
        Update: {
          author_avatar?: string | null;
          author_followers?: number | null;
          author_handle?: string | null;
          author_name?: string | null;
          content?: string | null;
          created_at?: string | null;
          engagement?: number | null;
          id?: string;
          matched_keywords?: string[] | null;
          mentioned_at?: string;
          platform?: string;
          platform_post_id?: string;
          post_url?: string | null;
          reach?: number | null;
          sentiment?: string | null;
          sentiment_score?: number | null;
          site_id?: string;
          status?: string | null;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_brand_mentions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_calendar_events: {
        Row: {
          all_day: boolean | null;
          color: string | null;
          created_at: string | null;
          created_by: string;
          date: string;
          description: string | null;
          end_time: string | null;
          event_type: string | null;
          icon: string | null;
          id: string;
          metadata: Json | null;
          site_id: string;
          start_time: string | null;
          tenant_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          all_day?: boolean | null;
          color?: string | null;
          created_at?: string | null;
          created_by: string;
          date: string;
          description?: string | null;
          end_time?: string | null;
          event_type?: string | null;
          icon?: string | null;
          id?: string;
          metadata?: Json | null;
          site_id: string;
          start_time?: string | null;
          tenant_id: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          all_day?: boolean | null;
          color?: string | null;
          created_at?: string | null;
          created_by?: string;
          date?: string;
          description?: string | null;
          end_time?: string | null;
          event_type?: string | null;
          icon?: string | null;
          id?: string;
          metadata?: Json | null;
          site_id?: string;
          start_time?: string | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_calendar_events_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_campaigns: {
        Row: {
          budget_amount: number | null;
          budget_currency: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          end_date: string | null;
          goal_metric: string | null;
          goal_target: number | null;
          goal_type: string | null;
          hashtag_performance: Json | null;
          hashtags: string[] | null;
          id: string;
          metadata: Json | null;
          name: string;
          site_id: string;
          start_date: string | null;
          status: string | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          budget_amount?: number | null;
          budget_currency?: string | null;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          end_date?: string | null;
          goal_metric?: string | null;
          goal_target?: number | null;
          goal_type?: string | null;
          hashtag_performance?: Json | null;
          hashtags?: string[] | null;
          id?: string;
          metadata?: Json | null;
          name: string;
          site_id: string;
          start_date?: string | null;
          status?: string | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          budget_amount?: number | null;
          budget_currency?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          end_date?: string | null;
          goal_metric?: string | null;
          goal_target?: number | null;
          goal_type?: string | null;
          hashtag_performance?: Json | null;
          hashtags?: string[] | null;
          id?: string;
          metadata?: Json | null;
          name?: string;
          site_id?: string;
          start_date?: string | null;
          status?: string | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_campaigns_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_competitor_analytics: {
        Row: {
          avg_comments: number | null;
          avg_likes: number | null;
          avg_shares: number | null;
          competitor_id: string;
          created_at: string | null;
          date: string;
          engagement_rate: number | null;
          followers_change: number | null;
          followers_count: number | null;
          id: string;
          posts_count: number | null;
          top_post_engagement: number | null;
          top_post_url: string | null;
        };
        Insert: {
          avg_comments?: number | null;
          avg_likes?: number | null;
          avg_shares?: number | null;
          competitor_id: string;
          created_at?: string | null;
          date: string;
          engagement_rate?: number | null;
          followers_change?: number | null;
          followers_count?: number | null;
          id?: string;
          posts_count?: number | null;
          top_post_engagement?: number | null;
          top_post_url?: string | null;
        };
        Update: {
          avg_comments?: number | null;
          avg_likes?: number | null;
          avg_shares?: number | null;
          competitor_id?: string;
          created_at?: string | null;
          date?: string;
          engagement_rate?: number | null;
          followers_change?: number | null;
          followers_count?: number | null;
          id?: string;
          posts_count?: number | null;
          top_post_engagement?: number | null;
          top_post_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_competitor_analytics_competitor_id_fkey";
            columns: ["competitor_id"];
            isOneToOne: false;
            referencedRelation: "social_competitors";
            referencedColumns: ["id"];
          },
        ];
      };
      social_competitors: {
        Row: {
          avatar_url: string | null;
          avg_engagement_rate: number | null;
          bio: string | null;
          created_at: string | null;
          created_by: string;
          followers_count: number | null;
          following_count: number | null;
          id: string;
          is_active: boolean | null;
          last_synced_at: string | null;
          name: string;
          platform: string;
          platform_handle: string;
          platform_id: string | null;
          posting_frequency: number | null;
          posts_count: number | null;
          site_id: string;
          tenant_id: string;
          updated_at: string | null;
          website_url: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          avg_engagement_rate?: number | null;
          bio?: string | null;
          created_at?: string | null;
          created_by: string;
          followers_count?: number | null;
          following_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_synced_at?: string | null;
          name: string;
          platform: string;
          platform_handle: string;
          platform_id?: string | null;
          posting_frequency?: number | null;
          posts_count?: number | null;
          site_id: string;
          tenant_id: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          avg_engagement_rate?: number | null;
          bio?: string | null;
          created_at?: string | null;
          created_by?: string;
          followers_count?: number | null;
          following_count?: number | null;
          id?: string;
          is_active?: boolean | null;
          last_synced_at?: string | null;
          name?: string;
          platform?: string;
          platform_handle?: string;
          platform_id?: string | null;
          posting_frequency?: number | null;
          posts_count?: number | null;
          site_id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_competitors_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_content_pillars: {
        Row: {
          color: string;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          icon: string | null;
          id: string;
          is_active: boolean | null;
          name: string;
          post_count: number | null;
          site_id: string;
          slug: string;
          sort_order: number | null;
          target_percentage: number | null;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name: string;
          post_count?: number | null;
          site_id: string;
          slug: string;
          sort_order?: number | null;
          target_percentage?: number | null;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          icon?: string | null;
          id?: string;
          is_active?: boolean | null;
          name?: string;
          post_count?: number | null;
          site_id?: string;
          slug?: string;
          sort_order?: number | null;
          target_percentage?: number | null;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_content_pillars_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_hashtag_groups: {
        Row: {
          category: string | null;
          created_at: string | null;
          created_by: string;
          description: string | null;
          hashtags: string[];
          id: string;
          last_used_at: string | null;
          name: string;
          site_id: string;
          tenant_id: string;
          updated_at: string | null;
          use_count: number | null;
        };
        Insert: {
          category?: string | null;
          created_at?: string | null;
          created_by: string;
          description?: string | null;
          hashtags: string[];
          id?: string;
          last_used_at?: string | null;
          name: string;
          site_id: string;
          tenant_id: string;
          updated_at?: string | null;
          use_count?: number | null;
        };
        Update: {
          category?: string | null;
          created_at?: string | null;
          created_by?: string;
          description?: string | null;
          hashtags?: string[];
          id?: string;
          last_used_at?: string | null;
          name?: string;
          site_id?: string;
          tenant_id?: string;
          updated_at?: string | null;
          use_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_hashtag_groups_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_inbox_items: {
        Row: {
          account_id: string;
          assigned_at: string | null;
          assigned_to: string | null;
          author_avatar: string | null;
          author_handle: string | null;
          author_name: string;
          author_profile_url: string | null;
          content: string;
          created_at: string | null;
          id: string;
          item_type: string;
          media: Json | null;
          parent_id: string | null;
          platform: string;
          platform_item_id: string;
          post_id: string | null;
          received_at: string;
          replied_at: string | null;
          replied_by: string | null;
          reply_content: string | null;
          sentiment: string | null;
          site_id: string;
          status: string | null;
          updated_at: string | null;
        };
        Insert: {
          account_id: string;
          assigned_at?: string | null;
          assigned_to?: string | null;
          author_avatar?: string | null;
          author_handle?: string | null;
          author_name: string;
          author_profile_url?: string | null;
          content: string;
          created_at?: string | null;
          id?: string;
          item_type: string;
          media?: Json | null;
          parent_id?: string | null;
          platform: string;
          platform_item_id: string;
          post_id?: string | null;
          received_at: string;
          replied_at?: string | null;
          replied_by?: string | null;
          reply_content?: string | null;
          sentiment?: string | null;
          site_id: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Update: {
          account_id?: string;
          assigned_at?: string | null;
          assigned_to?: string | null;
          author_avatar?: string | null;
          author_handle?: string | null;
          author_name?: string;
          author_profile_url?: string | null;
          content?: string;
          created_at?: string | null;
          id?: string;
          item_type?: string;
          media?: Json | null;
          parent_id?: string | null;
          platform?: string;
          platform_item_id?: string;
          post_id?: string | null;
          received_at?: string;
          replied_at?: string | null;
          replied_by?: string | null;
          reply_content?: string | null;
          sentiment?: string | null;
          site_id?: string;
          status?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_inbox_items_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_inbox_items_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      social_listening_keywords: {
        Row: {
          created_at: string | null;
          created_by: string;
          id: string;
          is_active: boolean | null;
          keyword: string;
          keyword_type: string | null;
          last_mention_at: string | null;
          mentions_count: number | null;
          site_id: string;
          tenant_id: string;
        };
        Insert: {
          created_at?: string | null;
          created_by: string;
          id?: string;
          is_active?: boolean | null;
          keyword: string;
          keyword_type?: string | null;
          last_mention_at?: string | null;
          mentions_count?: number | null;
          site_id: string;
          tenant_id: string;
        };
        Update: {
          created_at?: string | null;
          created_by?: string;
          id?: string;
          is_active?: boolean | null;
          keyword?: string;
          keyword_type?: string | null;
          last_mention_at?: string | null;
          mentions_count?: number | null;
          site_id?: string;
          tenant_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_listening_keywords_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_media_folders: {
        Row: {
          color: string | null;
          created_at: string | null;
          created_by: string;
          id: string;
          item_count: number | null;
          name: string;
          parent_id: string | null;
          site_id: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          color?: string | null;
          created_at?: string | null;
          created_by: string;
          id?: string;
          item_count?: number | null;
          name: string;
          parent_id?: string | null;
          site_id: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          color?: string | null;
          created_at?: string | null;
          created_by?: string;
          id?: string;
          item_count?: number | null;
          name?: string;
          parent_id?: string | null;
          site_id?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_media_folders_parent_id_fkey";
            columns: ["parent_id"];
            isOneToOne: false;
            referencedRelation: "social_media_folders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_media_folders_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_media_library: {
        Row: {
          alt_text: string | null;
          caption: string | null;
          created_at: string | null;
          duration_seconds: number | null;
          file_name: string;
          file_size: number | null;
          file_type: string;
          folder: string | null;
          height: number | null;
          id: string;
          last_used_at: string | null;
          metadata: Json | null;
          mime_type: string | null;
          site_id: string;
          tags: string[] | null;
          tenant_id: string;
          thumbnail_url: string | null;
          updated_at: string | null;
          uploaded_by: string;
          url: string;
          use_count: number | null;
          width: number | null;
        };
        Insert: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          file_name: string;
          file_size?: number | null;
          file_type: string;
          folder?: string | null;
          height?: number | null;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          site_id: string;
          tags?: string[] | null;
          tenant_id: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          uploaded_by: string;
          url: string;
          use_count?: number | null;
          width?: number | null;
        };
        Update: {
          alt_text?: string | null;
          caption?: string | null;
          created_at?: string | null;
          duration_seconds?: number | null;
          file_name?: string;
          file_size?: number | null;
          file_type?: string;
          folder?: string | null;
          height?: number | null;
          id?: string;
          last_used_at?: string | null;
          metadata?: Json | null;
          mime_type?: string | null;
          site_id?: string;
          tags?: string[] | null;
          tenant_id?: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
          uploaded_by?: string;
          url?: string;
          use_count?: number | null;
          width?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_media_library_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_oauth_states: {
        Row: {
          code_verifier: string | null;
          created_at: string | null;
          expires_at: string;
          id: string;
          platform: string;
          site_id: string;
          state: string;
          tenant_id: string;
          user_id: string;
        };
        Insert: {
          code_verifier?: string | null;
          created_at?: string | null;
          expires_at: string;
          id?: string;
          platform: string;
          site_id: string;
          state: string;
          tenant_id: string;
          user_id: string;
        };
        Update: {
          code_verifier?: string | null;
          created_at?: string | null;
          expires_at?: string;
          id?: string;
          platform?: string;
          site_id?: string;
          state?: string;
          tenant_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "social_oauth_states_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_optimal_times: {
        Row: {
          account_id: string | null;
          avg_engagement_rate: number | null;
          created_at: string | null;
          day_of_week: number;
          hour: number;
          id: string;
          last_calculated_at: string | null;
          platform: string;
          sample_size: number | null;
          score: number;
          site_id: string;
          updated_at: string | null;
        };
        Insert: {
          account_id?: string | null;
          avg_engagement_rate?: number | null;
          created_at?: string | null;
          day_of_week: number;
          hour: number;
          id?: string;
          last_calculated_at?: string | null;
          platform: string;
          sample_size?: number | null;
          score?: number;
          site_id: string;
          updated_at?: string | null;
        };
        Update: {
          account_id?: string | null;
          avg_engagement_rate?: number | null;
          created_at?: string | null;
          day_of_week?: number;
          hour?: number;
          id?: string;
          last_calculated_at?: string | null;
          platform?: string;
          sample_size?: number | null;
          score?: number;
          site_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_optimal_times_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_optimal_times_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_post_analytics: {
        Row: {
          account_id: string;
          best_performing_time: string | null;
          click_through_rate: number | null;
          comments_count: number | null;
          created_at: string | null;
          engagement_rate: number | null;
          id: string;
          impressions: number | null;
          last_synced_at: string | null;
          likes_count: number | null;
          link_clicks: number | null;
          platform: string;
          platform_post_id: string | null;
          post_id: string;
          reach: number | null;
          reactions: Json | null;
          saves_count: number | null;
          shares_count: number | null;
          site_id: string;
          updated_at: string | null;
          video_completion_rate: number | null;
          video_views: number | null;
          video_watch_time_seconds: number | null;
        };
        Insert: {
          account_id: string;
          best_performing_time?: string | null;
          click_through_rate?: number | null;
          comments_count?: number | null;
          created_at?: string | null;
          engagement_rate?: number | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          likes_count?: number | null;
          link_clicks?: number | null;
          platform: string;
          platform_post_id?: string | null;
          post_id: string;
          reach?: number | null;
          reactions?: Json | null;
          saves_count?: number | null;
          shares_count?: number | null;
          site_id: string;
          updated_at?: string | null;
          video_completion_rate?: number | null;
          video_views?: number | null;
          video_watch_time_seconds?: number | null;
        };
        Update: {
          account_id?: string;
          best_performing_time?: string | null;
          click_through_rate?: number | null;
          comments_count?: number | null;
          created_at?: string | null;
          engagement_rate?: number | null;
          id?: string;
          impressions?: number | null;
          last_synced_at?: string | null;
          likes_count?: number | null;
          link_clicks?: number | null;
          platform?: string;
          platform_post_id?: string | null;
          post_id?: string;
          reach?: number | null;
          reactions?: Json | null;
          saves_count?: number | null;
          shares_count?: number | null;
          site_id?: string;
          updated_at?: string | null;
          video_completion_rate?: number | null;
          video_views?: number | null;
          video_watch_time_seconds?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_post_analytics_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_post_analytics_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      social_posts: {
        Row: {
          approval_notes: string | null;
          approved_at: string | null;
          approved_by: string | null;
          campaign_id: string | null;
          content: string;
          content_html: string | null;
          content_pillar: string | null;
          created_at: string | null;
          created_by: string;
          error_message: string | null;
          first_comment: string | null;
          first_comment_delay_minutes: number | null;
          id: string;
          labels: string[] | null;
          link_preview: Json | null;
          link_url: string | null;
          media: Json | null;
          metadata: Json | null;
          platform_content: Json | null;
          published_at: string | null;
          rejected_at: string | null;
          rejected_by: string | null;
          rejection_reason: string | null;
          requires_approval: boolean | null;
          retry_count: number | null;
          scheduled_at: string | null;
          site_id: string;
          status: string | null;
          target_accounts: string[];
          tenant_id: string;
          timezone: string | null;
          updated_at: string | null;
        };
        Insert: {
          approval_notes?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          campaign_id?: string | null;
          content: string;
          content_html?: string | null;
          content_pillar?: string | null;
          created_at?: string | null;
          created_by: string;
          error_message?: string | null;
          first_comment?: string | null;
          first_comment_delay_minutes?: number | null;
          id?: string;
          labels?: string[] | null;
          link_preview?: Json | null;
          link_url?: string | null;
          media?: Json | null;
          metadata?: Json | null;
          platform_content?: Json | null;
          published_at?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          requires_approval?: boolean | null;
          retry_count?: number | null;
          scheduled_at?: string | null;
          site_id: string;
          status?: string | null;
          target_accounts: string[];
          tenant_id: string;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Update: {
          approval_notes?: string | null;
          approved_at?: string | null;
          approved_by?: string | null;
          campaign_id?: string | null;
          content?: string;
          content_html?: string | null;
          content_pillar?: string | null;
          created_at?: string | null;
          created_by?: string;
          error_message?: string | null;
          first_comment?: string | null;
          first_comment_delay_minutes?: number | null;
          id?: string;
          labels?: string[] | null;
          link_preview?: Json | null;
          link_url?: string | null;
          media?: Json | null;
          metadata?: Json | null;
          platform_content?: Json | null;
          published_at?: string | null;
          rejected_at?: string | null;
          rejected_by?: string | null;
          rejection_reason?: string | null;
          requires_approval?: boolean | null;
          retry_count?: number | null;
          scheduled_at?: string | null;
          site_id?: string;
          status?: string | null;
          target_accounts?: string[];
          tenant_id?: string;
          timezone?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_posts_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_publish_log: {
        Row: {
          account_id: string;
          created_at: string | null;
          error_message: string | null;
          id: string;
          platform: string;
          platform_post_id: string | null;
          platform_url: string | null;
          post_id: string;
          published_at: string | null;
          retry_count: number | null;
          site_id: string;
          status: string;
          updated_at: string | null;
        };
        Insert: {
          account_id: string;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          platform: string;
          platform_post_id?: string | null;
          platform_url?: string | null;
          post_id: string;
          published_at?: string | null;
          retry_count?: number | null;
          site_id: string;
          status: string;
          updated_at?: string | null;
        };
        Update: {
          account_id?: string;
          created_at?: string | null;
          error_message?: string | null;
          id?: string;
          platform?: string;
          platform_post_id?: string | null;
          platform_url?: string | null;
          post_id?: string;
          published_at?: string | null;
          retry_count?: number | null;
          site_id?: string;
          status?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_publish_log_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "social_accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "social_publish_log_post_id_fkey";
            columns: ["post_id"];
            isOneToOne: false;
            referencedRelation: "social_posts";
            referencedColumns: ["id"];
          },
        ];
      };
      social_reports: {
        Row: {
          account_ids: string[] | null;
          created_at: string | null;
          created_by: string;
          date_range_type: string | null;
          description: string | null;
          filters: Json | null;
          id: string;
          is_scheduled: boolean | null;
          last_generated_at: string | null;
          last_sent_at: string | null;
          metrics: string[] | null;
          name: string;
          report_type: string;
          schedule_day: number | null;
          schedule_frequency: string | null;
          schedule_recipients: string[] | null;
          schedule_time: string | null;
          site_id: string;
          tenant_id: string;
          updated_at: string | null;
        };
        Insert: {
          account_ids?: string[] | null;
          created_at?: string | null;
          created_by: string;
          date_range_type?: string | null;
          description?: string | null;
          filters?: Json | null;
          id?: string;
          is_scheduled?: boolean | null;
          last_generated_at?: string | null;
          last_sent_at?: string | null;
          metrics?: string[] | null;
          name: string;
          report_type: string;
          schedule_day?: number | null;
          schedule_frequency?: string | null;
          schedule_recipients?: string[] | null;
          schedule_time?: string | null;
          site_id: string;
          tenant_id: string;
          updated_at?: string | null;
        };
        Update: {
          account_ids?: string[] | null;
          created_at?: string | null;
          created_by?: string;
          date_range_type?: string | null;
          description?: string | null;
          filters?: Json | null;
          id?: string;
          is_scheduled?: boolean | null;
          last_generated_at?: string | null;
          last_sent_at?: string | null;
          metrics?: string[] | null;
          name?: string;
          report_type?: string;
          schedule_day?: number | null;
          schedule_frequency?: string | null;
          schedule_recipients?: string[] | null;
          schedule_time?: string | null;
          site_id?: string;
          tenant_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_reports_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      social_saved_replies: {
        Row: {
          category: string | null;
          content: string;
          created_at: string | null;
          created_by: string;
          id: string;
          last_used_at: string | null;
          shortcut: string | null;
          site_id: string;
          tags: string[] | null;
          tenant_id: string;
          title: string;
          updated_at: string | null;
          use_count: number | null;
        };
        Insert: {
          category?: string | null;
          content: string;
          created_at?: string | null;
          created_by: string;
          id?: string;
          last_used_at?: string | null;
          shortcut?: string | null;
          site_id: string;
          tags?: string[] | null;
          tenant_id: string;
          title: string;
          updated_at?: string | null;
          use_count?: number | null;
        };
        Update: {
          category?: string | null;
          content?: string;
          created_at?: string | null;
          created_by?: string;
          id?: string;
          last_used_at?: string | null;
          shortcut?: string | null;
          site_id?: string;
          tags?: string[] | null;
          tenant_id?: string;
          title?: string;
          updated_at?: string | null;
          use_count?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: "social_saved_replies_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      step_execution_logs: {
        Row: {
          attempt_number: number | null;
          completed_at: string | null;
          created_at: string | null;
          duration_ms: number | null;
          error: string | null;
          error_code: string | null;
          error_stack: string | null;
          execution_id: string;
          id: string;
          input_data: Json | null;
          notes: string | null;
          output_data: Json | null;
          started_at: string | null;
          status: string;
          step_id: string;
        };
        Insert: {
          attempt_number?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error?: string | null;
          error_code?: string | null;
          error_stack?: string | null;
          execution_id: string;
          id?: string;
          input_data?: Json | null;
          notes?: string | null;
          output_data?: Json | null;
          started_at?: string | null;
          status: string;
          step_id: string;
        };
        Update: {
          attempt_number?: number | null;
          completed_at?: string | null;
          created_at?: string | null;
          duration_ms?: number | null;
          error?: string | null;
          error_code?: string | null;
          error_stack?: string | null;
          execution_id?: string;
          id?: string;
          input_data?: Json | null;
          notes?: string | null;
          output_data?: Json | null;
          started_at?: string | null;
          status?: string;
          step_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "step_execution_logs_execution_id_fkey";
            columns: ["execution_id"];
            isOneToOne: false;
            referencedRelation: "workflow_executions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "step_execution_logs_step_id_fkey";
            columns: ["step_id"];
            isOneToOne: false;
            referencedRelation: "workflow_steps";
            referencedColumns: ["id"];
          },
        ];
      };
      subscriptions: {
        Row: {
          agency_id: string;
          cancelled_at: string | null;
          created_at: string | null;
          current_period_end: string | null;
          current_period_start: string | null;
          ends_at: string | null;
          id: string;
          lemonsqueezy_customer_id: string | null;
          lemonsqueezy_subscription_id: string | null;
          lemonsqueezy_variant_id: string | null;
          plan_id: string;
          status: string;
          trial_ends_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          ends_at?: string | null;
          id?: string;
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          lemonsqueezy_variant_id?: string | null;
          plan_id?: string;
          status?: string;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          cancelled_at?: string | null;
          created_at?: string | null;
          current_period_end?: string | null;
          current_period_start?: string | null;
          ends_at?: string | null;
          id?: string;
          lemonsqueezy_customer_id?: string | null;
          lemonsqueezy_subscription_id?: string | null;
          lemonsqueezy_variant_id?: string | null;
          plan_id?: string;
          status?: string;
          trial_ends_at?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "subscriptions_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: true;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      support_tickets: {
        Row: {
          assigned_to: string | null;
          category: string | null;
          client_id: string;
          created_at: string | null;
          description: string;
          id: string;
          priority: string | null;
          resolved_at: string | null;
          site_id: string | null;
          status: string | null;
          subject: string;
          ticket_number: string;
          updated_at: string | null;
        };
        Insert: {
          assigned_to?: string | null;
          category?: string | null;
          client_id: string;
          created_at?: string | null;
          description: string;
          id?: string;
          priority?: string | null;
          resolved_at?: string | null;
          site_id?: string | null;
          status?: string | null;
          subject: string;
          ticket_number: string;
          updated_at?: string | null;
        };
        Update: {
          assigned_to?: string | null;
          category?: string | null;
          client_id?: string;
          created_at?: string | null;
          description?: string;
          id?: string;
          priority?: string | null;
          resolved_at?: string | null;
          site_id?: string | null;
          status?: string | null;
          subject?: string;
          ticket_number?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "support_tickets_assigned_to_fkey";
            columns: ["assigned_to"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_client_id_fkey";
            columns: ["client_id"];
            isOneToOne: false;
            referencedRelation: "clients";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "support_tickets_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      templates: {
        Row: {
          agency_id: string | null;
          category: string;
          content: Json;
          created_at: string | null;
          created_by: string | null;
          description: string | null;
          id: string;
          is_public: boolean | null;
          name: string;
          thumbnail_url: string | null;
          updated_at: string | null;
        };
        Insert: {
          agency_id?: string | null;
          category: string;
          content: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string | null;
          category?: string;
          content?: Json;
          created_at?: string | null;
          created_by?: string | null;
          description?: string | null;
          id?: string;
          is_public?: boolean | null;
          name?: string;
          thumbnail_url?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "templates_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      test_site_configuration: {
        Row: {
          allowed_module_statuses: string[] | null;
          created_at: string | null;
          created_by: string | null;
          expires_at: string | null;
          id: string;
          is_active: boolean | null;
          notes: string | null;
          site_id: string;
          test_features: string[] | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_module_statuses?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          site_id: string;
          test_features?: string[] | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_module_statuses?: string[] | null;
          created_at?: string | null;
          created_by?: string | null;
          expires_at?: string | null;
          id?: string;
          is_active?: boolean | null;
          notes?: string | null;
          site_id?: string;
          test_features?: string[] | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "test_site_configuration_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: true;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      ticket_messages: {
        Row: {
          attachments: Json | null;
          created_at: string | null;
          id: string;
          message: string;
          sender_id: string;
          sender_name: string;
          sender_type: string;
          ticket_id: string;
        };
        Insert: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          message: string;
          sender_id: string;
          sender_name: string;
          sender_type: string;
          ticket_id: string;
        };
        Update: {
          attachments?: Json | null;
          created_at?: string | null;
          id?: string;
          message?: string;
          sender_id?: string;
          sender_name?: string;
          sender_type?: string;
          ticket_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey";
            columns: ["ticket_id"];
            isOneToOne: false;
            referencedRelation: "support_tickets";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_billing_period: {
        Row: {
          agency_id: string;
          ai_actions: number | null;
          api_calls: number | null;
          automation_runs: number | null;
          created_at: string | null;
          id: string;
          included_ai_actions: number | null;
          included_api_calls: number | null;
          included_automation_runs: number | null;
          overage_ai_actions: number | null;
          overage_api_calls: number | null;
          overage_automation_runs: number | null;
          overage_cost: number | null;
          period_end: string;
          period_start: string;
          reported_at: string | null;
          reported_to_paddle: boolean | null;
          subscription_id: string;
          updated_at: string | null;
        };
        Insert: {
          agency_id: string;
          ai_actions?: number | null;
          api_calls?: number | null;
          automation_runs?: number | null;
          created_at?: string | null;
          id?: string;
          included_ai_actions?: number | null;
          included_api_calls?: number | null;
          included_automation_runs?: number | null;
          overage_ai_actions?: number | null;
          overage_api_calls?: number | null;
          overage_automation_runs?: number | null;
          overage_cost?: number | null;
          period_end: string;
          period_start: string;
          reported_at?: string | null;
          reported_to_paddle?: boolean | null;
          subscription_id: string;
          updated_at?: string | null;
        };
        Update: {
          agency_id?: string;
          ai_actions?: number | null;
          api_calls?: number | null;
          automation_runs?: number | null;
          created_at?: string | null;
          id?: string;
          included_ai_actions?: number | null;
          included_api_calls?: number | null;
          included_automation_runs?: number | null;
          overage_ai_actions?: number | null;
          overage_api_calls?: number | null;
          overage_automation_runs?: number | null;
          overage_cost?: number | null;
          period_end?: string;
          period_start?: string;
          reported_at?: string | null;
          reported_to_paddle?: boolean | null;
          subscription_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "usage_billing_period_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_billing_period_subscription_id_fkey";
            columns: ["subscription_id"];
            isOneToOne: false;
            referencedRelation: "paddle_subscriptions";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_daily: {
        Row: {
          agency_id: string;
          ai_actions: number | null;
          api_calls: number | null;
          automation_runs: number | null;
          created_at: string | null;
          date: string;
          id: string;
          usage_by_site: Json | null;
        };
        Insert: {
          agency_id: string;
          ai_actions?: number | null;
          api_calls?: number | null;
          automation_runs?: number | null;
          created_at?: string | null;
          date: string;
          id?: string;
          usage_by_site?: Json | null;
        };
        Update: {
          agency_id?: string;
          ai_actions?: number | null;
          api_calls?: number | null;
          automation_runs?: number | null;
          created_at?: string | null;
          date?: string;
          id?: string;
          usage_by_site?: Json | null;
        };
        Relationships: [
          {
            foreignKeyName: "usage_daily_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
        ];
      };
      usage_hourly: {
        Row: {
          agency_id: string;
          ai_actions: number | null;
          ai_by_agent: Json | null;
          api_by_endpoint: Json | null;
          api_calls: number | null;
          automation_by_workflow: Json | null;
          automation_runs: number | null;
          created_at: string | null;
          hour_timestamp: string;
          id: string;
          site_id: string;
        };
        Insert: {
          agency_id: string;
          ai_actions?: number | null;
          ai_by_agent?: Json | null;
          api_by_endpoint?: Json | null;
          api_calls?: number | null;
          automation_by_workflow?: Json | null;
          automation_runs?: number | null;
          created_at?: string | null;
          hour_timestamp: string;
          id?: string;
          site_id: string;
        };
        Update: {
          agency_id?: string;
          ai_actions?: number | null;
          ai_by_agent?: Json | null;
          api_by_endpoint?: Json | null;
          api_calls?: number | null;
          automation_by_workflow?: Json | null;
          automation_runs?: number | null;
          created_at?: string | null;
          hour_timestamp?: string;
          id?: string;
          site_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "usage_hourly_agency_id_fkey";
            columns: ["agency_id"];
            isOneToOne: false;
            referencedRelation: "agencies";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "usage_hourly_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
        ];
      };
      user_search_history: {
        Row: {
          created_at: string | null;
          filters: Json | null;
          id: string;
          query: string;
          result_count: number | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          filters?: Json | null;
          id?: string;
          query: string;
          result_count?: number | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          filters?: Json | null;
          id?: string;
          query?: string;
          result_count?: number | null;
          user_id?: string;
        };
        Relationships: [];
      };
      workflow_executions: {
        Row: {
          attempt_number: number | null;
          completed_at: string | null;
          context: Json | null;
          created_at: string | null;
          current_step_id: string | null;
          current_step_index: number | null;
          duration_ms: number | null;
          error: string | null;
          error_details: Json | null;
          id: string;
          output: Json | null;
          parent_execution_id: string | null;
          paused_at: string | null;
          resume_at: string | null;
          site_id: string;
          started_at: string | null;
          status: string;
          steps_completed: number | null;
          steps_total: number | null;
          trigger_data: Json | null;
          trigger_event_id: string | null;
          trigger_type: string;
          workflow_id: string;
        };
        Insert: {
          attempt_number?: number | null;
          completed_at?: string | null;
          context?: Json | null;
          created_at?: string | null;
          current_step_id?: string | null;
          current_step_index?: number | null;
          duration_ms?: number | null;
          error?: string | null;
          error_details?: Json | null;
          id?: string;
          output?: Json | null;
          parent_execution_id?: string | null;
          paused_at?: string | null;
          resume_at?: string | null;
          site_id: string;
          started_at?: string | null;
          status?: string;
          steps_completed?: number | null;
          steps_total?: number | null;
          trigger_data?: Json | null;
          trigger_event_id?: string | null;
          trigger_type: string;
          workflow_id: string;
        };
        Update: {
          attempt_number?: number | null;
          completed_at?: string | null;
          context?: Json | null;
          created_at?: string | null;
          current_step_id?: string | null;
          current_step_index?: number | null;
          duration_ms?: number | null;
          error?: string | null;
          error_details?: Json | null;
          id?: string;
          output?: Json | null;
          parent_execution_id?: string | null;
          paused_at?: string | null;
          resume_at?: string | null;
          site_id?: string;
          started_at?: string | null;
          status?: string;
          steps_completed?: number | null;
          steps_total?: number | null;
          trigger_data?: Json | null;
          trigger_event_id?: string | null;
          trigger_type?: string;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_executions_parent_execution_id_fkey";
            columns: ["parent_execution_id"];
            isOneToOne: false;
            referencedRelation: "workflow_executions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_executions_site_id_fkey";
            columns: ["site_id"];
            isOneToOne: false;
            referencedRelation: "sites";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_steps: {
        Row: {
          action_config: Json | null;
          action_type: string | null;
          condition_config: Json | null;
          created_at: string | null;
          delay_config: Json | null;
          description: string | null;
          error_branch_step_id: string | null;
          id: string;
          input_mapping: Json | null;
          is_active: boolean | null;
          loop_config: Json | null;
          max_retries: number | null;
          name: string | null;
          on_error: string | null;
          output_key: string | null;
          parallel_config: Json | null;
          position: number;
          position_x: number | null;
          position_y: number | null;
          retry_delay_seconds: number | null;
          step_type: string;
          updated_at: string | null;
          workflow_id: string;
        };
        Insert: {
          action_config?: Json | null;
          action_type?: string | null;
          condition_config?: Json | null;
          created_at?: string | null;
          delay_config?: Json | null;
          description?: string | null;
          error_branch_step_id?: string | null;
          id?: string;
          input_mapping?: Json | null;
          is_active?: boolean | null;
          loop_config?: Json | null;
          max_retries?: number | null;
          name?: string | null;
          on_error?: string | null;
          output_key?: string | null;
          parallel_config?: Json | null;
          position: number;
          position_x?: number | null;
          position_y?: number | null;
          retry_delay_seconds?: number | null;
          step_type: string;
          updated_at?: string | null;
          workflow_id: string;
        };
        Update: {
          action_config?: Json | null;
          action_type?: string | null;
          condition_config?: Json | null;
          created_at?: string | null;
          delay_config?: Json | null;
          description?: string | null;
          error_branch_step_id?: string | null;
          id?: string;
          input_mapping?: Json | null;
          is_active?: boolean | null;
          loop_config?: Json | null;
          max_retries?: number | null;
          name?: string | null;
          on_error?: string | null;
          output_key?: string | null;
          parallel_config?: Json | null;
          position?: number;
          position_x?: number | null;
          position_y?: number | null;
          retry_delay_seconds?: number | null;
          step_type?: string;
          updated_at?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "fk_error_branch";
            columns: ["error_branch_step_id"];
            isOneToOne: false;
            referencedRelation: "workflow_steps";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
      workflow_variables: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: string;
          is_secret: boolean | null;
          key: string;
          updated_at: string | null;
          value: Json;
          value_type: string | null;
          workflow_id: string;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_secret?: boolean | null;
          key: string;
          updated_at?: string | null;
          value: Json;
          value_type?: string | null;
          workflow_id: string;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: string;
          is_secret?: boolean | null;
          key?: string;
          updated_at?: string | null;
          value?: Json;
          value_type?: string | null;
          workflow_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "workflow_variables_workflow_id_fkey";
            columns: ["workflow_id"];
            isOneToOne: false;
            referencedRelation: "automation_workflows";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      module_database_overview: {
        Row: {
          actual_tables: unknown[] | null;
          created_at: string | null;
          module_id: string | null;
          module_name: string | null;
          module_short_id: string | null;
          module_version: string | null;
          schema_name: string | null;
          table_count: number | null;
          table_names: string[] | null;
          updated_at: string | null;
          uses_schema: boolean | null;
        };
        Insert: {
          actual_tables?: never;
          created_at?: string | null;
          module_id?: string | null;
          module_name?: string | null;
          module_short_id?: string | null;
          module_version?: string | null;
          schema_name?: string | null;
          table_count?: never;
          table_names?: string[] | null;
          updated_at?: string | null;
          uses_schema?: boolean | null;
        };
        Update: {
          actual_tables?: never;
          created_at?: string | null;
          module_id?: string | null;
          module_name?: string | null;
          module_short_id?: string | null;
          module_version?: string | null;
          schema_name?: string | null;
          table_count?: never;
          table_names?: string[] | null;
          updated_at?: string | null;
          uses_schema?: boolean | null;
        };
        Relationships: [];
      };
      orphaned_module_tables: {
        Row: {
          issue: string | null;
          short_id: string | null;
          table_name: unknown;
          table_schema: unknown;
        };
        Relationships: [];
      };
    };
    Functions: {
      aggregate_daily_usage: { Args: { p_date?: string }; Returns: number };
      aggregate_module_analytics_daily: { Args: never; Returns: undefined };
      auto_close_stale_conversations: { Args: never; Returns: number };
      calculate_domain_retail_price: {
        Args: { p_agency_id: string; p_tld: string; p_wholesale_price: number };
        Returns: number;
      };
      calculate_next_run: {
        Args: { p_after?: string; p_cron: string; p_timezone?: string };
        Returns: string;
      };
      calculate_overage: {
        Args: { p_subscription_id: string };
        Returns: {
          overage_ai: number;
          overage_api: number;
          overage_automation: number;
          overage_cost_cents: number;
        }[];
      };
      calculate_reading_time: {
        Args: { content_text: string };
        Returns: number;
      };
      calculate_retail_price: {
        Args: {
          p_custom_price: number;
          p_markup_fixed_amount: number;
          p_markup_percentage: number;
          p_markup_type: string;
          wholesale_cents: number;
        };
        Returns: number;
      };
      can_access_client: {
        Args: { check_client_id: string };
        Returns: boolean;
      };
      can_access_page: { Args: { check_page_id: string }; Returns: boolean };
      can_access_site: { Args: { check_site_id: string }; Returns: boolean };
      can_manage_modules: {
        Args: { check_agency_id: string };
        Returns: boolean;
      };
      check_and_update_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_minutes?: number };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        }[];
      };
      check_api_daily_limit: {
        Args: { p_consumer_id: string };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        }[];
      };
      check_api_rate_limit: {
        Args: { p_consumer_id: string; p_window_minutes?: number };
        Returns: {
          allowed: boolean;
          remaining: number;
          reset_at: string;
        }[];
      };
      check_module_permission: {
        Args: {
          p_module_id: string;
          p_permission: string;
          p_site_id: string;
          p_user_id: string;
        };
        Returns: boolean;
      };
      check_table_exists: { Args: { p_table_name: string }; Returns: boolean };
      cleanup_expired_module_sessions: { Args: never; Returns: undefined };
      cleanup_expired_oauth_codes: { Args: never; Returns: undefined };
      cleanup_expired_oauth_states: { Args: never; Returns: undefined };
      cleanup_expired_pending_purchases: { Args: never; Returns: number };
      cleanup_expired_refresh_tokens: { Args: never; Returns: undefined };
      cleanup_module_database: {
        Args: {
          p_dry_run?: boolean;
          p_module_short_id: string;
          p_uses_schema: boolean;
        };
        Returns: {
          action: string;
          executed: boolean;
          object_name: string;
          object_type: string;
        }[];
      };
      cleanup_old_api_logs: { Args: never; Returns: undefined };
      cleanup_old_rate_limits: { Args: never; Returns: undefined };
      cleanup_old_webhook_logs: { Args: never; Returns: undefined };
      cleanup_orphaned_module_tables: {
        Args: { p_dry_run?: boolean; p_short_id: string };
        Returns: {
          action: string;
          executed: boolean;
          object_name: string;
        }[];
      };
      cleanup_rate_limits: { Args: never; Returns: number };
      cleanup_stale_push_subscriptions: { Args: never; Returns: number };
      compare_semver: { Args: { v1: string; v2: string }; Returns: number };
      count_module_rows: {
        Args: { p_module_short_id: string; p_uses_schema: boolean };
        Returns: number;
      };
      create_module_table: {
        Args: { p_columns: string; p_module_id: string; p_table_name: string };
        Returns: undefined;
      };
      current_agency_id: { Args: never; Returns: string };
      current_site_id: { Args: never; Returns: string };
      current_user_id: { Args: never; Returns: string };
      decrement_module_installations: {
        Args: { sub_id: string };
        Returns: undefined;
      };
      drop_module_table: {
        Args: { p_module_id: string; p_table_name: string };
        Returns: undefined;
      };
      exec_ddl: { Args: { ddl_command: string }; Returns: undefined };
      exec_sql: { Args: { sql: string }; Returns: undefined };
      execute_ddl: { Args: { sql_statement: string }; Returns: undefined };
      execute_module_query: {
        Args: {
          p_module_id: string;
          p_params?: Json;
          p_site_id: string;
          p_sql: string;
        };
        Returns: Json;
      };
      extract_module_short_id: {
        Args: { p_table_name: string };
        Returns: string;
      };
      generate_api_key: { Args: never; Returns: string };
      generate_daily_analytics_snapshot: {
        Args: { p_date?: string; p_site_id: string };
        Returns: string;
      };
      generate_gift_card_code: { Args: { p_prefix?: string }; Returns: string };
      generate_site_isolation_policy: {
        Args: { p_policy_name?: string; p_table_name: string };
        Returns: string;
      };
      generate_webhook_path: { Args: never; Returns: string };
      generate_webhook_secret: { Args: never; Returns: string };
      get_active_module_version: {
        Args: { p_site_module_id: string };
        Returns: string;
      };
      get_agency_role: { Args: { check_agency_id: string }; Returns: string };
      get_api_key_stats: {
        Args: { p_api_key_id: string };
        Returns: {
          last_used: string;
          requests_this_week: number;
          requests_today: number;
          total_requests: number;
        }[];
      };
      get_cached_domain_price: {
        Args: {
          p_max_age_hours?: number;
          p_pricing_type?: string;
          p_tld: string;
        };
        Returns: {
          created_at: string;
          currency: string;
          id: string;
          last_refreshed_at: string;
          pricing_type: string;
          privacy_1yr: number | null;
          register_10yr: number | null;
          register_1yr: number;
          register_2yr: number | null;
          register_3yr: number | null;
          register_5yr: number | null;
          renew_10yr: number | null;
          renew_1yr: number;
          renew_2yr: number | null;
          renew_3yr: number | null;
          renew_5yr: number | null;
          restore_price: number | null;
          source_api_endpoint: string | null;
          tld: string;
          transfer_price: number;
          updated_at: string;
        };
        SetofOptions: {
          from: "*";
          to: "domain_pricing_cache";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_current_agency_id: { Args: never; Returns: string };
      get_current_period_usage: {
        Args: { p_agency_id: string };
        Returns: {
          ai_actions: number;
          api_calls: number;
          automation_runs: number;
          period_end: string;
          period_start: string;
        }[];
      };
      get_domain_stats: {
        Args: { p_agency_id: string };
        Returns: {
          active_domains: number;
          domains_with_email: number;
          expired_domains: number;
          expiring_soon: number;
          total_domains: number;
          total_email_accounts: number;
        }[];
      };
      get_domains_for_ssl_renewal: {
        Args: { p_days_before_expiry?: number };
        Returns: {
          domain: string;
          id: string;
          ssl_expires_at: string;
        }[];
      };
      get_expiring_domains: {
        Args: { days_ahead?: number };
        Returns: {
          agency_id: string;
          days_until_expiry: number;
          domain_id: string;
          domain_name: string;
          expiry_date: string;
        }[];
      };
      get_latest_module_version: {
        Args: { p_include_prerelease?: boolean; p_module_source_id: string };
        Returns: {
          active_installs: number | null;
          api_routes: Json | null;
          breaking_description: string | null;
          bundle_hash: string | null;
          bundle_url: string | null;
          changelog: string | null;
          created_at: string | null;
          created_by: string | null;
          default_settings: Json | null;
          dependencies: Json | null;
          download_count: number | null;
          id: string;
          is_breaking_change: boolean | null;
          min_platform_version: string | null;
          module_source_id: string;
          prerelease: string | null;
          published_at: string | null;
          published_by: string | null;
          release_notes: string | null;
          render_code: string | null;
          settings_schema: Json | null;
          source_url: string | null;
          status: string | null;
          styles: string | null;
          version: string;
          version_major: number | null;
          version_minor: number | null;
          version_patch: number | null;
        };
        SetofOptions: {
          from: "*";
          to: "module_versions";
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      get_module_by_domain: {
        Args: { p_domain: string };
        Returns: {
          config: Json;
          module_id: string;
          site_id: string;
          site_module_installation_id: string;
          white_label: Json;
        }[];
      };
      get_module_database_status: {
        Args: { p_module_id: string };
        Returns: {
          actual_tables: string[];
          module_id: string;
          registered_tables: string[];
          schema_name: string;
          short_id: string;
          status: string;
          uses_schema: boolean;
        }[];
      };
      get_module_db_prefix: { Args: { p_module_id: string }; Returns: string };
      get_module_prefixed_tables_size: {
        Args: { p_prefix: string };
        Returns: number;
      };
      get_module_role_level: {
        Args: { p_module_id: string; p_site_id: string; p_user_id: string };
        Returns: number;
      };
      get_module_schema_tables: {
        Args: { p_schema_name: string };
        Returns: {
          row_count: number;
          size_bytes: number;
          table_name: string;
        }[];
      };
      get_module_schemas: {
        Args: never;
        Returns: {
          schema_name: string;
        }[];
      };
      get_module_storage_size: {
        Args: { p_schema_name: string };
        Returns: number;
      };
      get_module_tables: {
        Args: { prefix: string };
        Returns: {
          table_name: string;
          table_schema: string;
        }[];
      };
      get_top_module_events: {
        Args: {
          p_end_date: string;
          p_limit?: number;
          p_module_id: string;
          p_start_date: string;
        };
        Returns: {
          count: number;
          event_name: string;
          event_type: string;
        }[];
      };
      get_trending_modules: {
        Args: { limit_count?: number; since_date: string };
        Returns: {
          category: string;
          description: string;
          icon: string;
          id: string;
          install_count: number;
          name: string;
          price: number;
          rating: number;
          review_count: number;
          slug: string;
          tags: string[];
          type: string;
          view_count: number;
        }[];
      };
      get_user_agency_id: { Args: { p_user_id: string }; Returns: string };
      get_user_agency_role: {
        Args: { p_agency_id: string; p_user_id: string };
        Returns: string;
      };
      get_user_org_id: { Args: never; Returns: string };
      increment_consumer_requests: {
        Args: { p_consumer_id: string };
        Returns: undefined;
      };
      increment_domain_stats: {
        Args: { p_bytes?: number; p_domain_id: string; p_requests?: number };
        Returns: undefined;
      };
      increment_module_installations: {
        Args: { sub_id: string };
        Returns: undefined;
      };
      increment_module_stat: {
        Args: { p_date: string; p_field: string; p_module_id: string };
        Returns: undefined;
      };
      increment_review_helpful: {
        Args: { review_id: string };
        Returns: undefined;
      };
      increment_usage: {
        Args: {
          p_agency_id: string;
          p_ai_actions?: number;
          p_api_calls?: number;
          p_automation_runs?: number;
          p_site_id: string;
        };
        Returns: undefined;
      };
      is_agency_admin: { Args: { check_agency_id: string }; Returns: boolean };
      is_agency_member: { Args: { check_agency_id: string }; Returns: boolean };
      is_name_reserved: { Args: { p_table_name: string }; Returns: boolean };
      is_org_admin: { Args: { org_id: string }; Returns: boolean };
      is_org_member: { Args: { org_id: string }; Returns: boolean };
      is_pricing_cache_stale: {
        Args: { p_cache_type?: string; p_max_age_hours?: number };
        Returns: boolean;
      };
      is_super_admin: { Args: never; Returns: boolean };
      is_valid_module_short_id: {
        Args: { p_short_id: string };
        Returns: boolean;
      };
      log_api_request: {
        Args: {
          p_consumer_id: string;
          p_error_message?: string;
          p_graphql_operation?: string;
          p_graphql_type?: string;
          p_ip_address?: unknown;
          p_is_graphql?: boolean;
          p_method: string;
          p_path: string;
          p_query_params?: Json;
          p_request_body?: Json;
          p_response_size?: number;
          p_response_time_ms?: number;
          p_site_module_id: string;
          p_status_code?: number;
          p_user_agent?: string;
        };
        Returns: string;
      };
      log_external_request: {
        Args: {
          p_error_code?: string;
          p_error_message?: string;
          p_ip_address: unknown;
          p_method: string;
          p_module_id: string;
          p_origin: string;
          p_path: string;
          p_response_time_ms: number;
          p_site_id: string;
          p_status_code: number;
          p_token_id: string;
          p_user_agent: string;
        };
        Returns: string;
      };
      mod_crmmod01_init_site: {
        Args: { p_site_id: string };
        Returns: undefined;
      };
      mod_ecommod01_generate_order_number: {
        Args: { p_site_id: string };
        Returns: string;
      };
      mod_ecommod01_increment_customer_stats: {
        Args: { p_customer_id: string; p_order_total: number };
        Returns: undefined;
      };
      module_schema_exists: {
        Args: { p_schema_name: string };
        Returns: boolean;
      };
      parse_semver: {
        Args: { version_str: string };
        Returns: {
          major: number;
          minor: number;
          patch: number;
          prerelease: string;
        }[];
      };
      record_inventory_movement: {
        Args: {
          p_product_id: string;
          p_quantity: number;
          p_reason?: string;
          p_reference_id?: string;
          p_reference_type?: string;
          p_site_id: string;
          p_type: string;
          p_user_id?: string;
          p_variant_id: string;
        };
        Returns: string;
      };
      search_agent_memories: {
        Args: {
          p_agent_id: string;
          p_limit?: number;
          p_memory_types?: string[];
          p_query_embedding: string;
        };
        Returns: {
          confidence: number;
          content: string;
          id: string;
          memory_type: string;
          similarity: number;
        }[];
      };
      set_tenant_context: {
        Args: { p_agency_id: string; p_site_id?: string; p_user_id?: string };
        Returns: undefined;
      };
      touch_module_session: {
        Args: { p_session_token: string };
        Returns: undefined;
      };
      track_embed_token_usage: {
        Args: { p_module_id: string; p_site_id: string };
        Returns: undefined;
      };
      update_module_storage_metrics: {
        Args: { p_module_short_id: string };
        Returns: undefined;
      };
      update_webhook_stats: {
        Args: { p_error?: string; p_success: boolean; p_webhook_id: string };
        Returns: undefined;
      };
      update_workflow_stats: {
        Args: { p_error?: string; p_success: boolean; p_workflow_id: string };
        Returns: undefined;
      };
      user_has_site_access: {
        Args: { p_site_id: string; p_user_id: string };
        Returns: boolean;
      };
      user_in_agency: {
        Args: { p_agency_id: string; p_user_id: string };
        Returns: boolean;
      };
      verify_tenant_isolation: {
        Args: {
          p_site_id_1: string;
          p_site_id_2: string;
          p_table_name: string;
        };
        Returns: {
          check_name: string;
          details: string;
          passed: boolean;
        }[];
      };
      version_satisfies: {
        Args: { constraint_str: string; version_str: string };
        Returns: boolean;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
