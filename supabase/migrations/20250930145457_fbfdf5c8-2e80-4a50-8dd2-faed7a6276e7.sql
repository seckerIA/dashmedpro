-- Create CRM Pipeline Stages enum
CREATE TYPE crm_pipeline_stage AS ENUM (
  'lead_novo',
  'qualificado',
  'apresentacao',
  'proposta',
  'negociacao',
  'fechado_ganho',
  'fechado_perdido'
);

-- Create CRM Activity Type enum
CREATE TYPE crm_activity_type AS ENUM (
  'call',
  'email',
  'whatsapp',
  'meeting',
  'note',
  'task',
  'ai_interaction'
);

-- Create CRM Contacts table
CREATE TABLE public.crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  position TEXT,
  lead_score INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_contact_at TIMESTAMPTZ
);

-- Create CRM Deals table
CREATE TABLE public.crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  assigned_to UUID,
  title TEXT NOT NULL,
  description TEXT,
  value DECIMAL(10, 2),
  stage crm_pipeline_stage NOT NULL DEFAULT 'lead_novo',
  probability INTEGER DEFAULT 0,
  expected_close_date TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  position INTEGER,
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create CRM Activities table
CREATE TABLE public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  activity_type crm_activity_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_contacts
CREATE POLICY "Users can view their own contacts"
  ON public.crm_contacts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own contacts"
  ON public.crm_contacts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own contacts"
  ON public.crm_contacts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own contacts"
  ON public.crm_contacts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for crm_deals
CREATE POLICY "Users can view their own deals"
  ON public.crm_deals FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert their own deals"
  ON public.crm_deals FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own deals or assigned deals"
  ON public.crm_deals FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their own deals"
  ON public.crm_deals FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for crm_activities
CREATE POLICY "Users can view their own activities"
  ON public.crm_activities FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities"
  ON public.crm_activities FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own activities"
  ON public.crm_activities FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own activities"
  ON public.crm_activities FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_crm_contacts_user_id ON public.crm_contacts(user_id);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX idx_crm_contacts_phone ON public.crm_contacts(phone);
CREATE INDEX idx_crm_deals_user_id ON public.crm_deals(user_id);
CREATE INDEX idx_crm_deals_contact_id ON public.crm_deals(contact_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX idx_crm_activities_user_id ON public.crm_activities(user_id);
CREATE INDEX idx_crm_activities_contact_id ON public.crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal_id ON public.crm_activities(deal_id);

-- Trigger to update updated_at
CREATE TRIGGER update_crm_contacts_updated_at
  BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_deals_updated_at
  BEFORE UPDATE ON public.crm_deals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();