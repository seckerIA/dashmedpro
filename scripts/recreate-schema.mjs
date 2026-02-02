/**
 * Recria schema no destino baseado na estrutura real do fonte
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

const FULL_SCHEMA = `
-- =============================================
-- DROP ALL EXISTING TABLES (cascade)
-- =============================================
DROP TABLE IF EXISTS public.whatsapp_ai_suggestions CASCADE;
DROP TABLE IF EXISTS public.whatsapp_conversation_analysis CASCADE;
DROP TABLE IF EXISTS public.whatsapp_ai_config CASCADE;
DROP TABLE IF EXISTS public.whatsapp_internal_notes CASCADE;
DROP TABLE IF EXISTS public.whatsapp_media CASCADE;
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;
DROP TABLE IF EXISTS public.whatsapp_templates CASCADE;
DROP TABLE IF EXISTS public.whatsapp_conversations CASCADE;
DROP TABLE IF EXISTS public.whatsapp_config CASCADE;
DROP TABLE IF EXISTS public.task_attachments CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.commercial_campaigns CASCADE;
DROP TABLE IF EXISTS public.commercial_procedures CASCADE;
DROP TABLE IF EXISTS public.commercial_leads CASCADE;
DROP TABLE IF EXISTS public.inventory_movements CASCADE;
DROP TABLE IF EXISTS public.inventory_batches CASCADE;
DROP TABLE IF EXISTS public.inventory_items CASCADE;
DROP TABLE IF EXISTS public.inventory_suppliers CASCADE;
DROP TABLE IF EXISTS public.financial_transactions CASCADE;
DROP TABLE IF EXISTS public.financial_categories CASCADE;
DROP TABLE IF EXISTS public.financial_accounts CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.medical_appointments CASCADE;
DROP TABLE IF EXISTS public.crm_activities CASCADE;
DROP TABLE IF EXISTS public.crm_deals CASCADE;
DROP TABLE IF EXISTS public.secretary_doctor_links CASCADE;
DROP TABLE IF EXISTS public.organization_members CASCADE;
DROP TABLE IF EXISTS public.crm_contacts CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;
DROP TABLE IF EXISTS public.specialty_procedures CASCADE;
DROP TABLE IF EXISTS public.onboarding_state CASCADE;
DROP TABLE IF EXISTS public.allowed_emails CASCADE;

-- =============================================
-- CREATE EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- CREATE ENUM TYPES
-- =============================================
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

-- =============================================
-- CREATE TABLES (matching source schema)
-- =============================================

-- organizations
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  slug TEXT UNIQUE,
  plan TEXT,
  status TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone TEXT,
  city TEXT,
  member_limit INTEGER DEFAULT 1,
  additional_member_price NUMERIC(10,2) DEFAULT 89.90,
  owner_id UUID
);

-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  role public.user_role DEFAULT 'vendedor',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID,
  is_active BOOLEAN DEFAULT true,
  doctor_id UUID,
  consultation_value NUMERIC(10,2),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  is_super_admin BOOLEAN DEFAULT false,
  enable_agenda_alerts BOOLEAN DEFAULT true,
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_completed_at TIMESTAMPTZ,
  specialty TEXT
);

-- organization_members
CREATE TABLE public.organization_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- crm_contacts
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  lead_score INTEGER,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ,
  last_appointment_at TIMESTAMPTZ,
  reactivation_eligible BOOLEAN DEFAULT false,
  reactivation_last_sent_at TIMESTAMPTZ,
  birth_date DATE,
  blood_type TEXT,
  allergies TEXT,
  chronic_conditions TEXT,
  current_medications TEXT,
  emergency_contact TEXT,
  service_value NUMERIC(10,2),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- secretary_doctor_links
CREATE TABLE public.secretary_doctor_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  secretary_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  UNIQUE(secretary_id, doctor_id)
);

-- crm_deals
CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  assigned_to UUID,
  title TEXT,
  description TEXT,
  value NUMERIC(10,2) DEFAULT 0,
  stage public.crm_pipeline_stage DEFAULT 'lead_novo',
  probability INTEGER,
  expected_close_date DATE,
  closed_at TIMESTAMPTZ,
  position INTEGER,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_in_treatment BOOLEAN DEFAULT false,
  is_defaulting BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- crm_activities
CREATE TABLE public.crm_activities (
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

-- medical_appointments
CREATE TABLE public.medical_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  title TEXT,
  appointment_type TEXT,
  status public.appointment_status DEFAULT 'scheduled',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  notes TEXT,
  internal_notes TEXT,
  estimated_value NUMERIC(10,2),
  payment_status public.payment_status DEFAULT 'pending',
  financial_transaction_id UUID,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_in_advance BOOLEAN DEFAULT false,
  doctor_id UUID,
  sinal_amount NUMERIC(10,2) DEFAULT 0,
  sinal_paid BOOLEAN DEFAULT false,
  sinal_receipt_url TEXT,
  sinal_paid_at TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- medical_records
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  doctor_id UUID,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.medical_appointments(id) ON DELETE SET NULL,
  record_type TEXT,
  status TEXT,
  chief_complaint TEXT,
  history_present_illness TEXT,
  past_medical_history TEXT,
  family_history TEXT,
  medications TEXT,
  allergies TEXT,
  vital_signs JSONB,
  physical_examination TEXT,
  assessment TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  prescriptions JSONB,
  exams_requested JSONB,
  follow_up_date DATE,
  follow_up_notes TEXT,
  clinical_notes TEXT,
  patient_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  cid_codes TEXT[],
  secondary_diagnoses TEXT,
  history_current_illness TEXT,
  social_history TEXT,
  allergies_noted TEXT,
  general_condition TEXT,
  physical_exam_notes TEXT,
  diagnostic_hypothesis TEXT,
  patient_instructions TEXT,
  next_appointment_date DATE,
  record_status TEXT,
  complications TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- financial_accounts
CREATE TABLE public.financial_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  type TEXT,
  bank_name TEXT,
  account_number TEXT,
  initial_balance NUMERIC(12,2) DEFAULT 0,
  current_balance NUMERIC(12,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  color TEXT DEFAULT '#3B82F6',
  is_default BOOLEAN DEFAULT false,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- financial_categories
CREATE TABLE public.financial_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type public.transaction_type NOT NULL,
  color TEXT DEFAULT '#6B7280',
  icon TEXT,
  parent_id UUID,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- financial_transactions
CREATE TABLE public.financial_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  account_id UUID REFERENCES public.financial_accounts(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.financial_categories(id) ON DELETE SET NULL,
  type public.transaction_type NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT,
  date DATE,
  transaction_date DATE,
  payment_method TEXT,
  deal_id UUID,
  tags TEXT[],
  notes TEXT,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'completed',
  is_recurring BOOLEAN DEFAULT false,
  recurrence_id UUID,
  has_costs BOOLEAN DEFAULT false,
  total_costs NUMERIC(12,2),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- inventory_suppliers
CREATE TABLE public.inventory_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  cnpj TEXT,
  email TEXT,
  phone TEXT,
  contact_person TEXT,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true
);

-- inventory_items
CREATE TABLE public.inventory_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  unit TEXT DEFAULT 'un',
  category TEXT,
  min_stock INTEGER DEFAULT 0,
  sell_price NUMERIC(10,2) DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  cost_price NUMERIC(10,2) DEFAULT 0,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- inventory_batches
CREATE TABLE public.inventory_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  batch_number TEXT,
  expiration_date DATE,
  quantity INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- inventory_movements
CREATE TABLE public.inventory_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_id UUID REFERENCES public.inventory_batches(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  previous_balance INTEGER,
  new_balance INTEGER,
  reference_id UUID,
  description TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- commercial_leads
CREATE TABLE public.commercial_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  origin TEXT,
  status TEXT DEFAULT 'new',
  estimated_value NUMERIC(10,2),
  converted_at TIMESTAMPTZ,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  procedure_id UUID,
  conversion_score INTEGER,
  score_updated_at TIMESTAMPTZ,
  first_response_time_minutes INTEGER,
  optimal_contact_hour INTEGER,
  urgency_keywords TEXT[],
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- commercial_procedures
CREATE TABLE public.commercial_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'procedure',
  description TEXT,
  price NUMERIC(10,2) DEFAULT 0,
  duration_minutes INTEGER DEFAULT 30,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sinal_percentage NUMERIC(5,2),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- commercial_campaigns
CREATE TABLE public.commercial_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  type TEXT,
  discount_percentage NUMERIC(5,2),
  discount_amount NUMERIC(10,2),
  start_date DATE,
  end_date DATE,
  target_audience TEXT,
  promo_code TEXT,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ad_campaign_sync_id TEXT,
  utm_template_id UUID
);

-- tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  created_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  category TEXT,
  due_date DATE,
  completed_at TIMESTAMPTZ,
  deal_id UUID,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  assigned_to UUID,
  image_url TEXT,
  position INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sale_id UUID,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- task_attachments
CREATE TABLE public.task_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_config
CREATE TABLE public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  phone_number_id TEXT,
  business_account_id TEXT,
  waba_id TEXT,
  display_phone_number TEXT,
  verified_name TEXT,
  webhook_verify_token TEXT,
  is_active BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  access_token TEXT
);

-- whatsapp_conversations
CREATE TABLE public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  contact_profile_picture TEXT,
  status TEXT DEFAULT 'open',
  assigned_to UUID,
  priority TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_direction TEXT,
  unread_count INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT false,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  phone_number_id TEXT,
  ai_processing BOOLEAN DEFAULT false,
  ai_processing_started_at TIMESTAMPTZ,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ai_autonomous_mode BOOLEAN DEFAULT false
);

-- whatsapp_messages
CREATE TABLE public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  contact_id UUID,
  lead_id UUID,
  message_id TEXT,
  direction TEXT NOT NULL,
  content TEXT,
  status TEXT DEFAULT 'sent',
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  phone_number TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  message_type TEXT DEFAULT 'text',
  reply_to_message_id TEXT,
  error_code TEXT,
  error_message TEXT,
  template_id TEXT,
  context JSONB,
  phone_number_id TEXT,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL
);

-- whatsapp_media
CREATE TABLE public.whatsapp_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  media_type TEXT,
  url TEXT,
  mime_type TEXT,
  file_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_templates
CREATE TABLE public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_internal_notes
CREATE TABLE public.whatsapp_internal_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_conversation_analysis
CREATE TABLE public.whatsapp_conversation_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  lead_status TEXT,
  conversion_probability NUMERIC(5,2),
  detected_intent TEXT,
  detected_procedure TEXT,
  detected_urgency TEXT,
  sentiment TEXT,
  suggested_next_action TEXT,
  suggested_procedure_ids UUID[],
  deal_created BOOLEAN DEFAULT false,
  deal_id UUID,
  contact_created BOOLEAN DEFAULT false,
  contact_id UUID,
  last_analyzed_at TIMESTAMPTZ,
  message_count_analyzed INTEGER,
  ai_model_used TEXT,
  analysis_version TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- whatsapp_ai_suggestions
CREATE TABLE public.whatsapp_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID,
  analysis_id UUID REFERENCES public.whatsapp_conversation_analysis(id) ON DELETE CASCADE,
  suggestion_type TEXT,
  content TEXT NOT NULL,
  confidence NUMERIC(3,2),
  reasoning TEXT,
  related_procedure_id UUID,
  display_order INTEGER,
  was_used BOOLEAN DEFAULT false,
  was_modified BOOLEAN DEFAULT false,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- whatsapp_ai_config
CREATE TABLE public.whatsapp_ai_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  is_enabled BOOLEAN DEFAULT false,
  auto_analyze BOOLEAN DEFAULT false,
  auto_create_deals BOOLEAN DEFAULT false,
  max_suggestions_per_conversation INTEGER DEFAULT 3,
  analysis_cooldown_minutes INTEGER DEFAULT 5,
  suggestion_language TEXT DEFAULT 'pt-BR',
  suggestion_tone TEXT DEFAULT 'professional',
  include_emojis BOOLEAN DEFAULT false,
  openai_api_key_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  knowledge_base TEXT,
  already_known_info TEXT,
  auto_reply_enabled BOOLEAN DEFAULT false,
  custom_prompt_instructions TEXT,
  auto_scheduling_enabled BOOLEAN DEFAULT false
);

-- specialty_procedures
CREATE TABLE public.specialty_procedures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  specialty TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'procedure',
  default_price NUMERIC(10,2) DEFAULT 0,
  default_duration_minutes INTEGER DEFAULT 30,
  description TEXT
);

-- onboarding_state
CREATE TABLE public.onboarding_state (
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

-- allowed_emails
CREATE TABLE public.allowed_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  plan TEXT,
  expires_at TIMESTAMPTZ,
  used_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  payment_confirmed BOOLEAN DEFAULT false
);

SELECT 'Schema completo recriado com sucesso!' as result;
`;

async function main() {
  console.log('🔄 Recriando schema completo no destino...\n');

  try {
    const result = await runSQL(FULL_SCHEMA);
    console.log('✅ Schema recriado com sucesso!');
    console.log('📊 Resultado:', JSON.stringify(result, null, 2));
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

main();
