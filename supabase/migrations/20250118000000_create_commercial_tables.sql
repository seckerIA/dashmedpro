-- Create enums for commercial module
CREATE TYPE commercial_lead_status AS ENUM (
  'new',
  'contacted',
  'qualified',
  'converted',
  'lost'
);

CREATE TYPE commercial_lead_origin AS ENUM (
  'google',
  'instagram',
  'facebook',
  'indication',
  'website',
  'other'
);

CREATE TYPE commercial_procedure_category AS ENUM (
  'consultation',
  'procedure',
  'exam',
  'surgery',
  'other'
);

CREATE TYPE commercial_sale_status AS ENUM (
  'quote',
  'confirmed',
  'completed',
  'cancelled'
);

CREATE TYPE commercial_payment_method AS ENUM (
  'cash',
  'credit_card',
  'debit_card',
  'pix',
  'bank_transfer',
  'installment'
);

CREATE TYPE commercial_campaign_type AS ENUM (
  'first_consultation_discount',
  'procedure_package',
  'seasonal_promotion',
  'referral_benefit'
);

CREATE TYPE commercial_interaction_type AS ENUM (
  'call',
  'email',
  'whatsapp',
  'meeting',
  'other'
);

-- Table: commercial_leads
CREATE TABLE public.commercial_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  origin commercial_lead_origin NOT NULL DEFAULT 'other',
  status commercial_lead_status NOT NULL DEFAULT 'new',
  estimated_value DECIMAL(10, 2),
  converted_at TIMESTAMPTZ,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: commercial_procedures
CREATE TABLE public.commercial_procedures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category commercial_procedure_category NOT NULL DEFAULT 'other',
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: commercial_sales
CREATE TABLE public.commercial_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES public.commercial_leads(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  procedure_id UUID REFERENCES public.commercial_procedures(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.medical_appointments(id) ON DELETE SET NULL,
  value DECIMAL(10, 2) NOT NULL,
  status commercial_sale_status NOT NULL DEFAULT 'quote',
  payment_method commercial_payment_method,
  installments INTEGER DEFAULT 1,
  sale_date TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: commercial_campaigns
CREATE TABLE public.commercial_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type commercial_campaign_type NOT NULL,
  discount_percentage DECIMAL(5, 2),
  discount_amount DECIMAL(10, 2),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  target_audience TEXT,
  promo_code TEXT UNIQUE,
  leads_generated INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: commercial_lead_interactions
CREATE TABLE public.commercial_lead_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.commercial_leads(id) ON DELETE CASCADE,
  interaction_type commercial_interaction_type NOT NULL,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_commercial_leads_user_id ON public.commercial_leads(user_id);
CREATE INDEX idx_commercial_leads_status ON public.commercial_leads(status);
CREATE INDEX idx_commercial_leads_origin ON public.commercial_leads(origin);
CREATE INDEX idx_commercial_leads_contact_id ON public.commercial_leads(contact_id);
CREATE INDEX idx_commercial_leads_created_at ON public.commercial_leads(created_at);

CREATE INDEX idx_commercial_procedures_user_id ON public.commercial_procedures(user_id);
CREATE INDEX idx_commercial_procedures_category ON public.commercial_procedures(category);
CREATE INDEX idx_commercial_procedures_is_active ON public.commercial_procedures(is_active);

CREATE INDEX idx_commercial_sales_user_id ON public.commercial_sales(user_id);
CREATE INDEX idx_commercial_sales_status ON public.commercial_sales(status);
CREATE INDEX idx_commercial_sales_lead_id ON public.commercial_sales(lead_id);
CREATE INDEX idx_commercial_sales_contact_id ON public.commercial_sales(contact_id);
CREATE INDEX idx_commercial_sales_procedure_id ON public.commercial_sales(procedure_id);
CREATE INDEX idx_commercial_sales_appointment_id ON public.commercial_sales(appointment_id);
CREATE INDEX idx_commercial_sales_sale_date ON public.commercial_sales(sale_date);

CREATE INDEX idx_commercial_campaigns_user_id ON public.commercial_campaigns(user_id);
CREATE INDEX idx_commercial_campaigns_is_active ON public.commercial_campaigns(is_active);
CREATE INDEX idx_commercial_campaigns_promo_code ON public.commercial_campaigns(promo_code);
CREATE INDEX idx_commercial_campaigns_dates ON public.commercial_campaigns(start_date, end_date);

CREATE INDEX idx_commercial_lead_interactions_lead_id ON public.commercial_lead_interactions(lead_id);
CREATE INDEX idx_commercial_lead_interactions_user_id ON public.commercial_lead_interactions(user_id);
CREATE INDEX idx_commercial_lead_interactions_created_at ON public.commercial_lead_interactions(created_at);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_commercial_leads_updated_at
  BEFORE UPDATE ON public.commercial_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commercial_procedures_updated_at
  BEFORE UPDATE ON public.commercial_procedures
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commercial_sales_updated_at
  BEFORE UPDATE ON public.commercial_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_commercial_campaigns_updated_at
  BEFORE UPDATE ON public.commercial_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE public.commercial_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_procedures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commercial_lead_interactions ENABLE ROW LEVEL SECURITY;

-- Policies for commercial_leads
CREATE POLICY "Users can view their own leads"
  ON public.commercial_leads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
  ON public.commercial_leads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
  ON public.commercial_leads FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
  ON public.commercial_leads FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for commercial_procedures
CREATE POLICY "Users can view their own procedures"
  ON public.commercial_procedures FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own procedures"
  ON public.commercial_procedures FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own procedures"
  ON public.commercial_procedures FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own procedures"
  ON public.commercial_procedures FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for commercial_sales
CREATE POLICY "Users can view their own sales"
  ON public.commercial_sales FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sales"
  ON public.commercial_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sales"
  ON public.commercial_sales FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sales"
  ON public.commercial_sales FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for commercial_campaigns
CREATE POLICY "Users can view their own campaigns"
  ON public.commercial_campaigns FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own campaigns"
  ON public.commercial_campaigns FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own campaigns"
  ON public.commercial_campaigns FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own campaigns"
  ON public.commercial_campaigns FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for commercial_lead_interactions
CREATE POLICY "Users can view interactions for their leads"
  ON public.commercial_lead_interactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.commercial_leads
      WHERE commercial_leads.id = commercial_lead_interactions.lead_id
      AND commercial_leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert interactions for their leads"
  ON public.commercial_lead_interactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.commercial_leads
      WHERE commercial_leads.id = commercial_lead_interactions.lead_id
      AND commercial_leads.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interactions"
  ON public.commercial_lead_interactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own interactions"
  ON public.commercial_lead_interactions FOR DELETE
  USING (auth.uid() = user_id);

