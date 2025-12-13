export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      "[NUTRIVISC] BDR_PROSPECÇÃO": {
        Row: {
          created_at: string
          id: number
          lead_name: string | null
          number: string | null
          thread_id: string | null
          timeout: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          lead_name?: string | null
          number?: string | null
          thread_id?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          lead_name?: string | null
          number?: string | null
          thread_id?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "[PAGOZ-ADER] BDR_PROSPECÇÃO": {
        Row: {
          created_at: string
          id: number
          lead_name: string | null
          mensagem: string | null
          number: string | null
          timeout: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          lead_name?: string | null
          mensagem?: string | null
          number?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          lead_name?: string | null
          mensagem?: string | null
          number?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      BDR_PROSPECÇÃO: {
        Row: {
          created_at: string
          id: number
          lead_name: string | null
          number: string | null
          thread_id: string | null
          timeout: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          lead_name?: string | null
          number?: string | null
          thread_id?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          lead_name?: string | null
          number?: string | null
          thread_id?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contatos_agente: {
        Row: {
          agente: string | null
          created_at: string | null
          email: string | null
          id: number
          interesse_duvida: string | null
          role: string | null
          status: string | null
          user_name: string | null
          user_number: string | null
          user_profile: string | null
        }
        Insert: {
          agente?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          interesse_duvida?: string | null
          role?: string | null
          status?: string | null
          user_name?: string | null
          user_number?: string | null
          user_profile?: string | null
        }
        Update: {
          agente?: string | null
          created_at?: string | null
          email?: string | null
          id?: number
          interesse_duvida?: string | null
          role?: string | null
          status?: string | null
          user_name?: string | null
          user_number?: string | null
          user_profile?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          completed: boolean | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          deal_id: string | null
          description: string | null
          id: string
          metadata: Json | null
          scheduled_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          activity_type: Database["public"]["Enums"]["crm_activity_type"]
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          activity_type?: Database["public"]["Enums"]["crm_activity_type"]
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          deal_id?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          scheduled_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          company: string | null
          created_at: string
          custom_fields: Json | null
          email: string | null
          full_name: string
          id: string
          last_contact_at: string | null
          lead_score: number | null
          phone: string | null
          position: string | null
          service: string | null
          service_value: number | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          full_name: string
          id?: string
          last_contact_at?: string | null
          lead_score?: number | null
          phone?: string | null
          position?: string | null
          service?: string | null
          service_value?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          custom_fields?: Json | null
          email?: string | null
          full_name?: string
          id?: string
          last_contact_at?: string | null
          lead_score?: number | null
          phone?: string | null
          position?: string | null
          service?: string | null
          service_value?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      crm_deals: {
        Row: {
          assigned_to: string | null
          closed_at: string | null
          contact_id: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          expected_close_date: string | null
          id: string
          needs_follow_up: boolean
          position: number | null
          probability: number | null
          stage: Database["public"]["Enums"]["crm_pipeline_stage"]
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          needs_follow_up?: boolean
          position?: number | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["crm_pipeline_stage"]
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          contact_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          needs_follow_up?: boolean
          position?: number | null
          probability?: number | null
          stage?: Database["public"]["Enums"]["crm_pipeline_stage"]
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_follow_ups: {
        Row: {
          completed_at: string | null
          completed_notes: string | null
          created_at: string
          deal_id: string
          description: string | null
          id: string
          scheduled_date: string
          scheduled_time: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_notes?: string | null
          created_at?: string
          deal_id: string
          description?: string | null
          id?: string
          scheduled_date: string
          scheduled_time: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_notes?: string | null
          created_at?: string
          deal_id?: string
          description?: string | null
          id?: string
          scheduled_date?: string
          scheduled_time?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_follow_ups_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          id?: number
          metadata?: Json | null
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      financial_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          transaction_id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          transaction_id: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          transaction_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transactions_with_net_profit"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_budgets: {
        Row: {
          alert_threshold: number | null
          category_id: string
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          planned_amount: number
          spent_amount: number | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          alert_threshold?: number | null
          category_id: string
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          planned_amount: number
          spent_amount?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          alert_threshold?: number | null
          category_id?: string
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          planned_amount?: number
          spent_amount?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_budgets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_recurring_transactions: {
        Row: {
          auto_create: boolean | null
          created_at: string | null
          end_date: string | null
          execution_count: number | null
          frequency: string
          id: string
          is_active: boolean | null
          last_execution_date: string | null
          next_execution_date: string
          start_date: string
          template_transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_create?: boolean | null
          created_at?: string | null
          end_date?: string | null
          execution_count?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_execution_date?: string | null
          next_execution_date: string
          start_date: string
          template_transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_create?: boolean | null
          created_at?: string | null
          end_date?: string | null
          execution_count?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_execution_date?: string | null
          next_execution_date?: string
          start_date?: string
          template_transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_recurring_transactions_template_transaction_id_fkey"
            columns: ["template_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_recurring_transactions_template_transaction_id_fkey"
            columns: ["template_transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transactions_with_net_profit"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string
          has_costs: boolean | null
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          recurrence_id: string | null
          status: string | null
          tags: string[] | null
          total_costs: number | null
          transaction_date: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id: string
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description: string
          has_costs?: boolean | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          recurrence_id?: string | null
          status?: string | null
          tags?: string[] | null
          total_costs?: number | null
          transaction_date?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string
          has_costs?: boolean | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          recurrence_id?: string | null
          status?: string | null
          tags?: string[] | null
          total_costs?: number | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_recurrence_id_fkey"
            columns: ["recurrence_id"]
            isOneToOne: false
            referencedRelation: "vw_transactions_with_net_profit"
            referencedColumns: ["id"]
          },
        ]
      }
      follow_up: {
        Row: {
          created_at: string | null
          id: number
          last_message: string | null
          notes: string | null
          status: string | null
          updated_at: string | null
          user_number: string
        }
        Insert: {
          created_at?: string | null
          id?: number
          last_message?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_number: string
        }
        Update: {
          created_at?: string | null
          id?: number
          last_message?: string | null
          notes?: string | null
          status?: string | null
          updated_at?: string | null
          user_number?: string
        }
        Relationships: []
      }
      follow_upp: {
        Row: {
          created_at: string | null
          id: number
          last_message: string | null
          user_number: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          last_message?: string | null
          user_number?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          last_message?: string | null
          user_number?: string | null
        }
        Relationships: []
      }
      LEADS: {
        Row: {
          created_at: string
          id: number
          lead_name: string | null
          number: string | null
          thread_id: string | null
          timeout: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          lead_name?: string | null
          number?: string | null
          thread_id?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          lead_name?: string | null
          number?: string | null
          thread_id?: string | null
          timeout?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      n8n_chat_histories: {
        Row: {
          id: number
          message: Json
          session_id: string
        }
        Insert: {
          id?: number
          message: Json
          session_id: string
        }
        Update: {
          id?: number
          message?: Json
          session_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          message: string
          read: boolean
          task_id: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          read?: boolean
          task_id?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          read?: boolean
          task_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          invited_by: string | null
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          show_all_contacts: boolean | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          invited_by?: string | null
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          show_all_contacts?: boolean | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          show_all_contacts?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prospecting_daily_reports: {
        Row: {
          created_at: string | null
          date: string
          final_calls: number | null
          final_contacts: number | null
          finished_at: string | null
          goal_calls: number
          goal_contacts: number
          id: string
          is_paused: boolean | null
          paused_at: string | null
          started_at: string
          status: string
          total_paused_time: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          date?: string
          final_calls?: number | null
          final_contacts?: number | null
          finished_at?: string | null
          goal_calls: number
          goal_contacts: number
          id?: string
          is_paused?: boolean | null
          paused_at?: string | null
          started_at?: string
          status?: string
          total_paused_time?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          date?: string
          final_calls?: number | null
          final_contacts?: number | null
          finished_at?: string | null
          goal_calls?: number
          goal_contacts?: number
          id?: string
          is_paused?: boolean | null
          paused_at?: string | null
          started_at?: string
          status?: string
          total_paused_time?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_prospecting_daily_reports_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_scripts: {
        Row: {
          cards: Json
          created_at: string
          id: string
          is_active: boolean | null
          is_copy: boolean | null
          is_public: boolean | null
          name: string
          original_script_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cards?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_copy?: boolean | null
          is_public?: boolean | null
          name: string
          original_script_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cards?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_copy?: boolean | null
          is_public?: boolean | null
          name?: string
          original_script_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_scripts_original_script_id_fkey"
            columns: ["original_script_id"]
            isOneToOne: false
            referencedRelation: "prospecting_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_sessions: {
        Row: {
          completed_at: string
          contact_id: string | null
          created_at: string
          id: string
          result: string
          script_id: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          result: string
          script_id?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          result?: string
          script_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prospecting_sessions_script_id_fkey"
            columns: ["script_id"]
            isOneToOne: false
            referencedRelation: "prospecting_scripts"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_calls: {
        Row: {
          completed_at: string | null
          contact_id: string
          created_at: string
          deal_id: string | null
          duration_minutes: number
          id: string
          notes: string | null
          scheduled_at: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_id: string
          created_at?: string
          deal_id?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          scheduled_at: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          deal_id?: string | null
          duration_minutes?: number
          id?: string
          notes?: string | null
          scheduled_at?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_calls_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_calls_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      sdr_events: {
        Row: {
          direction: string
          id: number
          message_len: number | null
          message_type: string
          payload: Json | null
          ts: string | null
          user_name: string | null
          user_number: string
        }
        Insert: {
          direction: string
          id?: number
          message_len?: number | null
          message_type: string
          payload?: Json | null
          ts?: string | null
          user_name?: string | null
          user_number: string
        }
        Update: {
          direction?: string
          id?: number
          message_len?: number | null
          message_type?: string
          payload?: Json | null
          ts?: string | null
          user_name?: string | null
          user_number?: string
        }
        Relationships: []
      }
      sdr_leads_status: {
        Row: {
          calendar_event_id: string | null
          last_agent_message_at: string | null
          last_message_at: string | null
          last_user_message_at: string | null
          next_follow_up_at: string | null
          stage: string | null
          updated_at: string | null
          user_id: string | null
          user_name: string | null
          user_number: string
        }
        Insert: {
          calendar_event_id?: string | null
          last_agent_message_at?: string | null
          last_message_at?: string | null
          last_user_message_at?: string | null
          next_follow_up_at?: string | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          user_number: string
        }
        Update: {
          calendar_event_id?: string | null
          last_agent_message_at?: string | null
          last_message_at?: string | null
          last_user_message_at?: string | null
          next_follow_up_at?: string | null
          stage?: string | null
          updated_at?: string | null
          user_id?: string | null
          user_name?: string | null
          user_number?: string
        }
        Relationships: []
      }
      SDR2: {
        Row: {
          created_at: string
          id: number
          messages: Json | null
          questions: Json | null
          updated_at: string | null
          user: number | null
        }
        Insert: {
          created_at?: string
          id?: number
          messages?: Json | null
          questions?: Json | null
          updated_at?: string | null
          user?: number | null
        }
        Update: {
          created_at?: string
          id?: number
          messages?: Json | null
          questions?: Json | null
          updated_at?: string | null
          user?: number | null
        }
        Relationships: []
      }
      task_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          completed_at: string | null
          created_at: string
          id: string
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          task_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          completed_at?: string | null
          created_at?: string
          id?: string
          status?: Database["public"]["Enums"]["task_status"]
          task_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: Database["public"]["Enums"]["task_category"] | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          image_url: string | null
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_to?: string | null
          category?: Database["public"]["Enums"]["task_category"] | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_token: string | null
          invited_by: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string | null
          invited_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      transaction_costs: {
        Row: {
          amount: number
          attachment_id: string | null
          cost_type: string
          created_at: string | null
          description: string | null
          id: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_id?: string | null
          cost_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_id?: string | null
          cost_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_costs_attachment_id_fkey"
            columns: ["attachment_id"]
            isOneToOne: false
            referencedRelation: "financial_attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_costs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transaction_costs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transactions_with_net_profit"
            referencedColumns: ["id"]
          },
        ]
      }
      user_daily_goals: {
        Row: {
          created_at: string | null
          default_goal_calls: number
          default_goal_contacts: number
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          default_goal_calls?: number
          default_goal_contacts?: number
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          default_goal_calls?: number
          default_goal_contacts?: number
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          id: string
          ispremium: boolean | null
          numero: number | null
          qtdmensagem: number | null
        }
        Insert: {
          created_at?: string | null
          id: string
          ispremium?: boolean | null
          numero?: number | null
          qtdmensagem?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ispremium?: boolean | null
          numero?: number | null
          qtdmensagem?: number | null
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          created_at: string
          id: number
          nome: string | null
          whatsapp: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          nome?: string | null
          whatsapp?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          nome?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      vw_transactions_with_net_profit: {
        Row: {
          account_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          gross_amount: number | null
          has_costs: boolean | null
          id: string | null
          net_amount: number | null
          profit_margin_percentage: number | null
          total_costs: number | null
          transaction_date: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gross_amount?: number | null
          has_costs?: boolean | null
          id?: string | null
          net_amount?: never
          profit_margin_percentage?: never
          total_costs?: number | null
          transaction_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          gross_amount?: number | null
          has_costs?: boolean | null
          id?: string | null
          net_amount?: never
          profit_margin_percentage?: never
          total_costs?: number | null
          transaction_date?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      auto_execute_recurring_transactions: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      calculate_net_amount: {
        Args: { p_transaction_id: string }
        Returns: number
      }
      create_tasks_from_follow_ups: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      execute_recurring_transaction: {
        Args: { recurring_transaction_id: string }
        Returns: Json
      }
      get_tasks_with_assignments: {
        Args: { user_id_param: string }
        Returns: {
          assigned_at: string
          assigned_user_email: string
          assigned_user_id: string
          assigned_user_name: string
          assignment_id: string
          assignment_status: Database["public"]["Enums"]["task_status"]
          category: Database["public"]["Enums"]["task_category"]
          completed_at: string
          contact_id: string
          created_at: string
          created_by: string
          created_by_email: string
          created_by_name: string
          deal_id: string
          description: string
          due_date: string
          image_url: string
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          status: Database["public"]["Enums"]["task_status"]
          task_id: string
          title: string
          updated_at: string
          user_id: string
        }[]
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      is_admin_or_dono: {
        Args: { _user_id: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      match_documents: {
        Args: { filter?: Json; match_count?: number; query_embedding: string }
        Returns: {
          content: string
          id: number
          metadata: Json
          similarity: number
        }[]
      }
      process_daily_recurring_transactions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
    }
    Enums: {
      crm_activity_type:
        | "call"
        | "email"
        | "whatsapp"
        | "meeting"
        | "note"
        | "task"
        | "ai_interaction"
      crm_pipeline_stage:
        | "lead_novo"
        | "qualificado"
        | "apresentacao"
        | "proposta"
        | "negociacao"
        | "fechado_ganho"
        | "fechado_perdido"
      task_category:
        | "comercial"
        | "marketing"
        | "financeiro"
        | "social_media"
        | "empresarial"
      task_priority: "baixa" | "media" | "alta"
      task_status: "pendente" | "concluida"
      user_role: "admin" | "dono" | "vendedor" | "gestor_trafego"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      crm_activity_type: [
        "call",
        "email",
        "whatsapp",
        "meeting",
        "note",
        "task",
        "ai_interaction",
      ],
      crm_pipeline_stage: [
        "lead_novo",
        "qualificado",
        "apresentacao",
        "proposta",
        "negociacao",
        "fechado_ganho",
        "fechado_perdido",
      ],
      task_category: [
        "comercial",
        "marketing",
        "financeiro",
        "social_media",
        "empresarial",
      ],
      task_priority: ["baixa", "media", "alta"],
      task_status: ["pendente", "concluida"],
      user_role: ["admin", "dono", "vendedor", "gestor_trafego"],
    },
  },
} as const
