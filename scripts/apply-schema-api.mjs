/**
 * Aplica schema no Supabase destino via Management API
 */

const PROJECT_REF = 'puylqvsnooquefkingki';
const ACCESS_TOKEN = 'sbp_1769812f5c9bb9e2766386f188bcd42759ab85ae';

async function runSQL(sql) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API Error ${response.status}: ${text}`);
  }

  return await response.json();
}

// Schema básico para criar as tabelas principais
const SCHEMA_SQL = `
-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Criar tipos ENUM
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('admin', 'dono', 'medico', 'secretaria', 'vendedor');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.crm_pipeline_stage AS ENUM (
    'lead_novo', 'qualificado', 'agendado', 'apresentacao', 'proposta',
    'negociacao', 'fechado_ganho', 'fechado_perdido', 'em_tratamento',
    'inadimplente', 'aguardando_retorno'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.appointment_status AS ENUM ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'partial', 'paid');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.transaction_type AS ENUM ('income', 'expense');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Tabela organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  logo_url TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  owner_id UUID,
  member_limit INTEGER DEFAULT 1,
  additional_member_price NUMERIC(10,2) DEFAULT 89.90,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  role public.user_role DEFAULT 'vendedor',
  is_active BOOLEAN DEFAULT true,
  doctor_id UUID,
  consultation_value NUMERIC(10,2),
  invited_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- Tabela crm_contacts
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  health_insurance_type TEXT,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela crm_deals
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  user_id UUID,
  title TEXT,
  value NUMERIC(10,2) DEFAULT 0,
  stage public.crm_pipeline_stage DEFAULT 'lead_novo',
  is_in_treatment BOOLEAN DEFAULT false,
  is_defaulting BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela secretary_doctor_links
CREATE TABLE IF NOT EXISTS public.secretary_doctor_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secretary_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(secretary_id, doctor_id)
);

-- Tabela medical_appointments
CREATE TABLE IF NOT EXISTS public.medical_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  user_id UUID,
  doctor_id UUID,
  title TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  status public.appointment_status DEFAULT 'scheduled',
  payment_status public.payment_status DEFAULT 'pending',
  sinal_amount NUMERIC(10,2) DEFAULT 0,
  sinal_paid BOOLEAN DEFAULT false,
  estimated_value NUMERIC(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela medical_records
CREATE TABLE IF NOT EXISTS public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  doctor_id UUID,
  user_id UUID,
  diagnosis TEXT,
  treatment_plan TEXT,
  notes TEXT,
  is_in_treatment BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela financial_accounts
CREATE TABLE IF NOT EXISTS public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  bank_name TEXT,
  account_type TEXT,
  initial_balance NUMERIC(12,2) DEFAULT 0,
  current_balance NUMERIC(12,2) DEFAULT 0,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela financial_categories
CREATE TABLE IF NOT EXISTS public.financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela financial_transactions
CREATE TABLE IF NOT EXISTS public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  type public.transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  transaction_date DATE NOT NULL,
  is_recurring BOOLEAN DEFAULT false,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.medical_appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela inventory_suppliers
CREATE TABLE IF NOT EXISTS public.inventory_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela inventory_items
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  sku TEXT,
  description TEXT,
  category TEXT,
  unit TEXT DEFAULT 'un',
  minimum_stock INTEGER DEFAULT 0,
  current_stock INTEGER DEFAULT 0,
  cost_price NUMERIC(10,2) DEFAULT 0,
  sale_price NUMERIC(10,2) DEFAULT 0,
  supplier_id UUID REFERENCES public.inventory_suppliers(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela inventory_batches
CREATE TABLE IF NOT EXISTS public.inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  batch_number TEXT,
  quantity INTEGER NOT NULL,
  expiry_date DATE,
  purchase_date DATE,
  cost_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela inventory_movements
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reason TEXT,
  user_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela commercial_leads
CREATE TABLE IF NOT EXISTS public.commercial_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela commercial_procedures
CREATE TABLE IF NOT EXISTS public.commercial_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'procedure',
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela commercial_campaigns
CREATE TABLE IF NOT EXISTS public.commercial_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  budget NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela tasks
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  assigned_to UUID,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela task_attachments
CREATE TABLE IF NOT EXISTS public.task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_config
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  phone_number_id TEXT,
  business_account_id TEXT,
  access_token TEXT,
  webhook_verify_token TEXT,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_conversations
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  last_message_at TIMESTAMPTZ,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  content TEXT,
  direction TEXT NOT NULL,
  message_type TEXT DEFAULT 'text',
  status TEXT DEFAULT 'sent',
  wa_message_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_media
CREATE TABLE IF NOT EXISTS public.whatsapp_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  media_type TEXT,
  url TEXT,
  mime_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_templates
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_internal_notes
CREATE TABLE IF NOT EXISTS public.whatsapp_internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_conversation_analysis
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  lead_status TEXT,
  sentiment TEXT,
  urgency_level TEXT,
  summary TEXT,
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_ai_suggestions
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  suggestion_type TEXT,
  content TEXT NOT NULL,
  confidence NUMERIC(3,2),
  is_used BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela whatsapp_ai_config
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  auto_analyze BOOLEAN DEFAULT false,
  model TEXT DEFAULT 'gpt-3.5-turbo',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela specialty_procedures
CREATE TABLE IF NOT EXISTS public.specialty_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'procedure',
  description TEXT,
  default_price NUMERIC(10,2) DEFAULT 0,
  default_duration_minutes INTEGER DEFAULT 30,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela onboarding_state
CREATE TABLE IF NOT EXISTS public.onboarding_state (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  current_step INTEGER DEFAULT 1,
  clinic_data JSONB,
  doctor_data JSONB,
  procedures_data JSONB,
  team_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela allowed_emails
CREATE TABLE IF NOT EXISTS public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  is_allowed BOOLEAN DEFAULT true,
  payment_confirmed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela crm_activities
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  user_id UUID,
  type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

SELECT 'Schema criado com sucesso!' as result;
`;

async function main() {
  console.log('🚀 Aplicando schema no Supabase destino via Management API...\n');
  console.log(`📍 Projeto: ${PROJECT_REF}`);

  try {
    console.log('\n⏳ Executando SQL...');
    const result = await runSQL(SCHEMA_SQL);
    console.log('✅ Schema aplicado com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

main();
