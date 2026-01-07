import pg from 'pg';
import fs from 'fs';
const { Client } = pg;

const DB_PASSWORD = "Dashmedpro2026@";
const connectionString = `postgresql://postgres:${encodeURIComponent(DB_PASSWORD)}@db.adzaqkduxnpckbcuqpmg.supabase.co:5432/postgres`;

async function generateTypes() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Conectado ao banco!\n');

    // Buscar valores do enum crm_pipeline_stage
    const pipelineStages = await client.query(`
      SELECT enumlabel
      FROM pg_enum
      WHERE enumtypid = 'crm_pipeline_stage'::regtype
      ORDER BY enumsortorder
    `);

    const stages = pipelineStages.rows.map(r => `'${r.enumlabel}'`).join(' | ');

    console.log('Pipeline stages encontrados:');
    console.log(stages);
    console.log('');

    // Gerar conteúdo do arquivo types.ts
    const typesContent = `export type Json =
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
    }
    Enums: {
      crm_pipeline_stage: ${stages}
      crm_activity_type: 'call' | 'email' | 'meeting' | 'task' | 'note' | 'whatsapp'
    }
  }
}
`;

    // Escrever no arquivo
    fs.writeFileSync('src/integrations/supabase/types.ts', typesContent);
    console.log('✅ Arquivo types.ts gerado com sucesso!');
    console.log('Localização: src/integrations/supabase/types.ts');

  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

generateTypes();
