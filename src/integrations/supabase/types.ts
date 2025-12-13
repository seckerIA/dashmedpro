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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      BDR_PROSPECÇÃO: {
        Row: {
          agendado: boolean | null
          assunto: string | null
          conversa_json: Json | null
          created_at: string
          etapa: string | null
          historico_texto: string | null
          id: number
          interacoes: number | null
          lead_name: string | null
          "MSG Enviada": boolean | null
          number: string
          resumo: string | null
          status: string | null
          thread_id: string | null
          timeout: string | null
          ultimo_contato: string | null
          user_id: string | null
        }
        Insert: {
          agendado?: boolean | null
          assunto?: string | null
          conversa_json?: Json | null
          created_at?: string
          etapa?: string | null
          historico_texto?: string | null
          id?: number
          interacoes?: number | null
          lead_name?: string | null
          "MSG Enviada"?: boolean | null
          number: string
          resumo?: string | null
          status?: string | null
          thread_id?: string | null
          timeout?: string | null
          ultimo_contato?: string | null
          user_id?: string | null
        }
        Update: {
          agendado?: boolean | null
          assunto?: string | null
          conversa_json?: Json | null
          created_at?: string
          etapa?: string | null
          historico_texto?: string | null
          id?: number
          interacoes?: number | null
          lead_name?: string | null
          "MSG Enviada"?: boolean | null
          number?: string
          resumo?: string | null
          status?: string | null
          thread_id?: string | null
          timeout?: string | null
          ultimo_contato?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          id: number
          last_message_at: string | null
          name: string | null
          phone: string
          status: string | null
        }
        Insert: {
          id?: number
          last_message_at?: string | null
          name?: string | null
          phone: string
          status?: string | null
        }
        Update: {
          id?: number
          last_message_at?: string | null
          name?: string | null
          phone?: string
          status?: string | null
        }
        Relationships: []
      }
      crm_activities: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          id: string
          scheduled_at: string | null
          title: string | null
          type: Database["public"]["Enums"]["crm_activity_type"]
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          scheduled_at?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["crm_activity_type"]
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          scheduled_at?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["crm_activity_type"]
          user_id?: string | null
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
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          last_contact_at: string | null
          name: string
          notes: string | null
          phone: string | null
          position: string | null
          service: string | null
          service_value: number | null
          source: string | null
          tags: string[] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_contact_at?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          service?: string | null
          service_value?: number | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          last_contact_at?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          position?: string | null
          service?: string | null
          service_value?: number | null
          source?: string | null
          tags?: string[] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      crm_deals: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          needs_follow_up: boolean | null
          notes: string | null
          position: number | null
          probability: number | null
          service: string | null
          stage: Database["public"]["Enums"]["crm_pipeline_stage"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          needs_follow_up?: boolean | null
          notes?: string | null
          position?: number | null
          probability?: number | null
          service?: string | null
          stage?: Database["public"]["Enums"]["crm_pipeline_stage"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          needs_follow_up?: boolean | null
          notes?: string | null
          position?: number | null
          probability?: number | null
          service?: string | null
          stage?: Database["public"]["Enums"]["crm_pipeline_stage"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
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
      daily_reports: {
        Row: {
          calls_made: number | null
          created_at: string | null
          deals_closed: number | null
          emails_sent: number | null
          id: string
          meetings_held: number | null
          notes: string | null
          prospecting_session_id: string | null
          report_date: string
          revenue: number | null
          user_id: string | null
        }
        Insert: {
          calls_made?: number | null
          created_at?: string | null
          deals_closed?: number | null
          emails_sent?: number | null
          id?: string
          meetings_held?: number | null
          notes?: string | null
          prospecting_session_id?: string | null
          report_date: string
          revenue?: number | null
          user_id?: string | null
        }
        Update: {
          calls_made?: number | null
          created_at?: string | null
          deals_closed?: number | null
          emails_sent?: number | null
          id?: string
          meetings_held?: number | null
          notes?: string | null
          prospecting_session_id?: string | null
          report_date?: string
          revenue?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "daily_reports_prospecting_session_id_fkey"
            columns: ["prospecting_session_id"]
            isOneToOne: false
            referencedRelation: "prospecting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          contact_id: string | null
          created_at: string | null
          expected_close_date: string | null
          id: string
          needs_follow_up: boolean | null
          notes: string | null
          probability: number | null
          service: string | null
          stage: string | null
          title: string
          updated_at: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          needs_follow_up?: boolean | null
          notes?: string | null
          probability?: number | null
          service?: string | null
          stage?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          expected_close_date?: string | null
          id?: string
          needs_follow_up?: boolean | null
          notes?: string | null
          probability?: number | null
          service?: string | null
          stage?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      default_goals: {
        Row: {
          created_at: string | null
          daily_calls: number | null
          daily_emails: number | null
          daily_meetings: number | null
          goal_calls: number | null
          goal_contacts: number | null
          id: string
          monthly_revenue: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          daily_calls?: number | null
          daily_emails?: number | null
          daily_meetings?: number | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          monthly_revenue?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          daily_calls?: number | null
          daily_emails?: number | null
          daily_meetings?: number | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          monthly_revenue?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          balance: number | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      financial_categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          type?: string
        }
        Relationships: []
      }
      financial_recurring_transactions: {
        Row: {
          account_id: string | null
          amount: number
          auto_create: boolean | null
          category_id: string | null
          created_at: string | null
          description: string | null
          end_date: string | null
          execution_count: number | null
          frequency: string
          id: string
          is_active: boolean | null
          last_executed_at: string | null
          last_execution_date: string | null
          next_date: string
          next_execution_date: string | null
          start_date: string | null
          template_transaction_id: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          auto_create?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          execution_count?: number | null
          frequency: string
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          last_execution_date?: string | null
          next_date: string
          next_execution_date?: string | null
          start_date?: string | null
          template_transaction_id?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          auto_create?: boolean | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          end_date?: string | null
          execution_count?: number | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          last_executed_at?: string | null
          last_execution_date?: string | null
          next_date?: string
          next_execution_date?: string | null
          start_date?: string | null
          template_transaction_id?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_template_transaction_id_fkey"
            columns: ["template_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          contact_id: string | null
          created_at: string | null
          date: string
          deal_id: string | null
          description: string | null
          has_costs: boolean | null
          id: string
          is_recurring: boolean | null
          metadata: Json | null
          notes: string | null
          payment_method: string | null
          status: string | null
          tags: string[] | null
          transaction_date: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date: string
          deal_id?: string | null
          description?: string | null
          has_costs?: boolean | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          tags?: string[] | null
          transaction_date?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          date?: string
          deal_id?: string | null
          description?: string | null
          has_costs?: boolean | null
          id?: string
          is_recurring?: boolean | null
          metadata?: Json | null
          notes?: string | null
          payment_method?: string | null
          status?: string | null
          tags?: string[] | null
          transaction_date?: string | null
          type?: string
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
        ]
      }
      follow_ups: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          deal_id: string | null
          id: string
          notes: string | null
          scheduled_date: string
          type: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          scheduled_date: string
          type: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          contact_id: number | null
          content: string | null
          created_at: string | null
          direction: string
          id: number
          type: string | null
        }
        Insert: {
          contact_id?: number | null
          content?: string | null
          created_at?: string | null
          direction: string
          id?: number
          type?: string | null
        }
        Update: {
          contact_id?: number | null
          content?: string | null
          created_at?: string | null
          direction?: string
          id?: number
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: []
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
          role: string | null
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
          role?: string | null
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
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      prospecting_daily_reports: {
        Row: {
          appointments_set: number | null
          calls_made: number | null
          contacts_reached: number | null
          created_at: string | null
          date: string
          ended_at: string | null
          goal_calls: number | null
          goal_contacts: number | null
          id: string
          notes: string | null
          session_id: string | null
          started_at: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          created_at?: string | null
          date: string
          ended_at?: string | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          notes?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          created_at?: string | null
          date?: string
          ended_at?: string | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          notes?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prospecting_daily_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "prospecting_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_scripts: {
        Row: {
          cards: Json | null
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_copy: boolean | null
          is_public: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          cards?: Json | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_copy?: boolean | null
          is_public?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          cards?: Json | null
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_copy?: boolean | null
          is_public?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      prospecting_sessions: {
        Row: {
          appointments_set: number | null
          calls_made: number | null
          contacts_reached: number | null
          ended_at: string | null
          goal_calls: number | null
          goal_contacts: number | null
          id: string
          is_paused: boolean | null
          notes: string | null
          script_id: string | null
          started_at: string | null
          total_pause_time: number | null
          user_id: string | null
        }
        Insert: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          ended_at?: string | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          script_id?: string | null
          started_at?: string | null
          total_pause_time?: number | null
          user_id?: string | null
        }
        Update: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          ended_at?: string | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          script_id?: string | null
          started_at?: string | null
          total_pause_time?: number | null
          user_id?: string | null
        }
        Relationships: [
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
          call_type: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          outcome: string | null
          scheduled_at: string
          status: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          call_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          call_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          user_id?: string | null
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
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      task_assignments: {
        Row: {
          created_at: string | null
          id: string
          task_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          task_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_assignments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          category: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          deal_id: string | null
          description: string | null
          due_date: string | null
          id: string
          image_url: string | null
          priority: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          priority?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          deal_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          image_url?: string | null
          priority?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
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
      transaction_costs: {
        Row: {
          amount: number
          attachment_id: string | null
          cost_type: string
          created_at: string | null
          description: string | null
          id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          attachment_id?: string | null
          cost_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          attachment_id?: string | null
          cost_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transaction_costs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "dono" | "vendedor" | "gestor_trafego"
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
      app_role: ["admin", "dono", "vendedor", "gestor_trafego"],
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
    },
  },
} as const
