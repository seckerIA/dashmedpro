-- =====================================================
-- SISTEMA DE SCORING DE LEADS
-- Detector de Padrões de Leads - Quem vai virar paciente
-- =====================================================

-- =====================================================
-- TABELA: lead_scoring_factors
-- Armazena fatores e pesos para cálculo de score
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_scoring_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  factor_name TEXT NOT NULL, -- 'response_time', 'urgency_keywords', 'optimal_hour', 'origin', 'estimated_value'
  weight DECIMAL(5,2) NOT NULL DEFAULT 1.0, -- Peso do fator (0-10)
  enabled BOOLEAN DEFAULT true,
  config JSONB DEFAULT '{}', -- Configurações específicas do fator
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(user_id, factor_name)
);

CREATE INDEX idx_lead_scoring_factors_user_id ON public.lead_scoring_factors(user_id);
CREATE INDEX idx_lead_scoring_factors_enabled ON public.lead_scoring_factors(enabled);

COMMENT ON TABLE public.lead_scoring_factors IS 'Fatores e pesos para cálculo de score de conversão de leads';
COMMENT ON COLUMN public.lead_scoring_factors.factor_name IS 'Nome do fator: response_time, urgency_keywords, optimal_hour, origin, estimated_value';
COMMENT ON COLUMN public.lead_scoring_factors.weight IS 'Peso do fator no cálculo (0-10)';
COMMENT ON COLUMN public.lead_scoring_factors.config IS 'Configurações específicas do fator (ex: keywords de urgência, horários ótimos)';

-- =====================================================
-- TABELA: lead_score_history
-- Histórico de scores para análise de tendências
-- =====================================================
CREATE TABLE IF NOT EXISTS public.lead_score_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.commercial_leads(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100), -- 0-100
  factors JSONB NOT NULL DEFAULT '{}', -- Detalhamento dos fatores calculados
  calculated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_lead_score_history_lead_id ON public.lead_score_history(lead_id);
CREATE INDEX idx_lead_score_history_contact_id ON public.lead_score_history(contact_id);
CREATE INDEX idx_lead_score_history_calculated_at ON public.lead_score_history(calculated_at);
CREATE INDEX idx_lead_score_history_score ON public.lead_score_history(score);

COMMENT ON TABLE public.lead_score_history IS 'Histórico de scores de leads para análise de tendências';
COMMENT ON COLUMN public.lead_score_history.factors IS 'JSON com detalhamento: {response_time: 30, optimal_hour: 20, urgency_keywords: 15, origin: 10, estimated_value: 5}';

-- =====================================================
-- TABELA: reactivation_campaigns
-- Campanhas de reativação configuradas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reactivation_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  inactive_period_months INTEGER DEFAULT 6 CHECK (inactive_period_months > 0),
  enabled BOOLEAN DEFAULT true,
  message_templates JSONB NOT NULL DEFAULT '[]', -- Array de templates para A/B testing
  schedule_config JSONB DEFAULT '{}', -- Horários preferenciais de envio
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reactivation_campaigns_user_id ON public.reactivation_campaigns(user_id);
CREATE INDEX idx_reactivation_campaigns_enabled ON public.reactivation_campaigns(enabled);

COMMENT ON TABLE public.reactivation_campaigns IS 'Campanhas de reativação de pacientes inativos';
COMMENT ON COLUMN public.reactivation_campaigns.message_templates IS 'Array de templates: [{"variant": "variant_a", "content": "...", "variables": ["{{nome}}"]}]';
COMMENT ON COLUMN public.reactivation_campaigns.schedule_config IS 'Config: {"preferred_hours": [9, 10, 14, 15], "timezone": "America/Sao_Paulo"}';

-- =====================================================
-- TABELA: reactivation_messages
-- Registro de mensagens enviadas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.reactivation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES public.reactivation_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
  template_variant TEXT NOT NULL, -- 'variant_a', 'variant_b'
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

CREATE INDEX idx_reactivation_messages_campaign_id ON public.reactivation_messages(campaign_id);
CREATE INDEX idx_reactivation_messages_contact_id ON public.reactivation_messages(contact_id);
CREATE INDEX idx_reactivation_messages_status ON public.reactivation_messages(status);
CREATE INDEX idx_reactivation_messages_sent_at ON public.reactivation_messages(sent_at);
CREATE INDEX idx_reactivation_messages_response_received ON public.reactivation_messages(response_received);

