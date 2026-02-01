-- =====================================================
-- FOLLOW-UP SYSTEM
-- Sistema completo de follow-up com NPS/CSAT
-- =====================================================

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE followup_trigger_type AS ENUM (
  'pre_appointment',              -- 24h antes da consulta
  'post_appointment_immediate',   -- 2h após consulta
  'post_appointment_7d',          -- 7 dias após consulta
  'post_appointment_30d',         -- 30 dias após consulta
  'post_treatment',               -- Fim de tratamento
  'payment_reminder',             -- Lembrete de pagamento
  'inactive_patient',             -- Paciente inativo >90 dias
  'birthday',                     -- Aniversário
  'custom'                        -- Personalizado
);

CREATE TYPE followup_channel AS ENUM (
  'whatsapp',
  'sms',
  'email',
  'call'
);

CREATE TYPE followup_status AS ENUM (
  'pending',      -- Agendado, aguardando envio
  'sent',         -- Enviado
  'responded',    -- Paciente respondeu
  'failed',       -- Falha no envio
  'cancelled'     -- Cancelado
);

CREATE TYPE followup_sentiment AS ENUM (
  'positive',     -- Feedback positivo
  'neutral',      -- Feedback neutro
  'negative'      -- Feedback negativo
);

-- =====================================================
-- TABLES
-- =====================================================

-- Templates de follow-up configuráveis
CREATE TABLE followup_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Configurações básicas
  name TEXT NOT NULL,
  description TEXT,
  trigger_type followup_trigger_type NOT NULL,
  delay_minutes INTEGER NOT NULL DEFAULT 120,  -- Delay após trigger (padrão: 2h)
  channel followup_channel NOT NULL DEFAULT 'whatsapp',

  -- Template de mensagem (com variáveis {{patient_name}}, {{doctor_name}}, etc)
  message_template TEXT NOT NULL,

  -- Configurações de NPS/CSAT
  include_nps BOOLEAN DEFAULT true,
  nps_question TEXT DEFAULT 'De 0 a 10, como você avalia nosso atendimento?',
  include_feedback BOOLEAN DEFAULT true,
  feedback_question TEXT DEFAULT 'Poderia nos contar mais sobre sua experiência?',

  -- Configurações de envio
  is_active BOOLEAN DEFAULT true,
  send_only_business_hours BOOLEAN DEFAULT false,
  business_hours_start TIME DEFAULT '08:00:00',
  business_hours_end TIME DEFAULT '18:00:00',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Follow-ups agendados
