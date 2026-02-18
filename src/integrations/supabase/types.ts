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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      ad_campaigns_sync: {
        Row: {
          budget: number | null
          clicks: number | null
          connection_id: string
          conversion_value: number | null
          conversions: number | null
          cpa: number | null
          created_at: string
          ctr: number | null
          end_date: string | null
          id: string
          impressions: number | null
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_campaign_id: string
          platform_campaign_name: string
          roas: number | null
          spend: number | null
          start_date: string | null
          status: string
          synced_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          budget?: number | null
          clicks?: number | null
          connection_id: string
          conversion_value?: number | null
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          ctr?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          platform: Database["public"]["Enums"]["ad_platform"]
          platform_campaign_id: string
          platform_campaign_name: string
          roas?: number | null
          spend?: number | null
          start_date?: string | null
          status?: string
          synced_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          budget?: number | null
          clicks?: number | null
          connection_id?: string
          conversion_value?: number | null
          conversions?: number | null
          cpa?: number | null
          created_at?: string
          ctr?: number | null
          end_date?: string | null
          id?: string
          impressions?: number | null
          platform?: Database["public"]["Enums"]["ad_platform"]
          platform_campaign_id?: string
          platform_campaign_name?: string
          roas?: number | null
          spend?: number | null
          start_date?: string | null
          status?: string
          synced_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_sync_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ad_platform_connections"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_platform_connections: {
        Row: {
          account_category: string
          account_id: string
          account_name: string
          api_key: string
          created_at: string
          error_message: string | null
          id: string
          is_active: boolean
          last_sync_at: string | null
          platform: Database["public"]["Enums"]["ad_platform"]
          refresh_token: string | null
          sync_status: Database["public"]["Enums"]["sync_status"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_category?: string
          account_id: string
          account_name: string
          api_key: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          platform: Database["public"]["Enums"]["ad_platform"]
          refresh_token?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_category?: string
          account_id?: string
          account_name?: string
          api_key?: string
          created_at?: string
          error_message?: string | null
          id?: string
          is_active?: boolean
          last_sync_at?: string | null
          platform?: Database["public"]["Enums"]["ad_platform"]
          refresh_token?: string | null
          sync_status?: Database["public"]["Enums"]["sync_status"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          performed_by: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      allowed_emails: {
        Row: {
          created_at: string | null
          created_by: string | null
          email: string
          expires_at: string | null
          id: string
          name: string | null
          notes: string | null
          payment_confirmed: boolean | null
          plan: string | null
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          email: string
          expires_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          payment_confirmed?: boolean | null
          plan?: string | null
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          name?: string | null
          notes?: string | null
          payment_confirmed?: boolean | null
          plan?: string | null
          used_at?: string | null
        }
        Relationships: []
      }
      appointment_stock_usage: {
        Row: {
          appointment_id: string
          created_at: string | null
          deducted: boolean | null
          id: string
          inventory_item_id: string
          quantity: number
        }
        Insert: {
          appointment_id: string
          created_at?: string | null
          deducted?: boolean | null
          id?: string
          inventory_item_id: string
          quantity: number
        }
        Update: {
          appointment_id?: string
          created_at?: string | null
          deducted?: boolean | null
          id?: string
          inventory_item_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "appointment_stock_usage_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "medical_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointment_stock_usage_inventory_item_id_fkey"
            columns: ["inventory_item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_campaigns: {
        Row: {
          ad_campaign_sync_id: string | null
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
          utm_template_id: string | null
        }
        Insert: {
          ad_campaign_sync_id?: string | null
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
          utm_template_id?: string | null
        }
        Update: {
          ad_campaign_sync_id?: string | null
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
          utm_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "commercial_campaigns_ad_campaign_sync_id_fkey"
            columns: ["ad_campaign_sync_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_campaigns_user_id_profiles_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_campaigns_utm_template_id_fkey"
            columns: ["utm_template_id"]
            isOneToOne: false
            referencedRelation: "utm_templates"
            referencedColumns: ["id"]
          },
        ]
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
          conversion_score: number | null
          converted_at: string | null
          created_at: string
          email: string | null
          estimated_value: number | null
          first_response_time_minutes: number | null
          id: string
          name: string
          notes: string | null
          optimal_contact_hour: number | null
          organization_id: string | null
          origin: Database["public"]["Enums"]["commercial_lead_origin"]
          phone: string | null
          procedure_id: string | null
          score_updated_at: string | null
          status: Database["public"]["Enums"]["commercial_lead_status"]
          updated_at: string
          urgency_keywords: string[] | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          conversion_score?: number | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          first_response_time_minutes?: number | null
          id?: string
          name: string
          notes?: string | null
          optimal_contact_hour?: number | null
          organization_id?: string | null
          origin?: Database["public"]["Enums"]["commercial_lead_origin"]
          phone?: string | null
          procedure_id?: string | null
          score_updated_at?: string | null
          status?: Database["public"]["Enums"]["commercial_lead_status"]
          updated_at?: string
          urgency_keywords?: string[] | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          conversion_score?: number | null
          converted_at?: string | null
          created_at?: string
          email?: string | null
          estimated_value?: number | null
          first_response_time_minutes?: number | null
          id?: string
          name?: string
          notes?: string | null
          optimal_contact_hour?: number | null
          organization_id?: string | null
          origin?: Database["public"]["Enums"]["commercial_lead_origin"]
          phone?: string | null
          procedure_id?: string | null
          score_updated_at?: string | null
          status?: Database["public"]["Enums"]["commercial_lead_status"]
          updated_at?: string
          urgency_keywords?: string[] | null
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
          {
            foreignKeyName: "commercial_leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_leads_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "commercial_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_leads_user_id_profiles_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_procedure_assignments: {
        Row: {
          created_at: string
          id: string
          payment_amount: number
          procedure_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_amount?: number
          procedure_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_amount?: number
          procedure_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_procedure_assignments_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "commercial_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_procedure_assignments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          organization_id: string | null
          price: number
          sinal_percentage: number | null
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
          organization_id?: string | null
          price: number
          sinal_percentage?: number | null
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
          organization_id?: string | null
          price?: number
          sinal_percentage?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "commercial_procedures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_procedures_user_id_profiles_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      commercial_sales: {
        Row: {
          appointment_id: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          id: string
          implementation_fee: number | null
          installments: number | null
          lead_id: string | null
          needs_ai: boolean | null
          notes: string | null
          organization_id: string | null
          payment_method:
            | Database["public"]["Enums"]["commercial_payment_method"]
            | null
          procedure_id: string | null
          sale_date: string | null
          status: Database["public"]["Enums"]["commercial_sale_status"]
          support_fee: number | null
          title: string | null
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          appointment_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          implementation_fee?: number | null
          installments?: number | null
          lead_id?: string | null
          needs_ai?: boolean | null
          notes?: string | null
          organization_id?: string | null
          payment_method?:
            | Database["public"]["Enums"]["commercial_payment_method"]
            | null
          procedure_id?: string | null
          sale_date?: string | null
          status?: Database["public"]["Enums"]["commercial_sale_status"]
          support_fee?: number | null
          title?: string | null
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          appointment_id?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          implementation_fee?: number | null
          installments?: number | null
          lead_id?: string | null
          needs_ai?: boolean | null
          notes?: string | null
          organization_id?: string | null
          payment_method?:
            | Database["public"]["Enums"]["commercial_payment_method"]
            | null
          procedure_id?: string | null
          sale_date?: string | null
          status?: Database["public"]["Enums"]["commercial_sale_status"]
          support_fee?: number | null
          title?: string | null
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
            foreignKeyName: "commercial_sales_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_sales_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "commercial_procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "commercial_sales_user_id_profiles_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cortana_daily_usage: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          usage_count: number | null
          usage_date: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          usage_count?: number | null
          usage_date?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          usage_count?: number | null
          usage_date?: string
          user_id?: string
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
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
          {
            foreignKeyName: "crm_activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_ai_analysis_batches: {
        Row: {
          completed_at: string | null
          created_at: string | null
          data_summary: Json | null
          error_message: string | null
          id: string
          insights_count: number | null
          processing_time_ms: number | null
          status: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          data_summary?: Json | null
          error_message?: string | null
          id?: string
          insights_count?: number | null
          processing_time_ms?: number | null
          status?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          data_summary?: Json | null
          error_message?: string | null
          id?: string
          insights_count?: number | null
          processing_time_ms?: number | null
          status?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_ai_insights: {
        Row: {
          analysis_batch_id: string | null
          applied_at: string | null
          category: string
          confidence: number | null
          data_sources: string[] | null
          description: string
          expires_at: string | null
          generated_at: string | null
          id: string
          impact: string | null
          is_actionable: boolean | null
          is_applied: boolean | null
          title: string
          trend: string | null
          user_id: string
        }
        Insert: {
          analysis_batch_id?: string | null
          applied_at?: string | null
          category: string
          confidence?: number | null
          data_sources?: string[] | null
          description: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          impact?: string | null
          is_actionable?: boolean | null
          is_applied?: boolean | null
          title: string
          trend?: string | null
          user_id: string
        }
        Update: {
          analysis_batch_id?: string | null
          applied_at?: string | null
          category?: string
          confidence?: number | null
          data_sources?: string[] | null
          description?: string
          expires_at?: string | null
          generated_at?: string | null
          id?: string
          impact?: string | null
          is_actionable?: boolean | null
          is_applied?: boolean | null
          title?: string
          trend?: string | null
          user_id?: string
        }
        Relationships: []
      }
      crm_contacts: {
        Row: {
          allergies: string[] | null
          birth_date: string | null
          blood_type: string | null
          chronic_conditions: string[] | null
          company: string | null
          created_at: string
          current_medications: string[] | null
          custom_fields: Json | null
          email: string | null
          emergency_contact: Json | null
          full_name: string
          id: string
          last_appointment_at: string | null
          last_contact_at: string | null
          lead_score: number | null
          organization_id: string | null
          phone: string | null
          position: string | null
          reactivation_eligible: boolean | null
          reactivation_last_sent_at: string | null
          service_value: number | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          birth_date?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          company?: string | null
          created_at?: string
          current_medications?: string[] | null
          custom_fields?: Json | null
          email?: string | null
          emergency_contact?: Json | null
          full_name: string
          id?: string
          last_appointment_at?: string | null
          last_contact_at?: string | null
          lead_score?: number | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          reactivation_eligible?: boolean | null
          reactivation_last_sent_at?: string | null
          service_value?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          birth_date?: string | null
          blood_type?: string | null
          chronic_conditions?: string[] | null
          company?: string | null
          created_at?: string
          current_medications?: string[] | null
          custom_fields?: Json | null
          email?: string | null
          emergency_contact?: Json | null
          full_name?: string
          id?: string
          last_appointment_at?: string | null
          last_contact_at?: string | null
          lead_score?: number | null
          organization_id?: string | null
          phone?: string | null
          position?: string | null
          reactivation_eligible?: boolean | null
          reactivation_last_sent_at?: string | null
          service_value?: number | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          is_defaulting: boolean | null
          is_in_treatment: boolean | null
          organization_id: string | null
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
          is_defaulting?: boolean | null
          is_in_treatment?: boolean | null
          organization_id?: string | null
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
          is_defaulting?: boolean | null
          is_in_treatment?: boolean | null
          organization_id?: string | null
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
          {
            foreignKeyName: "crm_deals_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_follow_ups: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          contact_id: string | null
          created_at: string | null
          deal_id: string | null
          id: string
          notes: string | null
          organization_id: string | null
          scheduled_date: string
          type: string
          user_id: string | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          scheduled_date: string
          type?: string
          user_id?: string | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string | null
          deal_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          scheduled_date?: string
          type?: string
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
          {
            foreignKeyName: "crm_follow_ups_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "crm_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_follow_ups_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      debug_logs: {
        Row: {
          created_at: string | null
          data: Json | null
          function_name: string | null
          id: string
          message: string | null
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          function_name?: string | null
          id?: string
          message?: string | null
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          function_name?: string | null
          id?: string
          message?: string | null
        }
        Relationships: []
      }
      doctor_working_hours: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          start_time: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          start_time: string
          user_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          start_time?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "doctor_working_hours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_accounts: {
        Row: {
          account_number: string | null
          bank_name: string | null
          color: string | null
          created_at: string | null
          current_balance: number | null
          id: string
          initial_balance: number | null
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string | null
          type: Database["public"]["Enums"]["account_type"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_number?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id?: string | null
          type?: Database["public"]["Enums"]["account_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_number?: string | null
          bank_name?: string | null
          color?: string | null
          created_at?: string | null
          current_balance?: number | null
          id?: string
          initial_balance?: number | null
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string | null
          type?: Database["public"]["Enums"]["account_type"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "financial_accounts_user_id_fkey_profiles"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          amount: number
          category_id: string | null
          created_at: string | null
          id: string
          organization_id: string | null
          period_end: string
          period_start: string
          status: Database["public"]["Enums"]["budget_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          period_end: string
          period_start: string
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string | null
          id?: string
          organization_id?: string | null
          period_end?: string
          period_start?: string
          status?: Database["public"]["Enums"]["budget_status"] | null
          updated_at?: string | null
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
          {
            foreignKeyName: "financial_budgets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          is_system: boolean | null
          name: string
          organization_id: string | null
          parent_id: string | null
          type: Database["public"]["Enums"]["category_type"]
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name: string
          organization_id?: string | null
          parent_id?: string | null
          type: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_system?: boolean | null
          name?: string
          organization_id?: string | null
          parent_id?: string | null
          type?: Database["public"]["Enums"]["category_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          created_at: string | null
          end_date: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id: string
          is_active: boolean | null
          next_occurrence: string
          organization_id: string | null
          start_date: string
          template_transaction_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_date?: string | null
          frequency: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean | null
          next_occurrence: string
          organization_id?: string | null
          start_date: string
          template_transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_date?: string | null
          frequency?: Database["public"]["Enums"]["recurrence_frequency"]
          id?: string
          is_active?: boolean | null
          next_occurrence?: string
          organization_id?: string | null
          start_date?: string
          template_transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_recurring_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
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
          organization_id: string | null
          payment_method: Database["public"]["Enums"]["payment_method"] | null
          recurrence_id: string | null
          status: Database["public"]["Enums"]["transaction_status"] | null
          tags: string[] | null
          total_costs: number | null
          transaction_date: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string | null
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
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          recurrence_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tags?: string[] | null
          total_costs?: number | null
          transaction_date?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string | null
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
          organization_id?: string | null
          payment_method?: Database["public"]["Enums"]["payment_method"] | null
          recurrence_id?: string | null
          status?: Database["public"]["Enums"]["transaction_status"] | null
          tags?: string[] | null
          total_costs?: number | null
          transaction_date?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
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
            foreignKeyName: "financial_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
          organization_id: string | null
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
          organization_id?: string | null
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
          organization_id?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["meeting_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "general_meetings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_utms: {
        Row: {
          ad_campaign_sync_id: string | null
          clicks: number | null
          conversions: number | null
          created_at: string
          full_url: string
          id: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_campaign_sync_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          full_url: string
          id?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_campaign_sync_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          full_url?: string
          id?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_utms_ad_campaign_sync_id_fkey"
            columns: ["ad_campaign_sync_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns_sync"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_utms_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "utm_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_batches: {
        Row: {
          batch_number: string
          created_at: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          item_id: string
          organization_id: string | null
          quantity: number
          updated_at: string | null
        }
        Insert: {
          batch_number: string
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          item_id: string
          organization_id?: string | null
          quantity?: number
          updated_at?: string | null
        }
        Update: {
          batch_number?: string
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          item_id?: string
          organization_id?: string | null
          quantity?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_batches_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_batches_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          category: string | null
          cost_price: number | null
          created_at: string | null
          description: string | null
          id: string
          min_stock: number | null
          name: string
          organization_id: string | null
          sell_price: number | null
          supplier_id: string | null
          unit: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_stock?: number | null
          name: string
          organization_id?: string | null
          sell_price?: number | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          cost_price?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          min_stock?: number | null
          name?: string
          organization_id?: string | null
          sell_price?: number | null
          supplier_id?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "inventory_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          batch_id: string
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          new_balance: number | null
          previous_balance: number | null
          quantity: number
          reference_id: string | null
          type: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          new_balance?: number | null
          previous_balance?: number | null
          quantity: number
          reference_id?: string | null
          type: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          new_balance?: number | null
          previous_balance?: number | null
          quantity?: number
          reference_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          contact_person: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          phone: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact_person?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_suppliers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transaction_items: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          item_id: string
          organization_id: string | null
          quantity: number
          total_price: number | null
          transaction_id: string
          unit_price: number | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          item_id: string
          organization_id?: string | null
          quantity: number
          total_price?: number | null
          transaction_id: string
          unit_price?: number | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          item_id?: string
          organization_id?: string | null
          quantity?: number
          total_price?: number | null
          transaction_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transaction_items_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "inventory_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transaction_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transaction_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transaction_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "inventory_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          financial_transaction_id: string | null
          id: string
          invoice_number: string | null
          organization_id: string | null
          status: string
          supplier_id: string | null
          total_amount: number | null
          transaction_date: string
          type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          financial_transaction_id?: string | null
          id?: string
          invoice_number?: string | null
          organization_id?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          transaction_date?: string
          type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          financial_transaction_id?: string | null
          id?: string
          invoice_number?: string | null
          organization_id?: string | null
          status?: string
          supplier_id?: string | null
          total_amount?: number | null
          transaction_date?: string
          type?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_financial_transaction_id_fkey"
            columns: ["financial_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_financial_transaction_id_fkey"
            columns: ["financial_transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transactions_with_net_profit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "inventory_suppliers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_score_history: {
        Row: {
          calculated_at: string | null
          contact_id: string | null
          factors: Json
          id: string
          lead_id: string | null
          score: number
        }
        Insert: {
          calculated_at?: string | null
          contact_id?: string | null
          factors?: Json
          id?: string
          lead_id?: string | null
          score: number
        }
        Update: {
          calculated_at?: string | null
          contact_id?: string | null
          factors?: Json
          id?: string
          lead_id?: string | null
          score?: number
        }
        Relationships: [
          {
            foreignKeyName: "lead_score_history_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lead_score_history_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "commercial_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_scoring_factors: {
        Row: {
          config: Json | null
          created_at: string | null
          enabled: boolean | null
          factor_name: string
          id: string
          updated_at: string | null
          user_id: string
          weight: number
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          factor_name: string
          id?: string
          updated_at?: string | null
          user_id: string
          weight?: number
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          enabled?: boolean | null
          factor_name?: string
          id?: string
          updated_at?: string | null
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      medical_appointments: {
        Row: {
          appointment_type: Database["public"]["Enums"]["appointment_type"]
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          contact_id: string
          created_at: string
          doctor_id: string | null
          duration_minutes: number
          end_time: string
          estimated_value: number | null
          financial_transaction_id: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          organization_id: string | null
          paid_in_advance: boolean | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          sinal_amount: number | null
          sinal_paid: boolean | null
          sinal_paid_at: string | null
          sinal_receipt_url: string | null
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
          doctor_id?: string | null
          duration_minutes?: number
          end_time: string
          estimated_value?: number | null
          financial_transaction_id?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_in_advance?: boolean | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          sinal_amount?: number | null
          sinal_paid?: boolean | null
          sinal_paid_at?: string | null
          sinal_receipt_url?: string | null
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
          doctor_id?: string | null
          duration_minutes?: number
          end_time?: string
          estimated_value?: number | null
          financial_transaction_id?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          organization_id?: string | null
          paid_in_advance?: boolean | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          sinal_amount?: number | null
          sinal_paid?: boolean | null
          sinal_paid_at?: string | null
          sinal_receipt_url?: string | null
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
            foreignKeyName: "medical_appointments_doctor_id_profiles_fk"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_appointments_financial_transaction_id_fkey"
            columns: ["financial_transaction_id"]
            isOneToOne: false
            referencedRelation: "financial_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_appointments_financial_transaction_id_fkey"
            columns: ["financial_transaction_id"]
            isOneToOne: false
            referencedRelation: "vw_transactions_with_net_profit"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_appointments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_appointments_user_id_profiles_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_record_revisions: {
        Row: {
          changes: Json
          created_at: string
          edited_at: string
          edited_by: string
          id: string
          ip_address: unknown
          medical_record_id: string
          reason: string | null
        }
        Insert: {
          changes: Json
          created_at?: string
          edited_at?: string
          edited_by: string
          id?: string
          ip_address?: unknown
          medical_record_id: string
          reason?: string | null
        }
        Update: {
          changes?: Json
          created_at?: string
          edited_at?: string
          edited_by?: string
          id?: string
          ip_address?: unknown
          medical_record_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_record_revisions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
        ]
      }
      medical_records: {
        Row: {
          allergies: string[] | null
          allergies_noted: string[] | null
          appointment_id: string | null
          assessment: string | null
          chief_complaint: string | null
          cid_codes: string[] | null
          clinical_notes: string | null
          completed_at: string | null
          complications: string | null
          contact_id: string
          created_at: string
          diagnosis: string[] | null
          diagnostic_hypothesis: string | null
          doctor_id: string
          exams_requested: Json | null
          family_history: string | null
          follow_up_date: string | null
          follow_up_notes: string | null
          general_condition: string | null
          history_current_illness: string | null
          history_present_illness: string | null
          id: string
          medications: string[] | null
          next_appointment_date: string | null
          organization_id: string | null
          past_medical_history: string | null
          patient_instructions: string | null
          patient_notes: string | null
          physical_exam_notes: string | null
          physical_examination: string | null
          prescriptions: Json | null
          record_status: string | null
          record_type: Database["public"]["Enums"]["medical_record_type"]
          secondary_diagnoses: string[] | null
          social_history: string | null
          status: Database["public"]["Enums"]["medical_record_status"]
          treatment_plan: string | null
          updated_at: string
          user_id: string
          vital_signs: Json | null
        }
        Insert: {
          allergies?: string[] | null
          allergies_noted?: string[] | null
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          cid_codes?: string[] | null
          clinical_notes?: string | null
          completed_at?: string | null
          complications?: string | null
          contact_id: string
          created_at?: string
          diagnosis?: string[] | null
          diagnostic_hypothesis?: string | null
          doctor_id: string
          exams_requested?: Json | null
          family_history?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          general_condition?: string | null
          history_current_illness?: string | null
          history_present_illness?: string | null
          id?: string
          medications?: string[] | null
          next_appointment_date?: string | null
          organization_id?: string | null
          past_medical_history?: string | null
          patient_instructions?: string | null
          patient_notes?: string | null
          physical_exam_notes?: string | null
          physical_examination?: string | null
          prescriptions?: Json | null
          record_status?: string | null
          record_type?: Database["public"]["Enums"]["medical_record_type"]
          secondary_diagnoses?: string[] | null
          social_history?: string | null
          status?: Database["public"]["Enums"]["medical_record_status"]
          treatment_plan?: string | null
          updated_at?: string
          user_id: string
          vital_signs?: Json | null
        }
        Update: {
          allergies?: string[] | null
          allergies_noted?: string[] | null
          appointment_id?: string | null
          assessment?: string | null
          chief_complaint?: string | null
          cid_codes?: string[] | null
          clinical_notes?: string | null
          completed_at?: string | null
          complications?: string | null
          contact_id?: string
          created_at?: string
          diagnosis?: string[] | null
          diagnostic_hypothesis?: string | null
          doctor_id?: string
          exams_requested?: Json | null
          family_history?: string | null
          follow_up_date?: string | null
          follow_up_notes?: string | null
          general_condition?: string | null
          history_current_illness?: string | null
          history_present_illness?: string | null
          id?: string
          medications?: string[] | null
          next_appointment_date?: string | null
          organization_id?: string | null
          past_medical_history?: string | null
          patient_instructions?: string | null
          patient_notes?: string | null
          physical_exam_notes?: string | null
          physical_examination?: string | null
          prescriptions?: Json | null
          record_status?: string | null
          record_type?: Database["public"]["Enums"]["medical_record_type"]
          secondary_diagnoses?: string[] | null
          social_history?: string | null
          status?: Database["public"]["Enums"]["medical_record_status"]
          treatment_plan?: string | null
          updated_at?: string
          user_id?: string
          vital_signs?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "medical_records_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "medical_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "medical_records_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_oauth_sessions: {
        Row: {
          access_token: string
          ad_accounts: Json | null
          businesses: Json | null
          created_at: string | null
          expires_at: string
          id: string
          token_expires_at: string
          user_id: string
          whatsapp_accounts: Json | null
        }
        Insert: {
          access_token: string
          ad_accounts?: Json | null
          businesses?: Json | null
          created_at?: string | null
          expires_at: string
          id?: string
          token_expires_at: string
          user_id: string
          whatsapp_accounts?: Json | null
        }
        Update: {
          access_token?: string
          ad_accounts?: Json | null
          businesses?: Json | null
          created_at?: string | null
          expires_at?: string
          id?: string
          token_expires_at?: string
          user_id?: string
          whatsapp_accounts?: Json | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          metadata: Json | null
          organization_id: string | null
          read: boolean | null
          title: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          read?: boolean | null
          title: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          metadata?: Json | null
          organization_id?: string | null
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_state: {
        Row: {
          clinic_data: Json | null
          created_at: string | null
          current_step: number | null
          doctor_data: Json | null
          id: string
          procedures_data: Json | null
          team_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          clinic_data?: Json | null
          created_at?: string | null
          current_step?: number | null
          doctor_data?: Json | null
          id?: string
          procedures_data?: Json | null
          team_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          clinic_data?: Json | null
          created_at?: string | null
          current_step?: number | null
          doctor_data?: Json | null
          id?: string
          procedures_data?: Json | null
          team_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          additional_member_price: number
          city: string | null
          created_at: string
          id: string
          member_limit: number
          name: string
          owner_id: string | null
          phone: string | null
          plan: string | null
          slug: string
          status: string | null
          updated_at: string
        }
        Insert: {
          additional_member_price?: number
          city?: string | null
          created_at?: string
          id?: string
          member_limit?: number
          name: string
          owner_id?: string | null
          phone?: string | null
          plan?: string | null
          slug: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          additional_member_price?: number
          city?: string | null
          created_at?: string
          id?: string
          member_limit?: number
          name?: string
          owner_id?: string | null
          phone?: string | null
          plan?: string | null
          slug?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prescriptions: {
        Row: {
          contact_id: string
          created_at: string | null
          doctor_id: string
          id: string
          is_printed: boolean | null
          medical_record_id: string | null
          medications: Json
          notes: string | null
          organization_id: string | null
          prescription_date: string | null
          prescription_type: string | null
          printed_at: string | null
          updated_at: string | null
          valid_until: string | null
        }
        Insert: {
          contact_id: string
          created_at?: string | null
          doctor_id: string
          id?: string
          is_printed?: boolean | null
          medical_record_id?: string | null
          medications: Json
          notes?: string | null
          organization_id?: string | null
          prescription_date?: string | null
          prescription_type?: string | null
          printed_at?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Update: {
          contact_id?: string
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_printed?: boolean | null
          medical_record_id?: string | null
          medications?: Json
          notes?: string | null
          organization_id?: string | null
          prescription_date?: string | null
          prescription_type?: string | null
          printed_at?: string | null
          updated_at?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_medical_record_id_fkey"
            columns: ["medical_record_id"]
            isOneToOne: false
            referencedRelation: "medical_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prescriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      problem_status: {
        Row: {
          is_resolved: boolean | null
          problem_id: string
          updated_at: string | null
        }
        Insert: {
          is_resolved?: boolean | null
          problem_id: string
          updated_at?: string | null
        }
        Update: {
          is_resolved?: boolean | null
          problem_id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          consultation_value: number | null
          created_at: string | null
          doctor_id: string | null
          email: string
          enable_agenda_alerts: boolean | null
          force_password_change: boolean | null
          full_name: string | null
          id: string
          invited_by: string | null
          is_active: boolean | null
          is_super_admin: boolean | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          organization_id: string | null
          role: Database["public"]["Enums"]["user_role"]
          specialty: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          consultation_value?: number | null
          created_at?: string | null
          doctor_id?: string | null
          email: string
          enable_agenda_alerts?: boolean | null
          force_password_change?: boolean | null
          full_name?: string | null
          id: string
          invited_by?: string | null
          is_active?: boolean | null
          is_super_admin?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          consultation_value?: number | null
          created_at?: string | null
          doctor_id?: string | null
          email?: string
          enable_agenda_alerts?: boolean | null
          force_password_change?: boolean | null
          full_name?: string | null
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          is_super_admin?: boolean | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          organization_id?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          specialty?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      prospecting_daily_reports: {
        Row: {
          appointments_set: number | null
          calls_made: number | null
          contacts_reached: number | null
          created_at: string | null
          deals_closed: number | null
          id: string
          is_paused: boolean | null
          notes: string | null
          paused_at: string | null
          report_date: string
          revenue: number | null
          total_paused_time: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          created_at?: string | null
          deals_closed?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          report_date: string
          revenue?: number | null
          total_paused_time?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          appointments_set?: number | null
          calls_made?: number | null
          contacts_reached?: number | null
          created_at?: string | null
          deals_closed?: number | null
          id?: string
          is_paused?: boolean | null
          notes?: string | null
          paused_at?: string | null
          report_date?: string
          revenue?: number | null
          total_paused_time?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      prospecting_scripts: {
        Row: {
          category: string | null
          content: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      prospecting_sessions: {
        Row: {
          contact_id: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          result: Database["public"]["Enums"]["session_result"] | null
          script_id: string | null
          started_at: string | null
          user_id: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          result?: Database["public"]["Enums"]["session_result"] | null
          script_id?: string | null
          started_at?: string | null
          user_id?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          result?: Database["public"]["Enums"]["session_result"] | null
          script_id?: string | null
          started_at?: string | null
          user_id?: string | null
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
      questoes: {
        Row: {
          correct_option: string
          created_at: string | null
          explanation: string | null
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          question_number: number
          simulado_id: string
          statement: string
          topic: string
        }
        Insert: {
          correct_option: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          option_e: string
          question_number: number
          simulado_id: string
          statement: string
          topic: string
        }
        Update: {
          correct_option?: string
          created_at?: string | null
          explanation?: string | null
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          option_e?: string
          question_number?: number
          simulado_id?: string
          statement?: string
          topic?: string
        }
        Relationships: [
          {
            foreignKeyName: "questoes_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      reactivation_campaigns: {
        Row: {
          created_at: string | null
          enabled: boolean | null
          id: string
          inactive_period_months: number | null
          message_templates: Json
          name: string
          schedule_config: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          inactive_period_months?: number | null
          message_templates?: Json
          name: string
          schedule_config?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          enabled?: boolean | null
          id?: string
          inactive_period_months?: number | null
          message_templates?: Json
          name?: string
          schedule_config?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      reactivation_messages: {
        Row: {
          appointment_id: string | null
          appointment_scheduled: boolean | null
          campaign_id: string | null
          channel: string
          contact_id: string
          created_at: string | null
          delivered_at: string | null
          id: string
          message_content: string
          read_at: string | null
          response_received: boolean | null
          response_received_at: string | null
          sent_at: string | null
          status: string
          template_variant: string
        }
        Insert: {
          appointment_id?: string | null
          appointment_scheduled?: boolean | null
          campaign_id?: string | null
          channel: string
          contact_id: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_content: string
          read_at?: string | null
          response_received?: boolean | null
          response_received_at?: string | null
          sent_at?: string | null
          status?: string
          template_variant: string
        }
        Update: {
          appointment_id?: string | null
          appointment_scheduled?: boolean | null
          campaign_id?: string | null
          channel?: string
          contact_id?: string
          created_at?: string | null
          delivered_at?: string | null
          id?: string
          message_content?: string
          read_at?: string | null
          response_received?: boolean | null
          response_received_at?: string | null
          sent_at?: string | null
          status?: string
          template_variant?: string
        }
        Relationships: [
          {
            foreignKeyName: "reactivation_messages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "medical_appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_messages_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "reactivation_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reactivation_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
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
          organization_id: string | null
          scheduled_at: string
          status: Database["public"]["Enums"]["sales_call_status"]
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
          organization_id?: string | null
          scheduled_at: string
          status?: Database["public"]["Enums"]["sales_call_status"]
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
          organization_id?: string | null
          scheduled_at?: string
          status?: Database["public"]["Enums"]["sales_call_status"]
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
          {
            foreignKeyName: "sales_calls_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      secretary_doctor_links: {
        Row: {
          created_at: string | null
          doctor_id: string
          id: string
          is_active: boolean | null
          organization_id: string | null
          secretary_id: string
        }
        Insert: {
          created_at?: string | null
          doctor_id: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          secretary_id: string
        }
        Update: {
          created_at?: string | null
          doctor_id?: string
          id?: string
          is_active?: boolean | null
          organization_id?: string | null
          secretary_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "secretary_doctor_links_doctor_id_fkey"
            columns: ["doctor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretary_doctor_links_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "secretary_doctor_links_secretary_id_fkey"
            columns: ["secretary_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      simulados: {
        Row: {
          approval_chance: number | null
          area: string | null
          banca: string | null
          completed_at: string | null
          correct_answers: number | null
          created_at: string | null
          id: string
          mode: string | null
          question_type: string | null
          score_percentage: number | null
          started_at: string | null
          status: string | null
          strong_topics: string[] | null
          student_id: string
          total_questions: number | null
          weak_topics: string[] | null
          wrong_answers: number | null
        }
        Insert: {
          approval_chance?: number | null
          area?: string | null
          banca?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          mode?: string | null
          question_type?: string | null
          score_percentage?: number | null
          started_at?: string | null
          status?: string | null
          strong_topics?: string[] | null
          student_id: string
          total_questions?: number | null
          weak_topics?: string[] | null
          wrong_answers?: number | null
        }
        Update: {
          approval_chance?: number | null
          area?: string | null
          banca?: string | null
          completed_at?: string | null
          correct_answers?: number | null
          created_at?: string | null
          id?: string
          mode?: string | null
          question_type?: string | null
          score_percentage?: number | null
          started_at?: string | null
          status?: string | null
          strong_topics?: string[] | null
          student_id?: string
          total_questions?: number | null
          weak_topics?: string[] | null
          wrong_answers?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "simulados_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "student_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      specialty_procedures: {
        Row: {
          category: string
          default_duration_minutes: number | null
          default_price: number
          description: string | null
          id: string
          name: string
          specialty: string
        }
        Insert: {
          category?: string
          default_duration_minutes?: number | null
          default_price: number
          description?: string | null
          id?: string
          name: string
          specialty: string
        }
        Update: {
          category?: string
          default_duration_minutes?: number | null
          default_price?: number
          description?: string | null
          id?: string
          name?: string
          specialty?: string
        }
        Relationships: []
      }
      student_answers: {
        Row: {
          answered_at: string | null
          id: string
          is_correct: boolean | null
          question_id: string
          simulado_id: string
          student_answer: string | null
        }
        Insert: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id: string
          simulado_id: string
          student_answer?: string | null
        }
        Update: {
          answered_at?: string | null
          id?: string
          is_correct?: boolean | null
          question_id?: string
          simulado_id?: string
          student_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_simulado_id_fkey"
            columns: ["simulado_id"]
            isOneToOne: false
            referencedRelation: "simulados"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          especialidade: string | null
          full_name: string | null
          id: string
          nome_completo: string | null
          specialty: string | null
          target_institution: string | null
          updated_at: string | null
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          especialidade?: string | null
          full_name?: string | null
          id: string
          nome_completo?: string | null
          specialty?: string | null
          target_institution?: string | null
          updated_at?: string | null
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          especialidade?: string | null
          full_name?: string | null
          id?: string
          nome_completo?: string | null
          specialty?: string | null
          target_institution?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      task_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id: string
          storage_path: string
          task_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size: number
          file_type: string
          file_url: string
          id?: string
          storage_path: string
          task_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number
          file_type?: string
          file_url?: string
          id?: string
          storage_path?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_attachments_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_categories: {
        Row: {
          color: string
          created_at: string | null
          icon: string | null
          id: string
          is_default: boolean | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          icon?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
          organization_id: string | null
          position: number | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          sale_id: string | null
          status: Database["public"]["Enums"]["task_status"] | null
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
          organization_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
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
          organization_id?: string | null
          position?: number | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          sale_id?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
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
          {
            foreignKeyName: "tasks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "commercial_sales"
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
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at: string | null
          description: string | null
          id: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          attachment_id?: string | null
          cost_type: Database["public"]["Enums"]["cost_type"]
          created_at?: string | null
          description?: string | null
          id?: string
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          attachment_id?: string | null
          cost_type?: Database["public"]["Enums"]["cost_type"]
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
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      utm_templates: {
        Row: {
          base_url: string
          created_at: string
          id: string
          is_active: boolean
          name: string
          updated_at: string
          user_id: string
          utm_campaign: string
          utm_content: string | null
          utm_medium: string
          utm_source: string
          utm_term: string | null
        }
        Insert: {
          base_url: string
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          updated_at?: string
          user_id: string
          utm_campaign: string
          utm_content?: string | null
          utm_medium: string
          utm_source: string
          utm_term?: string | null
        }
        Update: {
          base_url?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          updated_at?: string
          user_id?: string
          utm_campaign?: string
          utm_content?: string | null
          utm_medium?: string
          utm_source?: string
          utm_term?: string | null
        }
        Relationships: []
      }
      voip_call_sessions: {
        Row: {
          answered_at: string | null
          contact_id: string | null
          contact_name: string | null
          conversation_id: string | null
          created_at: string | null
          direction: Database["public"]["Enums"]["voip_call_direction"]
          duration_seconds: number | null
          ended_at: string | null
          error_code: string | null
          error_message: string | null
          from_number: string
          id: string
          initiated_at: string | null
          metadata: Json | null
          notes: string | null
          provider: Database["public"]["Enums"]["voip_call_provider"] | null
          recording_duration_seconds: number | null
          recording_url: string | null
          status: Database["public"]["Enums"]["voip_call_status"] | null
          to_number: string
          transcription: string | null
          twilio_call_sid: string | null
          updated_at: string | null
          user_id: string
          whatsapp_call_id: string | null
        }
        Insert: {
          answered_at?: string | null
          contact_id?: string | null
          contact_name?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction: Database["public"]["Enums"]["voip_call_direction"]
          duration_seconds?: number | null
          ended_at?: string | null
          error_code?: string | null
          error_message?: string | null
          from_number: string
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          notes?: string | null
          provider?: Database["public"]["Enums"]["voip_call_provider"] | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          status?: Database["public"]["Enums"]["voip_call_status"] | null
          to_number: string
          transcription?: string | null
          twilio_call_sid?: string | null
          updated_at?: string | null
          user_id: string
          whatsapp_call_id?: string | null
        }
        Update: {
          answered_at?: string | null
          contact_id?: string | null
          contact_name?: string | null
          conversation_id?: string | null
          created_at?: string | null
          direction?: Database["public"]["Enums"]["voip_call_direction"]
          duration_seconds?: number | null
          ended_at?: string | null
          error_code?: string | null
          error_message?: string | null
          from_number?: string
          id?: string
          initiated_at?: string | null
          metadata?: Json | null
          notes?: string | null
          provider?: Database["public"]["Enums"]["voip_call_provider"] | null
          recording_duration_seconds?: number | null
          recording_url?: string | null
          status?: Database["public"]["Enums"]["voip_call_status"] | null
          to_number?: string
          transcription?: string | null
          twilio_call_sid?: string | null
          updated_at?: string | null
          user_id?: string
          whatsapp_call_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voip_call_sessions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voip_call_sessions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      voip_config: {
        Row: {
          created_at: string | null
          default_provider:
            | Database["public"]["Enums"]["voip_call_provider"]
            | null
          display_phone_number: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          recording_enabled: boolean | null
          recording_storage_path: string | null
          sip_domain: string | null
          sip_password: string | null
          sip_server_hostname: string | null
          sip_username: string | null
          twilio_account_sid: string | null
          twilio_api_key_secret: string | null
          twilio_api_key_sid: string | null
          twilio_auth_token: string | null
          twilio_twiml_app_sid: string | null
          updated_at: string | null
          user_id: string
          verified_at: string | null
          whatsapp_access_token: string | null
          whatsapp_business_id: string | null
          whatsapp_phone_number_id: string | null
        }
        Insert: {
          created_at?: string | null
          default_provider?:
            | Database["public"]["Enums"]["voip_call_provider"]
            | null
          display_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          recording_enabled?: boolean | null
          recording_storage_path?: string | null
          sip_domain?: string | null
          sip_password?: string | null
          sip_server_hostname?: string | null
          sip_username?: string | null
          twilio_account_sid?: string | null
          twilio_api_key_secret?: string | null
          twilio_api_key_sid?: string | null
          twilio_auth_token?: string | null
          twilio_twiml_app_sid?: string | null
          updated_at?: string | null
          user_id: string
          verified_at?: string | null
          whatsapp_access_token?: string | null
          whatsapp_business_id?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Update: {
          created_at?: string | null
          default_provider?:
            | Database["public"]["Enums"]["voip_call_provider"]
            | null
          display_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          recording_enabled?: boolean | null
          recording_storage_path?: string | null
          sip_domain?: string | null
          sip_password?: string | null
          sip_server_hostname?: string | null
          sip_username?: string | null
          twilio_account_sid?: string | null
          twilio_api_key_secret?: string | null
          twilio_api_key_sid?: string | null
          twilio_auth_token?: string | null
          twilio_twiml_app_sid?: string | null
          updated_at?: string | null
          user_id?: string
          verified_at?: string | null
          whatsapp_access_token?: string | null
          whatsapp_business_id?: string | null
          whatsapp_phone_number_id?: string | null
        }
        Relationships: []
      }
      whatsapp_ai_config: {
        Row: {
          already_known_info: string | null
          analysis_cooldown_minutes: number | null
          auto_analyze: boolean | null
          auto_create_deals: boolean | null
          auto_reply_enabled: boolean | null
          auto_scheduling_enabled: boolean | null
          created_at: string | null
          custom_prompt_instructions: string | null
          id: string
          include_emojis: boolean | null
          is_enabled: boolean | null
          knowledge_base: string | null
          max_suggestions_per_conversation: number | null
          openai_api_key_encrypted: string | null
          suggestion_language: string | null
          suggestion_tone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          already_known_info?: string | null
          analysis_cooldown_minutes?: number | null
          auto_analyze?: boolean | null
          auto_create_deals?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_scheduling_enabled?: boolean | null
          created_at?: string | null
          custom_prompt_instructions?: string | null
          id?: string
          include_emojis?: boolean | null
          is_enabled?: boolean | null
          knowledge_base?: string | null
          max_suggestions_per_conversation?: number | null
          openai_api_key_encrypted?: string | null
          suggestion_language?: string | null
          suggestion_tone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          already_known_info?: string | null
          analysis_cooldown_minutes?: number | null
          auto_analyze?: boolean | null
          auto_create_deals?: boolean | null
          auto_reply_enabled?: boolean | null
          auto_scheduling_enabled?: boolean | null
          created_at?: string | null
          custom_prompt_instructions?: string | null
          id?: string
          include_emojis?: boolean | null
          is_enabled?: boolean | null
          knowledge_base?: string | null
          max_suggestions_per_conversation?: number | null
          openai_api_key_encrypted?: string | null
          suggestion_language?: string | null
          suggestion_tone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_ai_suggestions: {
        Row: {
          analysis_id: string | null
          confidence: number | null
          content: string
          conversation_id: string
          created_at: string | null
          display_order: number | null
          expires_at: string | null
          id: string
          reasoning: string | null
          related_procedure_id: string | null
          suggestion_type: Database["public"]["Enums"]["whatsapp_suggestion_type"]
          used_at: string | null
          user_id: string
          was_modified: boolean | null
          was_used: boolean | null
        }
        Insert: {
          analysis_id?: string | null
          confidence?: number | null
          content: string
          conversation_id: string
          created_at?: string | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          reasoning?: string | null
          related_procedure_id?: string | null
          suggestion_type: Database["public"]["Enums"]["whatsapp_suggestion_type"]
          used_at?: string | null
          user_id: string
          was_modified?: boolean | null
          was_used?: boolean | null
        }
        Update: {
          analysis_id?: string | null
          confidence?: number | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          display_order?: number | null
          expires_at?: string | null
          id?: string
          reasoning?: string | null
          related_procedure_id?: string | null
          suggestion_type?: Database["public"]["Enums"]["whatsapp_suggestion_type"]
          used_at?: string | null
          user_id?: string
          was_modified?: boolean | null
          was_used?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_ai_suggestions_analysis_id_fkey"
            columns: ["analysis_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversation_analysis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_ai_suggestions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_assignment_config: {
        Row: {
          assignment_mode: Database["public"]["Enums"]["whatsapp_assignment_mode"]
          auto_assign_new_conversations: boolean | null
          created_at: string | null
          id: string
          is_active: boolean | null
          max_open_per_secretary: number | null
          notify_on_assignment: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assignment_mode?: Database["public"]["Enums"]["whatsapp_assignment_mode"]
          auto_assign_new_conversations?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_open_per_secretary?: number | null
          notify_on_assignment?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assignment_mode?: Database["public"]["Enums"]["whatsapp_assignment_mode"]
          auto_assign_new_conversations?: boolean | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          max_open_per_secretary?: number | null
          notify_on_assignment?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_assignment_history: {
        Row: {
          assigned_by: string | null
          assigned_from: string | null
          assigned_to: string
          assignment_type: string
          conversation_id: string
          created_at: string | null
          id: string
          notes: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_from?: string | null
          assigned_to: string
          assignment_type: string
          conversation_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_from?: string | null
          assigned_to?: string
          assignment_type?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_assignment_history_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_assignment_pool: {
        Row: {
          avg_response_time_seconds: number | null
          config_id: string
          created_at: string | null
          id: string
          is_active: boolean | null
          is_available: boolean | null
          last_assigned_at: string | null
          secretary_id: string
          total_assigned: number | null
          total_resolved: number | null
          weight: number | null
        }
        Insert: {
          avg_response_time_seconds?: number | null
          config_id: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          last_assigned_at?: string | null
          secretary_id: string
          total_assigned?: number | null
          total_resolved?: number | null
          weight?: number | null
        }
        Update: {
          avg_response_time_seconds?: number | null
          config_id?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          last_assigned_at?: string | null
          secretary_id?: string
          total_assigned?: number | null
          total_resolved?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_assignment_pool_config_id_fkey"
            columns: ["config_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_assignment_config"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_assignment_pool_secretary_id_fkey"
            columns: ["secretary_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_canned_responses: {
        Row: {
          content: string
          created_at: string | null
          id: string
          shortcut: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          shortcut?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          shortcut?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_config: {
        Row: {
          access_token: string | null
          business_account_id: string | null
          created_at: string | null
          display_phone_number: string | null
          id: string
          is_active: boolean | null
          last_synced_at: string | null
          phone_number_id: string | null
          updated_at: string | null
          user_id: string
          verified_name: string | null
          waba_id: string | null
          webhook_verify_token: string | null
        }
        Insert: {
          access_token?: string | null
          business_account_id?: string | null
          created_at?: string | null
          display_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          phone_number_id?: string | null
          updated_at?: string | null
          user_id: string
          verified_name?: string | null
          waba_id?: string | null
          webhook_verify_token?: string | null
        }
        Update: {
          access_token?: string | null
          business_account_id?: string | null
          created_at?: string | null
          display_phone_number?: string | null
          id?: string
          is_active?: boolean | null
          last_synced_at?: string | null
          phone_number_id?: string | null
          updated_at?: string | null
          user_id?: string
          verified_name?: string | null
          waba_id?: string | null
          webhook_verify_token?: string | null
        }
        Relationships: []
      }
      whatsapp_conversation_analysis: {
        Row: {
          ai_model_used: string | null
          analysis_version: number | null
          contact_created: boolean | null
          contact_id: string | null
          conversation_id: string
          conversion_probability: number | null
          created_at: string | null
          deal_created: boolean | null
          deal_id: string | null
          detected_intent: string | null
          detected_procedure: string | null
          detected_urgency:
            | Database["public"]["Enums"]["whatsapp_urgency_level"]
            | null
          id: string
          last_analyzed_at: string | null
          lead_status:
            | Database["public"]["Enums"]["whatsapp_lead_status"]
            | null
          message_count_analyzed: number | null
          sentiment: Database["public"]["Enums"]["whatsapp_sentiment"] | null
          suggested_next_action: string | null
          suggested_procedure_ids: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_model_used?: string | null
          analysis_version?: number | null
          contact_created?: boolean | null
          contact_id?: string | null
          conversation_id: string
          conversion_probability?: number | null
          created_at?: string | null
          deal_created?: boolean | null
          deal_id?: string | null
          detected_intent?: string | null
          detected_procedure?: string | null
          detected_urgency?:
            | Database["public"]["Enums"]["whatsapp_urgency_level"]
            | null
          id?: string
          last_analyzed_at?: string | null
          lead_status?:
            | Database["public"]["Enums"]["whatsapp_lead_status"]
            | null
          message_count_analyzed?: number | null
          sentiment?: Database["public"]["Enums"]["whatsapp_sentiment"] | null
          suggested_next_action?: string | null
          suggested_procedure_ids?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_model_used?: string | null
          analysis_version?: number | null
          contact_created?: boolean | null
          contact_id?: string | null
          conversation_id?: string
          conversion_probability?: number | null
          created_at?: string | null
          deal_created?: boolean | null
          deal_id?: string | null
          detected_intent?: string | null
          detected_procedure?: string | null
          detected_urgency?:
            | Database["public"]["Enums"]["whatsapp_urgency_level"]
            | null
          id?: string
          last_analyzed_at?: string | null
          lead_status?:
            | Database["public"]["Enums"]["whatsapp_lead_status"]
            | null
          message_count_analyzed?: number | null
          sentiment?: Database["public"]["Enums"]["whatsapp_sentiment"] | null
          suggested_next_action?: string | null
          suggested_procedure_ids?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_analysis_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_label_assignments: {
        Row: {
          conversation_id: string
          created_at: string | null
          id: string
          label_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string | null
          id?: string
          label_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string | null
          id?: string
          label_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversation_label_assignments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversation_label_assignments_label_id_fkey"
            columns: ["label_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversation_labels"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_conversation_labels: {
        Row: {
          color: string
          created_at: string | null
          description: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          ai_autonomous_mode: boolean | null
          ai_processing: boolean | null
          ai_processing_started_at: string | null
          assigned_to: string | null
          contact_id: string | null
          contact_name: string | null
          contact_profile_picture: string | null
          created_at: string | null
          id: string
          is_muted: boolean | null
          last_message_at: string | null
          last_message_direction: string | null
          last_message_preview: string | null
          metadata: Json | null
          organization_id: string | null
          phone_number: string
          phone_number_id: string | null
          priority: Database["public"]["Enums"]["whatsapp_priority"] | null
          status: Database["public"]["Enums"]["whatsapp_conversation_status"]
          unread_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_autonomous_mode?: boolean | null
          ai_processing?: boolean | null
          ai_processing_started_at?: string | null
          assigned_to?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_profile_picture?: string | null
          created_at?: string | null
          id?: string
          is_muted?: boolean | null
          last_message_at?: string | null
          last_message_direction?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number: string
          phone_number_id?: string | null
          priority?: Database["public"]["Enums"]["whatsapp_priority"] | null
          status?: Database["public"]["Enums"]["whatsapp_conversation_status"]
          unread_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_autonomous_mode?: boolean | null
          ai_processing?: boolean | null
          ai_processing_started_at?: string | null
          assigned_to?: string | null
          contact_id?: string | null
          contact_name?: string | null
          contact_profile_picture?: string | null
          created_at?: string | null
          id?: string
          is_muted?: boolean | null
          last_message_at?: string | null
          last_message_direction?: string | null
          last_message_preview?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number?: string
          phone_number_id?: string | null
          priority?: Database["public"]["Enums"]["whatsapp_priority"] | null
          status?: Database["public"]["Enums"]["whatsapp_conversation_status"]
          unread_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_assigned_to_profiles_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_conversations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_internal_notes: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          organization_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          organization_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_internal_notes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_internal_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_media: {
        Row: {
          created_at: string | null
          duration_seconds: number | null
          file_name: string | null
          file_size: number | null
          id: string
          media_mime_type: string | null
          media_type: string
          media_url: string
          message_id: string
          organization_id: string | null
          thumbnail_url: string | null
          whatsapp_media_id: string | null
        }
        Insert: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_mime_type?: string | null
          media_type: string
          media_url: string
          message_id: string
          organization_id?: string | null
          thumbnail_url?: string | null
          whatsapp_media_id?: string | null
        }
        Update: {
          created_at?: string | null
          duration_seconds?: number | null
          file_name?: string | null
          file_size?: number | null
          id?: string
          media_mime_type?: string | null
          media_type?: string
          media_url?: string
          message_id?: string
          organization_id?: string | null
          thumbnail_url?: string | null
          whatsapp_media_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_media_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_media_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          contact_id: string | null
          content: string
          context: Json | null
          conversation_id: string | null
          created_at: string | null
          delivered_at: string | null
          direction: string
          error_code: string | null
          error_message: string | null
          id: string
          lead_id: string | null
          message_id: string | null
          message_type: string | null
          metadata: Json | null
          organization_id: string | null
          phone_number: string
          phone_number_id: string | null
          read_at: string | null
          reply_to_message_id: string | null
          sent_at: string
          status: string
          template_id: string | null
          user_id: string
        }
        Insert: {
          contact_id?: string | null
          content: string
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number: string
          phone_number_id?: string | null
          read_at?: string | null
          reply_to_message_id?: string | null
          sent_at: string
          status?: string
          template_id?: string | null
          user_id: string
        }
        Update: {
          contact_id?: string | null
          content?: string
          context?: Json | null
          conversation_id?: string | null
          created_at?: string | null
          delivered_at?: string | null
          direction?: string
          error_code?: string | null
          error_message?: string | null
          id?: string
          lead_id?: string | null
          message_id?: string | null
          message_type?: string | null
          metadata?: Json | null
          organization_id?: string | null
          phone_number?: string
          phone_number_id?: string | null
          read_at?: string | null
          reply_to_message_id?: string | null
          sent_at?: string
          status?: string
          template_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "commercial_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_messages_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_templates: {
        Row: {
          category: Database["public"]["Enums"]["whatsapp_template_category"]
          components: Json
          created_at: string | null
          example_values: Json | null
          id: string
          language: string
          name: string
          organization_id: string | null
          status: Database["public"]["Enums"]["whatsapp_template_status"]
          template_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["whatsapp_template_category"]
          components?: Json
          created_at?: string | null
          example_values?: Json | null
          id?: string
          language?: string
          name: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["whatsapp_template_status"]
          template_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["whatsapp_template_category"]
          components?: Json
          created_at?: string | null
          example_values?: Json | null
          id?: string
          language?: string
          name?: string
          organization_id?: string | null
          status?: Database["public"]["Enums"]["whatsapp_template_status"]
          template_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
          type: Database["public"]["Enums"]["transaction_type"] | null
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
          type?: Database["public"]["Enums"]["transaction_type"] | null
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
          type?: Database["public"]["Enums"]["transaction_type"] | null
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
      assign_conversation_to_secretary: {
        Args: {
          p_assigned_by?: string
          p_assignment_type?: string
          p_conversation_id: string
          p_notes?: string
          p_secretary_id: string
        }
        Returns: boolean
      }
      can_schedule_for_others: { Args: { _user_id: string }; Returns: boolean }
      check_and_increment_cortana_usage: {
        Args: { limit_count: number }
        Returns: Json
      }
      check_conversation_access: {
        Args: { target_conversation_id: string }
        Returns: boolean
      }
      check_whatsapp_access: {
        Args: { target_user_id: string }
        Returns: boolean
      }
      cleanup_expired_ai_insights: { Args: never; Returns: undefined }
      get_ai_stats: {
        Args: { p_user_id: string }
        Returns: {
          avg_conversion_probability: number
          cold_leads: number
          converted: number
          hot_leads: number
          lost: number
          suggestions_total: number
          suggestions_used: number
          total_analyzed: number
          warm_leads: number
        }[]
      }
      get_bottleneck_metrics: {
        Args: {
          p_current_month_end: string
          p_current_month_start: string
          p_last_30_days: string
          p_last_60_days: string
          p_last_7_days: string
          p_prev_month_end: string
          p_prev_month_start: string
          p_user_ids: string[]
        }
        Returns: Json
      }
      get_commercial_metrics: {
        Args: { p_end_date: string; p_start_date: string; p_user_id: string }
        Returns: Json
      }
      get_commercial_metrics_v2: {
        Args: { p_end_date: string; p_start_date: string; p_user_ids: string[] }
        Returns: Json
      }
      get_dashboard_metrics: {
        Args: { p_user_id: string; p_year_month?: string }
        Returns: Json
      }
      get_hot_leads: {
        Args: { p_limit?: number; p_user_id: string }
        Returns: {
          contact_name: string
          conversation_id: string
          conversion_probability: number
          detected_intent: string
          detected_procedure: string
          last_analyzed_at: string
          last_message_at: string
          lead_status: Database["public"]["Enums"]["whatsapp_lead_status"]
          phone_number: string
        }[]
      }
      get_next_secretary_round_robin: {
        Args: { p_config_id: string }
        Returns: string
      }
      get_or_create_conversation: {
        Args: {
          p_contact_name?: string
          p_phone_number: string
          p_user_id: string
        }
        Returns: string
      }
      get_or_create_whatsapp_lead: {
        Args: {
          p_organization_id: string
          p_phone_number: string
          p_profile_name: string
          p_user_id: string
        }
        Returns: Json
      }
      get_overdue_appointments: { Args: { p_user_id: string }; Returns: Json }
      get_pending_followups: {
        Args: { p_hours?: number; p_user_id: string }
        Returns: {
          contact_name: string
          conversation_id: string
          hours_since_last_message: number
          last_message_preview: string
          lead_status: Database["public"]["Enums"]["whatsapp_lead_status"]
          phone_number: string
        }[]
      }
      get_secretaria_doctor_id: {
        Args: { _secretaria_id: string }
        Returns: string
      }
      get_secretary_metrics: {
        Args: {
          p_doctor_id_filter: string
          p_month_end: string
          p_month_start: string
          p_today_end: string
          p_today_start: string
          p_user_id: string
          p_week_end: string
          p_week_start: string
        }
        Returns: Json
      }
      get_secretary_productivity_data: {
        Args: {
          p_month_start: string
          p_user_ids: string[]
          p_week_start: string
        }
        Returns: Json
      }
      get_team_metrics: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_user_ids: string[]
        }
        Returns: Json
      }
      get_user_hierarchy: {
        Args: { user_id: string }
        Returns: {
          profile_id: string
        }[]
      }
      get_user_org_ids: { Args: never; Returns: string[] }
      get_user_organization_id: { Args: never; Returns: string }
      get_user_role: { Args: { target_user_id: string }; Returns: string }
      get_user_team_metrics: { Args: { p_user_id: string }; Returns: Json }
      get_whatsapp_inbox_stats: {
        Args: { p_user_id: string }
        Returns: {
          assigned_to_me: number
          open_count: number
          pending_count: number
          resolved_count: number
          total_conversations: number
          unread_messages: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      is_admin_dono_or_medico: { Args: { _user_id: string }; Returns: boolean }
      is_admin_in_same_org: {
        Args: { target_org_id: string }
        Returns: boolean
      }
      is_admin_or_dono: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_dono_v2: { Args: { user_id: string }; Returns: boolean }
      is_admin_or_owner: { Args: { _user_id: string }; Returns: boolean }
      is_doctor: { Args: { _user_id: string }; Returns: boolean }
      is_org_admin: { Args: never; Returns: boolean }
      is_secretaria: { Args: { _user_id: string }; Returns: boolean }
      is_secretaria_linked_to_doctor: {
        Args: { _secretaria_id: string }
        Returns: boolean
      }
      is_secretary: { Args: { _user_id: string }; Returns: boolean }
      mark_conversation_as_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      reset_and_seed_imperius: { Args: never; Returns: undefined }
    }
    Enums: {
      account_type: "conta_corrente" | "poupanca" | "caixa" | "investimento"
      ad_platform: "google_ads" | "meta_ads"
      app_role:
        | "admin"
        | "dono"
        | "vendedor"
        | "gestor_trafego"
        | "secretaria"
        | "medico"
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
      budget_status: "active" | "exceeded" | "completed" | "cancelled"
      category_type: "entrada" | "saida"
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
      cost_type: "ferramentas" | "operacional" | "terceirizacao"
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
        | "agendado"
        | "em_tratamento"
        | "inadimplente"
        | "follow_up"
        | "aguardando_retorno"
        | "em_contato"
        | "avaliacao"
        | "finalizado"
      medical_record_status: "draft" | "completed" | "reviewed" | "archived"
      medical_record_type:
        | "consultation"
        | "procedure"
        | "exam_result"
        | "prescription"
        | "certificate"
        | "referral"
        | "evolution"
      meeting_status: "scheduled" | "completed" | "cancelled"
      meeting_type: "meeting" | "appointment" | "block" | "other"
      payment_method:
        | "dinheiro"
        | "pix"
        | "cartao_credito"
        | "cartao_debito"
        | "boleto"
        | "transferencia"
        | "cheque"
      payment_status: "pending" | "paid" | "partial" | "cancelled"
      recurrence_frequency:
        | "diaria"
        | "semanal"
        | "quinzenal"
        | "mensal"
        | "bimestral"
        | "trimestral"
        | "semestral"
        | "anual"
      sales_call_status: "scheduled" | "completed" | "cancelled" | "no_show"
      session_result:
        | "atendimento_encerrado"
        | "contato_decisor"
        | "sem_resposta"
        | "rejeitado"
      sync_status: "success" | "error" | "pending"
      task_category:
        | "comercial"
        | "marketing"
        | "financeiro"
        | "social_media"
        | "empresarial"
      task_priority: "baixa" | "media" | "alta" | "urgente"
      task_status: "pendente" | "em_andamento" | "concluida" | "cancelada"
      transaction_status: "pendente" | "concluida" | "cancelada"
      transaction_type: "entrada" | "saida"
      user_role:
        | "admin"
        | "dono"
        | "vendedor"
        | "gestor_trafego"
        | "medico"
        | "secretaria"
      voip_call_direction: "inbound" | "outbound"
      voip_call_provider: "twilio" | "whatsapp" | "sip"
      voip_call_status:
        | "initiating"
        | "ringing"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "failed"
        | "busy"
        | "no_answer"
        | "cancelled"
      whatsapp_assignment_mode: "manual" | "round_robin" | "weighted"
      whatsapp_conversation_status: "open" | "pending" | "resolved" | "spam"
      whatsapp_lead_status:
        | "novo"
        | "frio"
        | "morno"
        | "quente"
        | "convertido"
        | "perdido"
      whatsapp_message_type:
        | "text"
        | "image"
        | "audio"
        | "video"
        | "document"
        | "sticker"
        | "location"
        | "contact"
        | "template"
        | "interactive"
        | "reaction"
      whatsapp_priority: "low" | "normal" | "high" | "urgent"
      whatsapp_sentiment: "positivo" | "neutro" | "negativo"
      whatsapp_suggestion_type:
        | "quick_reply"
        | "full_message"
        | "procedure_info"
        | "scheduling"
        | "follow_up"
      whatsapp_template_category: "MARKETING" | "UTILITY" | "AUTHENTICATION"
      whatsapp_template_status: "pending" | "approved" | "rejected"
      whatsapp_urgency_level: "baixa" | "media" | "alta" | "urgente"
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
      account_type: ["conta_corrente", "poupanca", "caixa", "investimento"],
      ad_platform: ["google_ads", "meta_ads"],
      app_role: [
        "admin",
        "dono",
        "vendedor",
        "gestor_trafego",
        "secretaria",
        "medico",
      ],
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
      budget_status: ["active", "exceeded", "completed", "cancelled"],
      category_type: ["entrada", "saida"],
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
      cost_type: ["ferramentas", "operacional", "terceirizacao"],
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
        "agendado",
        "em_tratamento",
        "inadimplente",
        "follow_up",
        "aguardando_retorno",
        "em_contato",
        "avaliacao",
        "finalizado",
      ],
      medical_record_status: ["draft", "completed", "reviewed", "archived"],
      medical_record_type: [
        "consultation",
        "procedure",
        "exam_result",
        "prescription",
        "certificate",
        "referral",
        "evolution",
      ],
      meeting_status: ["scheduled", "completed", "cancelled"],
      meeting_type: ["meeting", "appointment", "block", "other"],
      payment_method: [
        "dinheiro",
        "pix",
        "cartao_credito",
        "cartao_debito",
        "boleto",
        "transferencia",
        "cheque",
      ],
      payment_status: ["pending", "paid", "partial", "cancelled"],
      recurrence_frequency: [
        "diaria",
        "semanal",
        "quinzenal",
        "mensal",
        "bimestral",
        "trimestral",
        "semestral",
        "anual",
      ],
      sales_call_status: ["scheduled", "completed", "cancelled", "no_show"],
      session_result: [
        "atendimento_encerrado",
        "contato_decisor",
        "sem_resposta",
        "rejeitado",
      ],
      sync_status: ["success", "error", "pending"],
      task_category: [
        "comercial",
        "marketing",
        "financeiro",
        "social_media",
        "empresarial",
      ],
      task_priority: ["baixa", "media", "alta", "urgente"],
      task_status: ["pendente", "em_andamento", "concluida", "cancelada"],
      transaction_status: ["pendente", "concluida", "cancelada"],
      transaction_type: ["entrada", "saida"],
      user_role: [
        "admin",
        "dono",
        "vendedor",
        "gestor_trafego",
        "medico",
        "secretaria",
      ],
      voip_call_direction: ["inbound", "outbound"],
      voip_call_provider: ["twilio", "whatsapp", "sip"],
      voip_call_status: [
        "initiating",
        "ringing",
        "in_progress",
        "on_hold",
        "completed",
        "failed",
        "busy",
        "no_answer",
        "cancelled",
      ],
      whatsapp_assignment_mode: ["manual", "round_robin", "weighted"],
      whatsapp_conversation_status: ["open", "pending", "resolved", "spam"],
      whatsapp_lead_status: [
        "novo",
        "frio",
        "morno",
        "quente",
        "convertido",
        "perdido",
      ],
      whatsapp_message_type: [
        "text",
        "image",
        "audio",
        "video",
        "document",
        "sticker",
        "location",
        "contact",
        "template",
        "interactive",
        "reaction",
      ],
      whatsapp_priority: ["low", "normal", "high", "urgent"],
      whatsapp_sentiment: ["positivo", "neutro", "negativo"],
      whatsapp_suggestion_type: [
        "quick_reply",
        "full_message",
        "procedure_info",
        "scheduling",
        "follow_up",
      ],
      whatsapp_template_category: ["MARKETING", "UTILITY", "AUTHENTICATION"],
      whatsapp_template_status: ["pending", "approved", "rejected"],
      whatsapp_urgency_level: ["baixa", "media", "alta", "urgente"],
    },
  },
} as const
