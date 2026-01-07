-- =====================================================
-- SCRIPT PARA APLICAR MIGRATIONS DE LEAD SCORING E REATIVAÇÃO
-- Execute este script no SQL Editor do Supabase Dashboard
-- =====================================================

-- =====================================================
-- SISTEMA DE SCORING DE LEADS
-- =====================================================

-- Tabela: lead_scoring_factors
CREATE TABLE IF NOT EXISTS public.lead_scoring_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  factor_name TEXT NOT NULL,
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.0,
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, factor_name)
);

CREATE INDEX IF NOT EXISTS idx_lead_scoring_factors_user_id ON public.lead_scoring_factors(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_factors_enabled ON public.lead_scoring_factors(enabled);

-- Tabela: lead_score_history
CREATE TABLE IF NOT EXISTS public.lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.commercial_leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  factors JSONB NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_score_history_lead_id ON public.lead_score_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_contact_id ON public.lead_score_history(contact_id);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_calculated_at ON public.lead_score_history(calculated_at);
CREATE INDEX IF NOT EXISTS idx_lead_score_history_score ON public.lead_score_history(score);

-- Tabela: reactivation_campaigns
CREATE TABLE IF NOT EXISTS public.reactivation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  inactive_period_months INTEGER DEFAULT 6 CHECK (inactive_period_months > 0),
  enabled BOOLEAN DEFAULT true,
  message_templates JSONB NOT NULL DEFAULT '[]',
  schedule_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reactivation_campaigns_user_id ON public.reactivation_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_campaigns_enabled ON public.reactivation_campaigns(enabled);

-- Tabela: reactivation_messages
CREATE TABLE IF NOT EXISTS public.reactivation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.reactivation_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  template_variant TEXT NOT NULL,
  message_content TEXT NOT NULL,
  channel TEXT NOT NULL CHECK (channel IN ('whatsapp', 'sms', 'email')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  response_received BOOLEAN DEFAULT false,
  response_received_at TIMESTAMPTZ,
  appointment_scheduled BOOLEAN DEFAULT false,
  appointment_id UUID REFERENCES public.medical_appointments(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reactivation_messages_campaign_id ON public.reactivation_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_messages_contact_id ON public.reactivation_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_reactivation_messages_status ON public.reactivation_messages(status);
CREATE INDEX IF NOT EXISTS idx_reactivation_messages_sent_at ON public.reactivation_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_reactivation_messages_response_received ON public.reactivation_messages(response_received);

-- Adicionar campos em commercial_leads
ALTER TABLE public.commercial_leads
  ADD COLUMN IF NOT EXISTS conversion_score INTEGER DEFAULT 0 CHECK (conversion_score >= 0 AND conversion_score <= 100),
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_response_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS optimal_contact_hour INTEGER CHECK (optimal_contact_hour IS NULL OR (optimal_contact_hour >= 0 AND optimal_contact_hour <= 23)),
  ADD COLUMN IF NOT EXISTS urgency_keywords TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_commercial_leads_conversion_score ON public.commercial_leads(conversion_score);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_score_updated_at ON public.commercial_leads(score_updated_at);

-- Adicionar campos em crm_contacts
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS last_appointment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reactivation_eligible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactivation_last_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_last_appointment_at ON public.crm_contacts(last_appointment_at);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_reactivation_eligible ON public.crm_contacts(reactivation_eligible);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_reactivation_last_sent_at ON public.crm_contacts(reactivation_last_sent_at);

-- Função: Atualizar last_appointment_at
CREATE OR REPLACE FUNCTION update_contact_last_appointment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.crm_contacts
    SET last_appointment_at = COALESCE(NEW.completed_at, NEW.start_time)
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Atualizar last_appointment_at
DROP TRIGGER IF EXISTS trigger_update_contact_last_appointment ON public.medical_appointments;
CREATE TRIGGER trigger_update_contact_last_appointment
  AFTER UPDATE OF status ON public.medical_appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_contact_last_appointment();

-- RLS Policies para lead_scoring_factors
ALTER TABLE public.lead_scoring_factors ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own scoring factors" ON public.lead_scoring_factors;
CREATE POLICY "Users can view their own scoring factors"
  ON public.lead_scoring_factors FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scoring factors" ON public.lead_scoring_factors;
CREATE POLICY "Users can insert their own scoring factors"
  ON public.lead_scoring_factors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scoring factors" ON public.lead_scoring_factors;
CREATE POLICY "Users can update their own scoring factors"
  ON public.lead_scoring_factors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scoring factors" ON public.lead_scoring_factors;
CREATE POLICY "Users can delete their own scoring factors"
  ON public.lead_scoring_factors FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies para lead_score_history
ALTER TABLE public.lead_score_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view score history for their leads" ON public.lead_score_history;
CREATE POLICY "Users can view score history for their leads"
  ON public.lead_score_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.commercial_leads cl
      WHERE cl.id = lead_score_history.lead_id AND cl.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.crm_contacts cc
      WHERE cc.id = lead_score_history.contact_id AND cc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can insert score history" ON public.lead_score_history;
CREATE POLICY "Service role can insert score history"
  ON public.lead_score_history FOR INSERT
  WITH CHECK (true);

-- RLS Policies para reactivation_campaigns
ALTER TABLE public.reactivation_campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own reactivation campaigns" ON public.reactivation_campaigns;
CREATE POLICY "Users can manage their own reactivation campaigns"
  ON public.reactivation_campaigns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies para reactivation_messages
ALTER TABLE public.reactivation_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages for their contacts" ON public.reactivation_messages;
CREATE POLICY "Users can view messages for their contacts"
  ON public.reactivation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_contacts cc
      WHERE cc.id = reactivation_messages.contact_id AND cc.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Service role can manage reactivation messages" ON public.reactivation_messages;
CREATE POLICY "Service role can manage reactivation messages"
  ON public.reactivation_messages FOR ALL
  WITH CHECK (true);

-- =====================================================
-- INTEGRAÇÃO WHATSAPP
-- =====================================================

-- Tabela: whatsapp_messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.commercial_leads(id) ON DELETE SET NULL,
  message_id TEXT,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  phone_number TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_contact_id ON public.whatsapp_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON public.whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_sent_at ON public.whatsapp_messages(sent_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON public.whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_status ON public.whatsapp_messages(status);

-- Função: Atualizar last_contact_at quando recebe mensagem
CREATE OR REPLACE FUNCTION update_contact_last_contact_from_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'inbound' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.crm_contacts
    SET last_contact_at = NEW.sent_at
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Atualizar last_contact_at
DROP TRIGGER IF EXISTS trigger_update_contact_from_whatsapp ON public.whatsapp_messages;
CREATE TRIGGER trigger_update_contact_from_whatsapp
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  WHEN (NEW.direction = 'inbound')
  EXECUTE FUNCTION update_contact_last_contact_from_whatsapp();

-- RLS Policies para whatsapp_messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own WhatsApp messages" ON public.whatsapp_messages;
CREATE POLICY "Users can view their own WhatsApp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage WhatsApp messages" ON public.whatsapp_messages;
CREATE POLICY "Service role can manage WhatsApp messages"
  ON public.whatsapp_messages FOR ALL
  WITH CHECK (true);