CREATE TABLE followup_scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES followup_templates(id) ON DELETE SET NULL,

  -- Relacionamentos (pelo menos um obrigatório)
  appointment_id UUID REFERENCES medical_appointments(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,

  -- Agendamento
  scheduled_for TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,

  -- Status e canal
  status followup_status DEFAULT 'pending',
  channel followup_channel NOT NULL DEFAULT 'whatsapp',

  -- Mensagem enviada (cópia do template renderizado)
  message_sent TEXT,

  -- Integração WhatsApp
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  whatsapp_message_id UUID REFERENCES whatsapp_messages(id) ON DELETE SET NULL,

  -- Tentativas de envio
  attempts INTEGER DEFAULT 0,
  last_error TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Respostas de follow-up
CREATE TABLE followup_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id UUID NOT NULL REFERENCES followup_scheduled(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Scores
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  csat_score INTEGER CHECK (csat_score >= 1 AND csat_score <= 5),

  -- Feedback textual
  feedback_text TEXT,
  sentiment followup_sentiment,

  -- AI Analysis
  ai_analyzed BOOLEAN DEFAULT false,
  ai_detected_issues TEXT[],
  ai_suggested_action TEXT,
  ai_summary TEXT,
  requires_follow_up BOOLEAN DEFAULT false,

  -- Ação tomada
  action_taken BOOLEAN DEFAULT false,
  action_description TEXT,
  task_created_id UUID REFERENCES tasks(id),
  deal_updated BOOLEAN DEFAULT false,

  -- Timestamps
  responded_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Métricas agregadas por período
CREATE TABLE followup_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Período
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- NPS Metrics
  nps_score DECIMAL(5,2),           -- -100.00 a +100.00
  promoters_count INTEGER DEFAULT 0,          -- 9-10
  passives_count INTEGER DEFAULT 0,           -- 7-8
  detractors_count INTEGER DEFAULT 0,         -- 0-6
  total_nps_responses INTEGER DEFAULT 0,

  -- CSAT Metrics
  csat_average DECIMAL(3,2),        -- 1.00 a 5.00
  total_csat_responses INTEGER DEFAULT 0,

  -- Volume Metrics
  total_sent INTEGER DEFAULT 0,
  total_responded INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2),       -- 0.00 a 100.00

  -- Por canal
  whatsapp_sent INTEGER DEFAULT 0,
  sms_sent INTEGER DEFAULT 0,
  email_sent INTEGER DEFAULT 0,

  -- Por tipo
  pre_appointment_sent INTEGER DEFAULT 0,
  post_appointment_sent INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(user_id, period_start, period_end)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_followup_scheduled_user ON followup_scheduled(user_id);
CREATE INDEX idx_followup_scheduled_status ON followup_scheduled(status);
CREATE INDEX idx_followup_scheduled_scheduled_for ON followup_scheduled(scheduled_for);
CREATE INDEX idx_followup_scheduled_appointment ON followup_scheduled(appointment_id);
CREATE INDEX idx_followup_scheduled_contact ON followup_scheduled(contact_id);

CREATE INDEX idx_followup_responses_followup ON followup_responses(followup_id);
CREATE INDEX idx_followup_responses_contact ON followup_responses(contact_id);
CREATE INDEX idx_followup_responses_nps ON followup_responses(nps_score);
CREATE INDEX idx_followup_responses_sentiment ON followup_responses(sentiment);
CREATE INDEX idx_followup_responses_responded_at ON followup_responses(responded_at DESC);

CREATE INDEX idx_followup_templates_user ON followup_templates(user_id);
CREATE INDEX idx_followup_templates_trigger ON followup_templates(trigger_type);
CREATE INDEX idx_followup_templates_active ON followup_templates(is_active);

CREATE INDEX idx_followup_metrics_user_period ON followup_metrics(user_id, period_start, period_end);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- followup_templates
ALTER TABLE followup_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_templates_select" ON followup_templates
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_id = auth.uid() AND doctor_id = followup_templates.user_id
    )
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE doctor_id = auth.uid() AND secretary_id = followup_templates.user_id
    )
  );

CREATE POLICY "followup_templates_insert" ON followup_templates
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "followup_templates_update" ON followup_templates
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "followup_templates_delete" ON followup_templates
  FOR DELETE USING (user_id = auth.uid());

-- followup_scheduled
ALTER TABLE followup_scheduled ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_scheduled_select" ON followup_scheduled
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_id = auth.uid() AND doctor_id = followup_scheduled.user_id
    )
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE doctor_id = auth.uid() AND secretary_id = followup_scheduled.user_id
    )
  );

CREATE POLICY "followup_scheduled_insert" ON followup_scheduled
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "followup_scheduled_update" ON followup_scheduled
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "followup_scheduled_delete" ON followup_scheduled
  FOR DELETE USING (user_id = auth.uid());

-- followup_responses
ALTER TABLE followup_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_responses_select" ON followup_responses
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_id = auth.uid() AND doctor_id = followup_responses.user_id
    )
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE doctor_id = auth.uid() AND secretary_id = followup_responses.user_id
    )
  );

CREATE POLICY "followup_responses_insert" ON followup_responses
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "followup_responses_update" ON followup_responses
  FOR UPDATE USING (user_id = auth.uid());

-- followup_metrics
ALTER TABLE followup_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "followup_metrics_select" ON followup_metrics
  FOR SELECT USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_id = auth.uid() AND doctor_id = followup_metrics.user_id
    )
  );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_followup_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER followup_templates_updated_at
  BEFORE UPDATE ON followup_templates
  FOR EACH ROW EXECUTE FUNCTION update_followup_updated_at();

CREATE TRIGGER followup_scheduled_updated_at
  BEFORE UPDATE ON followup_scheduled
  FOR EACH ROW EXECUTE FUNCTION update_followup_updated_at();