COMMENT ON TABLE public.reactivation_messages IS 'Registro de mensagens de reativação enviadas';
COMMENT ON COLUMN public.reactivation_messages.template_variant IS 'Variante do template usado (para A/B testing)';

-- =====================================================
-- ADICIONAR CAMPOS EM commercial_leads
-- =====================================================
ALTER TABLE public.commercial_leads
  ADD COLUMN IF NOT EXISTS conversion_score INTEGER DEFAULT 0 CHECK (conversion_score >= 0 AND conversion_score <= 100),
  ADD COLUMN IF NOT EXISTS score_updated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS first_response_time_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS optimal_contact_hour INTEGER CHECK (optimal_contact_hour IS NULL OR (optimal_contact_hour >= 0 AND optimal_contact_hour <= 23)),
  ADD COLUMN IF NOT EXISTS urgency_keywords TEXT[] DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_commercial_leads_conversion_score ON public.commercial_leads(conversion_score);
CREATE INDEX IF NOT EXISTS idx_commercial_leads_score_updated_at ON public.commercial_leads(score_updated_at);

COMMENT ON COLUMN public.commercial_leads.conversion_score IS 'Score de conversão (0-100): Verde (70-100), Amarelo (40-69), Vermelho (0-39)';
COMMENT ON COLUMN public.commercial_leads.first_response_time_minutes IS 'Tempo em minutos até primeira resposta';
COMMENT ON COLUMN public.commercial_leads.optimal_contact_hour IS 'Horário ótimo de contato (0-23)';
COMMENT ON COLUMN public.commercial_leads.urgency_keywords IS 'Array de keywords de urgência encontradas nas notas';

-- =====================================================
-- ADICIONAR CAMPOS EM crm_contacts
-- =====================================================
ALTER TABLE public.crm_contacts
  ADD COLUMN IF NOT EXISTS last_appointment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reactivation_eligible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS reactivation_last_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_crm_contacts_last_appointment_at ON public.crm_contacts(last_appointment_at);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_reactivation_eligible ON public.crm_contacts(reactivation_eligible);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_reactivation_last_sent_at ON public.crm_contacts(reactivation_last_sent_at);

COMMENT ON COLUMN public.crm_contacts.last_appointment_at IS 'Data da última consulta agendada/completada';
COMMENT ON COLUMN public.crm_contacts.reactivation_eligible IS 'Se o contato é elegível para reativação (inativo há 6+ meses)';
COMMENT ON COLUMN public.crm_contacts.reactivation_last_sent_at IS 'Data da última mensagem de reativação enviada';

-- =====================================================
-- FUNÇÃO: Atualizar last_appointment_at
-- =====================================================
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

COMMENT ON FUNCTION update_contact_last_appointment() IS 'Atualiza last_appointment_at quando uma consulta é completada';

-- =====================================================
-- TRIGGER: Atualizar last_appointment_at
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_contact_last_appointment ON public.medical_appointments;
CREATE TRIGGER trigger_update_contact_last_appointment
  AFTER UPDATE OF status ON public.medical_appointments
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND OLD.status != 'completed')
  EXECUTE FUNCTION update_contact_last_appointment();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- lead_scoring_factors
ALTER TABLE public.lead_scoring_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own scoring factors"
  ON public.lead_scoring_factors FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scoring factors"
  ON public.lead_scoring_factors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scoring factors"
  ON public.lead_scoring_factors FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own scoring factors"
  ON public.lead_scoring_factors FOR DELETE
  USING (auth.uid() = user_id);

-- lead_score_history
ALTER TABLE public.lead_score_history ENABLE ROW LEVEL SECURITY;

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

CREATE POLICY "Service role can insert score history"
  ON public.lead_score_history FOR INSERT
  WITH CHECK (true);

-- reactivation_campaigns
ALTER TABLE public.reactivation_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own reactivation campaigns"
  ON public.reactivation_campaigns FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- reactivation_messages
ALTER TABLE public.reactivation_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages for their contacts"
  ON public.reactivation_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.crm_contacts cc
      WHERE cc.id = reactivation_messages.contact_id AND cc.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage reactivation messages"
  ON public.reactivation_messages FOR ALL
  WITH CHECK (true);


