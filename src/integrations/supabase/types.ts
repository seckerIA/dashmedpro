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
      admin_settings: {
        Row: {
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      BDR_PROSPECÇÃO: {
        Row: {
          agendado: boolean | null
          assunto: string | null
          atendente_assumiu: boolean | null
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
          atendente_assumiu?: boolean | null
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
          atendente_assumiu?: boolean | null
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
      commercial_appointments: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          location: string | null
          notes: string | null
          outcome: string | null
          reminder_sent: boolean | null
          scheduled_at: string
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          outcome?: string | null
          reminder_sent?: boolean | null
          scheduled_at: string
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          location?: string | null
          notes?: string | null
          outcome?: string | null
          reminder_sent?: boolean | null
          scheduled_at?: string
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_appointments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_appointments_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_appointments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_campaigns: {
        Row: {
          conversions: number | null
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          end_date: string
          id: string
          is_active: boolean
          leads_generated: number | null
          name: string
          promo_code: string | null
          start_date: string
          target_audience: string | null
          type: Database["public"]["Enums"]["commercial_campaign_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          conversions?: number | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          end_date: string
          id?: string
          is_active?: boolean
          leads_generated?: number | null
          name: string
          promo_code?: string | null
          start_date: string
          target_audience?: string | null
          type: Database["public"]["Enums"]["commercial_campaign_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          conversions?: number | null
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          end_date?: string
          id?: string
          is_active?: boolean
          leads_generated?: number | null
          name?: string
          promo_code?: string | null
          start_date?: string
          target_audience?: string | null
          type?: Database["public"]["Enums"]["commercial_campaign_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commercial_lead_interactions: {
        Row: {
          created_at: string
          id: string
          interaction_type: Database["public"]["Enums"]["commercial_interaction_type"]
          lead_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          interaction_type: Database["public"]["Enums"]["commercial_interaction_type"]
          lead_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          interaction_type?: Database["public"]["Enums"]["commercial_interaction_type"]
          lead_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_lead_interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "commercial_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_leads: {
        Row: {
          contact_id: string | null
          converted_at: string | null
          created_at: string
          email: string | null
          estimated_value: number | null
          id: string
          name: string
          notes: string | null
          origin: Database["public"]["Enums"]["commercial_lead_origin"]
          phone: string | null
          status: Database["public"]["Enums"]["commercial_lead_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          name: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["commercial_lead_origin"]
          phone?: string | null
          status?: Database["public"]["Enums"]["commercial_lead_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          contact_id?: string | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          id?: string
          name?: string
          notes?: string | null
          origin?: Database["public"]["Enums"]["commercial_lead_origin"]
          phone?: string | null
          status?: Database["public"]["Enums"]["commercial_lead_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_leads_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_procedures: {
        Row: {
          category: Database["public"]["Enums"]["commercial_procedure_category"]
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean
          name: string
          price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: Database["public"]["Enums"]["commercial_procedure_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name: string
          price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["commercial_procedure_category"]
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      commercial_sales: {
        Row: {
          appointment_id: string | null
          contact_id: string | null
          created_at: string
          id: string
          installments: number | null
          lead_id: string | null
          notes: string | null
          payment_method:
            | Database["public"]["Enums"]["commercial_payment_method"]
            | null
          procedure_id: string | null
          sale_date: string | null
          status: Database["public"]["Enums"]["commercial_sale_status"]
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          appointment_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          installments?: number | null
          lead_id?: string | null
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["commercial_payment_method"]
            | null
          procedure_id?: string | null
          sale_date?: string | null
          status?: Database["public"]["Enums"]["commercial_sale_status"]
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          appointment_id?: string | null
          contact_id?: string | null
          created_at?: string
          id?: string
          installments?: number | null
          lead_id?: string | null
          notes?: string | null
          payment_method?:
            | Database["public"]["Enums"]["commercial_payment_method"]
            | null
          procedure_id?: string | null
          sale_date?: string | null
          status?: Database["public"]["Enums"]["commercial_sale_status"]
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "commercial_sales_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "medical_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_sales_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_sales_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "commercial_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_sales_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "commercial_procedures"
            referencedColumns: ["id"]
          },
        ]
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
          closed_at: string | null
          created_at: string | null
          crm: string | null
          description: string | null
          expected_close_date: string | null
          id: string
          lead_id: string | null
          lost_reason: string | null
          monthly_revenue: string | null
          objective: string | null
          preferred_contact_time: string | null
          priority: string | null
          source: string | null
          specialty: string | null
          stage: string
          tags: string[] | null
          title: string
          updated_at: string | null
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          crm?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          monthly_revenue?: string | null
          objective?: string | null
          preferred_contact_time?: string | null
          priority?: string | null
          source?: string | null
          specialty?: string | null
          stage?: string
          tags?: string[] | null
          title: string
          updated_at?: string | null
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          closed_at?: string | null
          created_at?: string | null
          crm?: string | null
          description?: string | null
          expected_close_date?: string | null
          id?: string
          lead_id?: string | null
          lost_reason?: string | null
          monthly_revenue?: string | null
          objective?: string | null
          preferred_contact_time?: string | null
          priority?: string | null
          source?: string | null
          specialty?: string | null
          stage?: string
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_deals_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_follow_ups: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          completed_notes: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          description: string | null
          id: string
          notes: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string | null
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          completed_notes?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          completed_notes?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crm_follow_ups_contact_id_fkey"
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
      dashboard_ai_metrics: {
        Row: {
          created_at: string | null
          id: string
          leads_generated: number | null
          name: string
          number: string | null
          status: string
          token: string | null
          traffic_active: boolean | null
          updated_at: string | null
          whatsapp_access_token: string | null
          whatsapp_business_account_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          name: string
          number?: string | null
          status?: string
          token?: string | null
          traffic_active?: boolean | null
          updated_at?: string | null
          whatsapp_access_token?: string | null
          whatsapp_business_account_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          leads_generated?: number | null
          name?: string
          number?: string | null
          status?: string
          token?: string | null
          traffic_active?: boolean | null
          updated_at?: string | null
          whatsapp_access_token?: string | null
          whatsapp_business_account_id?: string | null
        }
        Relationships: []
      }
      dashboard_leads: {
        Row: {
          acquisition_channel: string | null
          ad_name: string | null
          adset_name: string | null
          contact_time: string | null
          created_at: string | null
          crm: string | null
          current_revenue: string | null
          current_situation: string | null
          email: string | null
          external_id: string | null
          form_name: string | null
          has_secretary: string | null
          ia_id: string | null
          id: string
          mentor_disposition: string | null
          name: string
          phone: string | null
          source: string | null
          specialty: string | null
          status: string
          target_revenue: string | null
          updated_at: string | null
        }
        Insert: {
          acquisition_channel?: string | null
          ad_name?: string | null
          adset_name?: string | null
          contact_time?: string | null
          created_at?: string | null
          crm?: string | null
          current_revenue?: string | null
          current_situation?: string | null
          email?: string | null
          external_id?: string | null
          form_name?: string | null
          has_secretary?: string | null
          ia_id?: string | null
          id?: string
          mentor_disposition?: string | null
          name: string
          phone?: string | null
          source?: string | null
          specialty?: string | null
          status?: string
          target_revenue?: string | null
          updated_at?: string | null
        }
        Update: {
          acquisition_channel?: string | null
          ad_name?: string | null
          adset_name?: string | null
          contact_time?: string | null
          created_at?: string | null
          crm?: string | null
          current_revenue?: string | null
          current_situation?: string | null
          email?: string | null
          external_id?: string | null
          form_name?: string | null
          has_secretary?: string | null
          ia_id?: string | null
          id?: string
          mentor_disposition?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          specialty?: string | null
          status?: string
          target_revenue?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_leads_ia_id_fkey"
            columns: ["ia_id"]
            isOneToOne: false
            referencedRelation: "dashboard_ai_metrics"
            referencedColumns: ["id"]
          },
        ]
      }
      dashboard_messages: {
        Row: {
          content: string | null
          created_at: string | null
          hour_of_day: number | null
          id: string
          image_url: string | null
          lead_id: string | null
          sender: string
          sentiment: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          hour_of_day?: number | null
          id?: string
          image_url?: string | null
          lead_id?: string | null
          sender?: string
          sentiment?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          hour_of_day?: number | null
          id?: string
          image_url?: string | null
          lead_id?: string | null
          sender?: string
          sentiment?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_leads"
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
      facebook_leads: {
        Row: {
          ad_name: string | null
          adset_name: string | null
          canal_aquisicao: string | null
          created_at: string | null
          crm: string | null
          disposicao_mentoria: string | null
          email: string | null
          especializacao: string | null
          faturamento: string | null
          faturamento_desejado: string | null
          form_name: string | null
          horario_contato: string | null
          id: string
          lead_name: string
          phone: string | null
          secretaria: string | null
          situacao_atual: string | null
        }
        Insert: {
          ad_name?: string | null
          adset_name?: string | null
          canal_aquisicao?: string | null
          created_at?: string | null
          crm?: string | null
          disposicao_mentoria?: string | null
          email?: string | null
          especializacao?: string | null
          faturamento?: string | null
          faturamento_desejado?: string | null
          form_name?: string | null
          horario_contato?: string | null
          id: string
          lead_name: string
          phone?: string | null
          secretaria?: string | null
          situacao_atual?: string | null
        }
        Update: {
          ad_name?: string | null
          adset_name?: string | null
          canal_aquisicao?: string | null
          created_at?: string | null
          crm?: string | null
          disposicao_mentoria?: string | null
          email?: string | null
          especializacao?: string | null
          faturamento?: string | null
          faturamento_desejado?: string | null
          form_name?: string | null
          horario_contato?: string | null
          id?: string
          lead_name?: string
          phone?: string | null
          secretaria?: string | null
          situacao_atual?: string | null
        }
        Relationships: []
      }
      financial_accounts: {
        Row: {
          account_number: string | null
          balance: number | null
          bank_name: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          name: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          bank_name?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          name?: string
          type?: string | null
          user_id?: string | null
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
          transaction_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_attachments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_budgets: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          period_end: string
          period_start: string
          status: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          period_end: string
          period_start: string
          status?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          period_end?: string
          period_start?: string
          status?: string | null
          user_id?: string | null
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
          name: string
          parent_id: string | null
          type: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          parent_id?: string | null
          type: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          parent_id?: string | null
          type?: string
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
          recurrence_id: string | null
          status: string | null
          tags: string[] | null
          total_costs: number | null
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
          recurrence_id?: string | null
          status?: string | null
          tags?: string[] | null
          total_costs?: number | null
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
          recurrence_id?: string | null
          status?: string | null
          tags?: string[] | null
          total_costs?: number | null
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
      general_meetings: {
        Row: {
          attendees: string[] | null
          created_at: string
          description: string | null
          duration_minutes: number
          end_time: string
          id: string
          is_busy: boolean
          location: string | null
          meeting_type: Database["public"]["Enums"]["meeting_type"]
          notes: string | null
          start_time: string
          status: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          end_time: string
          id?: string
          is_busy?: boolean
          location?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: string[] | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          end_time?: string
          id?: string
          is_busy?: boolean
          location?: string | null
          meeting_type?: Database["public"]["Enums"]["meeting_type"]
          notes?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_assignments: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          assigned_to: string | null
          created_at: string | null
          first_contact_at: string | null
          id: string
          last_interaction_at: string | null
          lead_id: string | null
          notes: string | null
          priority: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          first_contact_at?: string | null
          id?: string
          last_interaction_at?: string | null
          lead_id?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          assigned_to?: string | null
          created_at?: string | null
          first_contact_at?: string | null
          id?: string
          last_interaction_at?: string | null
          lead_id?: string | null
          notes?: string | null
          priority?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lead_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_assignments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "dashboard_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          contact_id: string
          created_at: string
          duration_minutes: number
          end_time: string
          estimated_value: number | null
          financial_transaction_id: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          start_time: string
          status: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contact_id: string
          created_at?: string
          duration_minutes?: number
          end_time: string
          estimated_value?: number | null
          financial_transaction_id?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          start_time: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_type?: Database["public"]["Enums"]["appointment_type"]
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contact_id?: string
          created_at?: string
          duration_minutes?: number
          end_time?: string
          estimated_value?: number | null
          financial_transaction_id?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          start_time?: string
          status?: Database["public"]["Enums"]["appointment_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "medical_appointments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_appointments_financial_transaction_id_fkey"
            columns: ["financial_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
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
          task_id: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          task_id?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          read?: boolean | null
          task_id?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
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
          role: string | null
          tags: string[] | null
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
          tags?: string[] | null
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
          tags?: string[] | null
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
          final_calls: number | null
          final_contacts: number | null
          finished_at: string | null
          goal_calls: number | null
          goal_contacts: number | null
          id: string
          is_paused: boolean | null
          notes: string | null
          paused_at: string | null
          session_id: string | null
          started_at: string | null
          status: string | null
          total_paused_time: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          created_at?: string | null
          date: string
          ended_at?: string | null
          final_calls?: number | null
          final_contacts?: number | null
          finished_at?: string | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          total_paused_time?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          created_at?: string | null
          date?: string
          ended_at?: string | null
          final_calls?: number | null
          final_contacts?: number | null
          finished_at?: string | null
          goal_calls?: number | null
          goal_contacts?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          session_id?: string | null
          started_at?: string | null
          status?: string | null
          total_paused_time?: number | null
          updated_at?: string | null
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
          result: Json | null
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
          result?: Json | null
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
          result?: Json | null
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
      questoes_exemplo: {
        Row: {
          ano: number
          area_conhecimento: string | null
          banca: string
          correct_option: string | null
          created_at: string | null
          dificuldade: string | null
          explanation: string | null
          fonte: string | null
          id: string
          num_alternatives: number
          numero: number | null
          numero_original: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string | null
          statement: string
          tags: string[] | null
          topic: string
        }
        Insert: {
          ano: number
          area_conhecimento?: string | null
          banca: string
          correct_option?: string | null
          created_at?: string | null
          dificuldade?: string | null
          explanation?: string | null
          fonte?: string | null
          id?: string
          num_alternatives?: number
          numero?: number | null
          numero_original?: string | null
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e?: string | null
          statement: string
          tags?: string[] | null
          topic: string
        }
        Update: {
          ano?: number
          area_conhecimento?: string | null
          banca?: string
          correct_option?: string | null
          created_at?: string | null
          dificuldade?: string | null
          explanation?: string | null
          fonte?: string | null
          id?: string
          num_alternatives?: number
          numero?: number | null
          numero_original?: string | null
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          option_e?: string | null
          statement?: string
          tags?: string[] | null
          topic?: string
        }
        Relationships: []
      }
      recurring_transactions: {
        Row: {
          account_id: string | null
          amount: number
          category_id: string | null
          created_at: string | null
          description: string | null
          frequency: string
          id: string
          is_active: boolean | null
          next_date: string
          type: string
          user_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          frequency: string
          id?: string
          is_active?: boolean | null
          next_date: string
          type: string
          user_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          frequency?: string
          id?: string
          is_active?: boolean | null
          next_date?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_account_id_fkey1"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "financial_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_transactions_category_id_fkey1"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "financial_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      roteamento_pacientes: {
        Row: {
          created_at: string | null
          id: string
          interesse: string | null
          medico_atribuido: string | null
          nome: string | null
          sessionid_secretaria: string | null
          status_secretaria: boolean | null
          telefone: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interesse?: string | null
          medico_atribuido?: string | null
          nome?: string | null
          sessionid_secretaria?: string | null
          status_secretaria?: boolean | null
          telefone: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interesse?: string | null
          medico_atribuido?: string | null
          nome?: string | null
          sessionid_secretaria?: string | null
          status_secretaria?: boolean | null
          telefone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sales_calls: {
        Row: {
          call_type: string | null
          contact_id: string | null
          created_at: string | null
          crm_deal_id: string | null
          deal_id: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          notes: string | null
          outcome: string | null
          scheduled_at: string
          status: string | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          call_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          crm_deal_id?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          scheduled_at: string
          status?: string | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          call_type?: string | null
          contact_id?: string | null
          created_at?: string | null
          crm_deal_id?: string | null
          deal_id?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          outcome?: string | null
          scheduled_at?: string
          status?: string | null
          title?: string
          updated_at?: string | null
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
      user_daily_goals: {
        Row: {
          created_at: string | null
          default_goal_calls: number | null
          default_goal_contacts: number | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_goal_calls?: number | null
          default_goal_contacts?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_goal_calls?: number | null
          default_goal_contacts?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      appointment_type:
        | "first_visit"
        | "return"
        | "procedure"
        | "urgent"
        | "follow_up"
        | "exam"
      commercial_campaign_type:
        | "first_consultation_discount"
        | "procedure_package"
        | "seasonal_promotion"
        | "referral_benefit"
      commercial_interaction_type:
        | "call"
        | "email"
        | "whatsapp"
        | "meeting"
        | "other"
      commercial_lead_origin:
        | "google"
        | "instagram"
        | "facebook"
        | "indication"
        | "website"
        | "other"
      commercial_lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "converted"
        | "lost"
      commercial_payment_method:
        | "cash"
        | "credit_card"
        | "debit_card"
        | "pix"
        | "bank_transfer"
        | "installment"
      commercial_procedure_category:
        | "consultation"
        | "procedure"
        | "exam"
        | "surgery"
        | "other"
      commercial_sale_status: "quote" | "confirmed" | "completed" | "cancelled"
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
      meeting_status: "scheduled" | "completed" | "cancelled"
      meeting_type: "meeting" | "appointment" | "block" | "other"
      payment_status: "pending" | "paid" | "partial" | "cancelled"
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
      appointment_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      appointment_type: [
        "first_visit",
        "return",
        "procedure",
        "urgent",
        "follow_up",
        "exam",
      ],
      commercial_campaign_type: [
        "first_consultation_discount",
        "procedure_package",
        "seasonal_promotion",
        "referral_benefit",
      ],
      commercial_interaction_type: [
        "call",
        "email",
        "whatsapp",
        "meeting",
        "other",
      ],
      commercial_lead_origin: [
        "google",
        "instagram",
        "facebook",
        "indication",
        "website",
        "other",
      ],
      commercial_lead_status: [
        "new",
        "contacted",
        "qualified",
        "converted",
        "lost",
      ],
      commercial_payment_method: [
        "cash",
        "credit_card",
        "debit_card",
        "pix",
        "bank_transfer",
        "installment",
      ],
      commercial_procedure_category: [
        "consultation",
        "procedure",
        "exam",
        "surgery",
        "other",
      ],
      commercial_sale_status: ["quote", "confirmed", "completed", "cancelled"],
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
      meeting_status: ["scheduled", "completed", "cancelled"],
      meeting_type: ["meeting", "appointment", "block", "other"],
      payment_status: ["pending", "paid", "partial", "cancelled"],
    },
  },
} as const