CREATE TRIGGER followup_responses_updated_at
  BEFORE UPDATE ON followup_responses
  FOR EACH ROW EXECUTE FUNCTION update_followup_updated_at();

-- =====================================================
-- RPC FUNCTIONS
-- =====================================================

-- Calcular NPS para um período
CREATE OR REPLACE FUNCTION calculate_nps(
  p_user_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS TABLE (
  nps_score DECIMAL,
  promoters INTEGER,
  passives INTEGER,
  detractors INTEGER,
  total_responses INTEGER
) AS $$
DECLARE
  v_promoters INTEGER;
  v_passives INTEGER;
  v_detractors INTEGER;
  v_total INTEGER;
  v_nps DECIMAL;
BEGIN
  -- Contar por categoria
  SELECT
    COUNT(*) FILTER (WHERE nps_score >= 9) AS promoters,
    COUNT(*) FILTER (WHERE nps_score >= 7 AND nps_score <= 8) AS passives,
    COUNT(*) FILTER (WHERE nps_score <= 6) AS detractors,
    COUNT(*) AS total
  INTO v_promoters, v_passives, v_detractors, v_total
  FROM followup_responses
  WHERE user_id = p_user_id
    AND nps_score IS NOT NULL
    AND responded_at BETWEEN p_start_date AND p_end_date;

  -- Calcular NPS: ((Promoters - Detractors) / Total) * 100
  IF v_total > 0 THEN
    v_nps := ((v_promoters - v_detractors)::DECIMAL / v_total) * 100;
  ELSE
    v_nps := 0;
  END IF;

  RETURN QUERY SELECT v_nps, v_promoters, v_passives, v_detractors, v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Obter follow-ups pendentes para envio
CREATE OR REPLACE FUNCTION get_pending_followups(
  p_limit INTEGER DEFAULT 50
)
RETURNS SETOF followup_scheduled AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM followup_scheduled
  WHERE status = 'pending'
    AND scheduled_for <= now()
    AND attempts < 3
  ORDER BY scheduled_for ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Agendar follow-up automaticamente após consulta
CREATE OR REPLACE FUNCTION schedule_post_appointment_followup(
  p_appointment_id UUID,
  p_delay_minutes INTEGER DEFAULT 120
)
RETURNS UUID AS $$
DECLARE
  v_appointment RECORD;
  v_template RECORD;
  v_scheduled_id UUID;
  v_scheduled_time TIMESTAMPTZ;
BEGIN
  -- Buscar informações da consulta
  SELECT
    ma.*,
    c.id AS contact_id,
    c.full_name AS patient_name,
    p.full_name AS doctor_name
  INTO v_appointment
  FROM medical_appointments ma
  JOIN crm_contacts c ON ma.contact_id = c.id
  JOIN profiles p ON ma.doctor_id = p.id
  WHERE ma.id = p_appointment_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Appointment not found';
  END IF;

  -- Buscar template ativo de pós-consulta
  SELECT *
  INTO v_template
  FROM followup_templates
  WHERE user_id = v_appointment.doctor_id
    AND trigger_type = 'post_appointment_immediate'
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN NULL;  -- Sem template configurado
  END IF;

  -- Calcular horário de envio
  v_scheduled_time := v_appointment.end_time + (p_delay_minutes || ' minutes')::INTERVAL;

  -- Se configurado para apenas horário comercial, ajustar
  IF v_template.send_only_business_hours THEN
    -- Se for fora do horário comercial, agendar para próximo dia útil
    IF EXTRACT(HOUR FROM v_scheduled_time) < EXTRACT(HOUR FROM v_template.business_hours_start) THEN
      v_scheduled_time := date_trunc('day', v_scheduled_time) + v_template.business_hours_start;
    ELSIF EXTRACT(HOUR FROM v_scheduled_time) >= EXTRACT(HOUR FROM v_template.business_hours_end) THEN
      v_scheduled_time := date_trunc('day', v_scheduled_time + INTERVAL '1 day') + v_template.business_hours_start;
    END IF;
  END IF;

  -- Criar follow-up agendado
  INSERT INTO followup_scheduled (
    user_id,
    organization_id,
    template_id,
    appointment_id,
    contact_id,
    scheduled_for,
    channel,
    status
  ) VALUES (
    v_appointment.doctor_id,
    v_appointment.organization_id,
    v_template.id,
    p_appointment_id,
    v_appointment.contact_id,
    v_scheduled_time,
    v_template.channel,
    'pending'
  )
  RETURNING id INTO v_scheduled_id;

  RETURN v_scheduled_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGER AUTOMÁTICO: Agendar follow-up quando consulta for concluída
-- =====================================================

CREATE OR REPLACE FUNCTION auto_schedule_followup_on_appointment_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Se status mudou para 'completed', agendar follow-up
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    PERFORM schedule_post_appointment_followup(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_schedule_followup
  AFTER INSERT OR UPDATE OF status ON medical_appointments
  FOR EACH ROW
  EXECUTE FUNCTION auto_schedule_followup_on_appointment_complete();

-- =====================================================
-- TEMPLATES PADRÃO (Seed Data)
-- =====================================================

-- Função para criar templates padrão para novos usuários
CREATE OR REPLACE FUNCTION create_default_followup_templates(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Template: Pós-consulta imediato (2h depois)
  INSERT INTO followup_templates (
    user_id,
    name,
    description,
    trigger_type,
    delay_minutes,
    channel,
    message_template,
    include_nps,
    nps_question,
    include_feedback,
    feedback_question,
    is_active
  ) VALUES (
    p_user_id,
    'Avaliação Pós-Consulta',
    'Enviado 2 horas após a consulta para avaliar satisfação',
    'post_appointment_immediate',
    120,
    'whatsapp',
    E'Olá {{patient_name}}! 😊\n\nEsperamos que sua consulta com Dr(a). {{doctor_name}} tenha sido proveitosa.\n\nGostaríamos de saber sua opinião para melhorarmos sempre!',
    true,
    'De 0 a 10, como você avalia o atendimento recebido hoje?',
    true,
    'Poderia nos contar mais sobre sua experiência?',
    true
  );

  -- Template: Confirmação pré-consulta (24h antes)
  INSERT INTO followup_templates (
    user_id,
    name,
    description,
    trigger_type,
    delay_minutes,
    channel,
    message_template,
    include_nps,
    include_feedback,
    is_active
  ) VALUES (
    p_user_id,
    'Confirmação de Consulta',
    'Lembrete enviado 24 horas antes da consulta',
    'pre_appointment',
    -1440,  -- -24 horas
    'whatsapp',
    E'Olá {{patient_name}}! 👋\n\nLembramos que sua consulta com Dr(a). {{doctor_name}} está agendada para amanhã, {{appointment_date}} às {{appointment_time}}.\n\n✅ Confirme sua presença respondendo "SIM"\n❌ Caso precise remarcar, responda "REAGENDAR"',
    false,
    false,
    true
  );

  -- Template: Follow-up 7 dias
  INSERT INTO followup_templates (
    user_id,
    name,
    description,
    trigger_type,
    delay_minutes,
    channel,
    message_template,
    include_nps,
    nps_question,
    include_feedback,
    is_active
  ) VALUES (
    p_user_id,
    'Acompanhamento 7 Dias',
    'Enviado 7 dias após consulta para acompanhar evolução',
    'post_appointment_7d',
    10080,  -- 7 dias
    'whatsapp',
    E'Olá {{patient_name}}! 🩺\n\nJá se passaram 7 dias desde sua consulta. Como você está se sentindo?\n\nEstamos aqui para qualquer dúvida!',
    true,
    'De 0 a 10, como avalia sua evolução após a consulta?',
    true,
    false
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE followup_templates IS 'Templates configuráveis de follow-up automático';
COMMENT ON TABLE followup_scheduled IS 'Follow-ups agendados para envio';
COMMENT ON TABLE followup_responses IS 'Respostas de pacientes aos follow-ups com NPS/CSAT';
COMMENT ON TABLE followup_metrics IS 'Métricas agregadas de satisfação por período';

COMMENT ON FUNCTION calculate_nps IS 'Calcula NPS score para um período específico';
COMMENT ON FUNCTION schedule_post_appointment_followup IS 'Agenda follow-up automaticamente após consulta';
COMMENT ON FUNCTION create_default_followup_templates IS 'Cria templates padrão para novos usuários';
