export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      crm_contacts: {
        Row: {
          id: string
          user_id: string
          full_name: string
          email: string | null
          phone: string | null
          company: string | null
          position: string | null
          tags: string[] | null
          notes: string | null
          created_at: string
          updated_at: string
          service: string | null
          service_value: number | null
          custom_fields: Json | null
          health_insurance_type: string | null
          health_insurance_number: string | null
          birth_date: string | null
          gender: string | null
          address: string | null
          city: string | null
          state: string | null
          zip_code: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
        }
        Insert: {
          id?: string
          user_id: string
          full_name: string
          email?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          service?: string | null
          service_value?: number | null
          custom_fields?: Json | null
          health_insurance_type?: string | null
          health_insurance_number?: string | null
          birth_date?: string | null
          gender?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          full_name?: string
          email?: string | null
          phone?: string | null
          company?: string | null
          position?: string | null
          tags?: string[] | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          service?: string | null
          service_value?: number | null
          custom_fields?: Json | null
          health_insurance_type?: string | null
          health_insurance_number?: string | null
          birth_date?: string | null
          gender?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          zip_code?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
        }
      }
      crm_deals: {
        Row: {
          id: string
          user_id: string
          contact_id: string
          title: string
          value: number | null
          stage: Database['public']['Enums']['crm_pipeline_stage']
          probability: number | null
          expected_close_date: string | null
          assigned_to: string | null
          notes: string | null
          custom_fields: Json | null
          created_at: string
          updated_at: string
          is_in_treatment: boolean | null
          is_defaulting: boolean | null
        }
        Insert: {
          id?: string
          user_id: string
          contact_id: string
          title: string
          value?: number | null
          stage?: Database['public']['Enums']['crm_pipeline_stage']
          probability?: number | null
          expected_close_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
          is_in_treatment?: boolean | null
          is_defaulting?: boolean | null
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string
          title?: string
          value?: number | null
          stage?: Database['public']['Enums']['crm_pipeline_stage']
          probability?: number | null
          expected_close_date?: string | null
          assigned_to?: string | null
          notes?: string | null
          custom_fields?: Json | null
          created_at?: string
          updated_at?: string
          is_in_treatment?: boolean | null
          is_defaulting?: boolean | null
        }
      }
      crm_activities: {
        Row: {
          id: string
          user_id: string
          contact_id: string | null
          deal_id: string | null
          type: Database['public']['Enums']['crm_activity_type']
          subject: string
          description: string | null
          due_date: string | null
          completed: boolean
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_id?: string | null
          deal_id?: string | null
          type: Database['public']['Enums']['crm_activity_type']
          subject: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_id?: string | null
          deal_id?: string | null
          type?: Database['public']['Enums']['crm_activity_type']
          subject?: string
          description?: string | null
          due_date?: string | null
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          user_id: string
          name: string
          unit: string
          category: string
          min_stock: number
          sell_price: number | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          unit?: string
          category?: string
          min_stock?: number
          sell_price?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          unit?: string
          category?: string
          min_stock?: number
          sell_price?: number | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      inventory_batches: {
        Row: {
          id: string
          item_id: string
          batch_number: string
          expiration_date: string | null
          quantity: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          batch_number: string
          expiration_date?: string | null
          quantity?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          batch_number?: string
          expiration_date?: string | null
          quantity?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory_movements: {
        Row: {
          id: string
          batch_id: string
          type: 'IN' | 'OUT' | 'ADJUST' | 'LOSS'
          quantity: number
          previous_balance: number | null
          new_balance: number | null
          reference_id: string | null
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          batch_id: string
          type: 'IN' | 'OUT' | 'ADJUST' | 'LOSS'
          quantity: number
          previous_balance?: number | null
          new_balance?: number | null
          reference_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          batch_id?: string
          type?: 'IN' | 'OUT' | 'ADJUST' | 'LOSS'
          quantity?: number
          previous_balance?: number | null
          new_balance?: number | null
          reference_id?: string | null
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
    Enums: {
      crm_pipeline_stage: 'lead_novo' | 'qualificado' | 'apresentacao' | 'proposta' | 'negociacao' | 'fechado_ganho' | 'fechado_perdido' | 'agendado' | 'em_tratamento' | 'inadimplente' | 'follow_up' | 'aguardando_retorno'
      crm_activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'whatsapp'
    }
  }
}
