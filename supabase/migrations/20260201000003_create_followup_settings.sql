-- =====================================================
-- FOLLOW-UP SETTINGS & AUTOMATION RULES
-- Sistema de configurações para automação de follow-ups
-- =====================================================

-- =====================================================
-- 1. TABELA DE CONFIGURAÇÕES GERAIS
-- =====================================================

CREATE TABLE IF NOT EXISTS followup_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configurações Globais
  is_enabled BOOLEAN DEFAULT true,
  business_hours_only BOOLEAN DEFAULT true,
  business_start_time TIME DEFAULT '08:00',
  business_end_time TIME DEFAULT '18:00',
  working_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5], -- 0=Dom, 1=Seg, ..., 6=Sáb
  timezone TEXT DEFAULT 'America/Sao_Paulo',

  -- Limites de envio
  max_daily_sends INTEGER DEFAULT 50,
  max_sends_per_contact_day INTEGER DEFAULT 3,
  min_interval_between_sends INTEGER DEFAULT 60, -- minutos

  -- =====================================================
  -- REGRAS PÓS-CONSULTA
  -- =====================================================

  -- Follow-up imediato (2h após consulta)
  post_appointment_immediate_enabled BOOLEAN DEFAULT true,
  post_appointment_immediate_delay INTEGER DEFAULT 120, -- minutos (2h)
  post_appointment_immediate_message TEXT DEFAULT 'Olá {{patient_name}}! 😊

Acabamos de nos ver na clínica. Gostaríamos de saber como foi sua experiência!

De 0 a 10, como você avalia nosso atendimento hoje?

Sua opinião é muito importante para continuarmos melhorando! 🙏',

  -- Follow-up 7 dias (retorno)
  post_appointment_7d_enabled BOOLEAN DEFAULT true,
  post_appointment_7d_delay INTEGER DEFAULT 10080, -- minutos (7 dias)
  post_appointment_7d_message TEXT DEFAULT 'Olá {{patient_name}}! 👋

Já faz uma semana desde sua última consulta com {{doctor_name}}.

Como está se sentindo? O tratamento está fazendo efeito?

Estamos à disposição caso precise de algo! 💚',

  -- Follow-up 30 dias
  post_appointment_30d_enabled BOOLEAN DEFAULT false,
  post_appointment_30d_delay INTEGER DEFAULT 43200, -- minutos (30 dias)
  post_appointment_30d_message TEXT DEFAULT 'Olá {{patient_name}}!

Já faz 1 mês desde sua última visita. Esperamos que esteja bem!

Que tal agendar uma consulta de acompanhamento?

📅 Responda "AGENDAR" para verificarmos os horários disponíveis.',

  -- =====================================================
  -- REGRAS PRÉ-CONSULTA (Lembretes)
  -- =====================================================

  -- Lembrete 24h antes
  pre_appointment_24h_enabled BOOLEAN DEFAULT true,
  pre_appointment_24h_message TEXT DEFAULT 'Olá {{patient_name}}! 📋

Lembrando que você tem consulta agendada para *amanhã*:

📅 *Data:* {{appointment_date}}
⏰ *Horário:* {{appointment_time}}
👨‍⚕️ *Médico(a):* {{doctor_name}}

Por favor, confirme sua presença respondendo:
✅ *SIM* - Confirmo
❌ *NÃO* - Preciso remarcar

Aguardamos você! 🏥',

  -- Lembrete 2h antes
  pre_appointment_2h_enabled BOOLEAN DEFAULT true,
  pre_appointment_2h_message TEXT DEFAULT 'Olá {{patient_name}}! ⏰

Sua consulta é *hoje às {{appointment_time}}* com {{doctor_name}}.

Estamos te esperando! 🏥',

  -- =====================================================
  -- REGRAS DE CONVERSÃO (Vácuo/Lead)
  -- =====================================================

  -- Follow-up para lead sem resposta
  lead_vacuum_enabled BOOLEAN DEFAULT true,
  lead_vacuum_hours INTEGER DEFAULT 24, -- horas sem resposta
  lead_vacuum_max_attempts INTEGER DEFAULT 3, -- máximo de tentativas
  lead_vacuum_interval_hours INTEGER DEFAULT 24, -- intervalo entre tentativas
  lead_vacuum_messages JSONB DEFAULT '[
    "Olá! 👋 Vi que você entrou em contato conosco. Posso ajudar com alguma informação?",
    "Oi! Ainda estamos aqui caso precise de ajuda para agendar sua consulta. 😊",
    "Olá! Esta é nossa última tentativa de contato. Caso tenha interesse, é só responder que retomamos o atendimento! 🙏"
  ]'::jsonb,

  -- Excluir leads já convertidos
  lead_vacuum_exclude_converted BOOLEAN DEFAULT true,
  lead_vacuum_exclude_scheduled BOOLEAN DEFAULT true,

  -- =====================================================
  -- REGRAS DE REATIVAÇÃO (Paciente Inativo)
  -- =====================================================

  -- Reativação após X dias sem consulta
  inactive_patient_enabled BOOLEAN DEFAULT true,
  inactive_patient_days INTEGER DEFAULT 60, -- dias desde última consulta
  inactive_patient_message TEXT DEFAULT 'Olá {{patient_name}}! 💚

Sentimos sua falta! Já faz um tempo desde sua última visita.

Que tal agendar um check-up? Cuidar da saúde é sempre importante!

📅 Responda "AGENDAR" e verificamos os melhores horários para você.',

  -- Excluir pacientes com tratamento ativo
  inactive_exclude_in_treatment BOOLEAN DEFAULT true,
  inactive_exclude_scheduled BOOLEAN DEFAULT true,

  -- =====================================================
  -- REGRAS DE PAGAMENTO
  -- =====================================================

  -- Lembrete de pagamento pendente
  payment_reminder_enabled BOOLEAN DEFAULT false,
  payment_reminder_days INTEGER DEFAULT 7, -- dias após vencimento
  payment_reminder_message TEXT DEFAULT 'Olá {{patient_name}}!

Identificamos um pagamento pendente referente ao seu atendimento.

💰 *Valor:* {{payment_amount}}
📅 *Vencimento:* {{payment_due_date}}

Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.

Em caso de dúvidas, estamos à disposição! 🙏',

  -- =====================================================
  -- REGRAS DE ANIVERSÁRIO
  -- =====================================================

  birthday_enabled BOOLEAN DEFAULT true,
  birthday_send_time TIME DEFAULT '09:00',
  birthday_message TEXT DEFAULT 'Feliz Aniversário, {{patient_name}}! 🎂🎉

Toda a equipe da clínica deseja um dia muito especial para você!

Que este novo ano traga muita saúde e felicidade! 💚

Com carinho,
{{clinic_name}} 🏥',

  -- =====================================================
  -- REGRAS DE RESPOSTA NPS
  -- =====================================================

  -- Auto-resposta baseada em NPS
  nps_auto_response_enabled BOOLEAN DEFAULT true,

  -- Resposta para promotores (9-10)
  nps_promoter_message TEXT DEFAULT 'Muito obrigado pela avaliação! 🌟

Ficamos muito felizes em saber que sua experiência foi excelente!

Se puder, deixe uma avaliação no Google para ajudar outras pessoas a nos conhecerem:
{{google_review_link}}

Sua opinião faz toda diferença! 💚',

  -- Resposta para neutros (7-8)
  nps_passive_message TEXT DEFAULT 'Obrigado pelo feedback! 😊

Ficamos felizes que sua experiência foi boa, mas queremos ser ainda melhores!

Tem algo específico que podemos melhorar? Sua opinião é muito valiosa! 🙏',

  -- Resposta para detratores (0-6)
  nps_detractor_message TEXT DEFAULT 'Obrigado por compartilhar sua experiência. 🙏

Lamentamos que não tenha sido tão positiva quanto gostaríamos.

Poderia nos contar o que aconteceu? Queremos muito resolver e melhorar!

Nossa equipe entrará em contato em breve. 💚',

  -- Alertar equipe em caso de detrator
  nps_detractor_alert_enabled BOOLEAN DEFAULT true,

  -- =====================================================
  -- METADADOS
  -- =====================================================

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_user_settings UNIQUE(user_id)
);

-- =====================================================
-- 2. TABELA DE LOG DE AUTOMAÇÕES
-- =====================================================

CREATE TABLE IF NOT EXISTS followup_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  conversation_id UUID REFERENCES whatsapp_conversations(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES medical_appointments(id) ON DELETE SET NULL,

  -- Tipo de automação
  automation_type TEXT NOT NULL, -- 'post_appointment', 'pre_appointment', 'lead_vacuum', 'inactive', 'payment', 'birthday', 'nps_response'
  trigger_reason TEXT, -- Motivo específico do disparo

  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'skipped', 'cancelled'
  error_message TEXT,

  -- Dados da mensagem
  message_sent TEXT,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. TABELA DE CONTADORES (Rate Limiting)
-- =====================================================

CREATE TABLE IF NOT EXISTS followup_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,

  -- Contadores diários (resetam à meia-noite)
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  daily_sends INTEGER DEFAULT 0,
  contact_sends INTEGER DEFAULT 0,
  last_send_at TIMESTAMPTZ,

  -- Tentativas de vácuo
  vacuum_attempts INTEGER DEFAULT 0,
  last_vacuum_at TIMESTAMPTZ,

  CONSTRAINT unique_rate_limit UNIQUE(user_id, contact_id, date)
);

-- =====================================================
-- 4. ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_followup_settings_user ON followup_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_automation_log_user ON followup_automation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_followup_automation_log_contact ON followup_automation_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_followup_automation_log_status ON followup_automation_log(status);
CREATE INDEX IF NOT EXISTS idx_followup_automation_log_type ON followup_automation_log(automation_type);
CREATE INDEX IF NOT EXISTS idx_followup_automation_log_scheduled ON followup_automation_log(scheduled_for) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_followup_rate_limits_lookup ON followup_rate_limits(user_id, contact_id, date);

-- =====================================================
-- 5. RLS POLICIES
-- =====================================================

ALTER TABLE followup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_automation_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_rate_limits ENABLE ROW LEVEL SECURITY;

-- Settings: usuário vê apenas suas configurações
CREATE POLICY "Users can view own settings"
  ON followup_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON followup_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON followup_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Secretárias podem ver configurações dos médicos vinculados
CREATE POLICY "Secretaries can view linked doctor settings"
  ON followup_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_id = auth.uid()
      AND doctor_id = followup_settings.user_id
      AND is_active = true
    )
  );

-- Automation Log
CREATE POLICY "Users can view own automation logs"
  ON followup_automation_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own automation logs"
  ON followup_automation_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Secretaries can view linked doctor logs"
  ON followup_automation_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_id = auth.uid()
      AND doctor_id = followup_automation_log.user_id
      AND is_active = true
    )
  );

-- Rate Limits
CREATE POLICY "Users can manage own rate limits"
  ON followup_rate_limits FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_followup_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_followup_settings_timestamp
  BEFORE UPDATE ON followup_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_followup_settings_updated_at();

-- =====================================================
-- 7. FUNÇÃO PARA CRIAR SETTINGS PADRÃO
-- =====================================================

CREATE OR REPLACE FUNCTION create_default_followup_settings(p_user_id UUID)
RETURNS followup_settings AS $$
DECLARE
  v_settings followup_settings;
BEGIN
  INSERT INTO followup_settings (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO UPDATE SET updated_at = now()
  RETURNING * INTO v_settings;

  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. FUNÇÃO PARA VERIFICAR RATE LIMITS
-- =====================================================

CREATE OR REPLACE FUNCTION check_followup_rate_limit(
  p_user_id UUID,
  p_contact_id UUID
)
RETURNS TABLE (
  can_send BOOLEAN,
  reason TEXT,
  daily_count INTEGER,
  contact_count INTEGER,
  minutes_until_next INTEGER
) AS $$
DECLARE
  v_settings followup_settings;
  v_limits followup_rate_limits;
  v_minutes_since_last INTEGER;
BEGIN
  -- Buscar configurações
  SELECT * INTO v_settings FROM followup_settings WHERE user_id = p_user_id;

  IF v_settings IS NULL THEN
    RETURN QUERY SELECT true, 'no_settings'::TEXT, 0, 0, 0;
    RETURN;
  END IF;

  -- Buscar ou criar rate limits
  INSERT INTO followup_rate_limits (user_id, contact_id, date)
  VALUES (p_user_id, p_contact_id, CURRENT_DATE)
  ON CONFLICT (user_id, contact_id, date) DO NOTHING;

  SELECT * INTO v_limits
  FROM followup_rate_limits
  WHERE user_id = p_user_id
    AND contact_id = p_contact_id
    AND date = CURRENT_DATE;

  -- Verificar limite diário
  IF v_limits.daily_sends >= v_settings.max_daily_sends THEN
    RETURN QUERY SELECT false, 'daily_limit_reached'::TEXT, v_limits.daily_sends, v_limits.contact_sends, 0;
    RETURN;
  END IF;

  -- Verificar limite por contato
  IF v_limits.contact_sends >= v_settings.max_sends_per_contact_day THEN
    RETURN QUERY SELECT false, 'contact_limit_reached'::TEXT, v_limits.daily_sends, v_limits.contact_sends, 0;
    RETURN;
  END IF;

  -- Verificar intervalo mínimo
  IF v_limits.last_send_at IS NOT NULL THEN
    v_minutes_since_last := EXTRACT(EPOCH FROM (now() - v_limits.last_send_at)) / 60;

    IF v_minutes_since_last < v_settings.min_interval_between_sends THEN
      RETURN QUERY SELECT
        false,
        'min_interval_not_reached'::TEXT,
        v_limits.daily_sends,
        v_limits.contact_sends,
        (v_settings.min_interval_between_sends - v_minutes_since_last)::INTEGER;
      RETURN;
    END IF;
  END IF;

  -- Pode enviar
  RETURN QUERY SELECT true, 'ok'::TEXT, v_limits.daily_sends, v_limits.contact_sends, 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. FUNÇÃO PARA INCREMENTAR CONTADORES
-- =====================================================

CREATE OR REPLACE FUNCTION increment_followup_counters(
  p_user_id UUID,
  p_contact_id UUID
)
RETURNS void AS $$
BEGIN
  INSERT INTO followup_rate_limits (user_id, contact_id, date, daily_sends, contact_sends, last_send_at)
  VALUES (p_user_id, p_contact_id, CURRENT_DATE, 1, 1, now())
  ON CONFLICT (user_id, contact_id, date) DO UPDATE SET
    daily_sends = followup_rate_limits.daily_sends + 1,
    contact_sends = followup_rate_limits.contact_sends + 1,
    last_send_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 10. FUNÇÃO PARA VERIFICAR HORÁRIO COMERCIAL
-- =====================================================

CREATE OR REPLACE FUNCTION is_within_business_hours(
  p_user_id UUID,
  p_check_time TIMESTAMPTZ DEFAULT now()
)
RETURNS BOOLEAN AS $$
DECLARE
  v_settings followup_settings;
  v_local_time TIME;
  v_day_of_week INTEGER;
BEGIN
  SELECT * INTO v_settings FROM followup_settings WHERE user_id = p_user_id;

  IF v_settings IS NULL OR NOT v_settings.business_hours_only THEN
    RETURN true;
  END IF;

  -- Converter para timezone do usuário
  v_local_time := (p_check_time AT TIME ZONE v_settings.timezone)::TIME;
  v_day_of_week := EXTRACT(DOW FROM (p_check_time AT TIME ZONE v_settings.timezone));

  -- Verificar dia da semana
  IF NOT (v_day_of_week = ANY(v_settings.working_days)) THEN
    RETURN false;
  END IF;

  -- Verificar horário
  IF v_local_time < v_settings.business_start_time OR v_local_time > v_settings.business_end_time THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 11. FUNÇÃO PARA BUSCAR FOLLOW-UPS PENDENTES
-- =====================================================

CREATE OR REPLACE FUNCTION get_pending_followup_automations(
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  contact_id UUID,
  conversation_id UUID,
  appointment_id UUID,
  automation_type TEXT,
  trigger_reason TEXT,
  message_sent TEXT,
  scheduled_for TIMESTAMPTZ,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    fal.id,
    fal.user_id,
    fal.contact_id,
    fal.conversation_id,
    fal.appointment_id,
    fal.automation_type,
    fal.trigger_reason,
    fal.message_sent,
    fal.scheduled_for,
    fal.metadata
  FROM followup_automation_log fal
  JOIN followup_settings fs ON fs.user_id = fal.user_id
  WHERE fal.status = 'pending'
    AND fal.scheduled_for <= now()
    AND fs.is_enabled = true
    AND is_within_business_hours(fal.user_id, now())
  ORDER BY fal.scheduled_for ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 12. GRANT PERMISSIONS
-- =====================================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON followup_settings TO authenticated;
GRANT ALL ON followup_automation_log TO authenticated;
GRANT ALL ON followup_rate_limits TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_followup_settings TO authenticated;
GRANT EXECUTE ON FUNCTION check_followup_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION increment_followup_counters TO authenticated;
GRANT EXECUTE ON FUNCTION is_within_business_hours TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_followup_automations TO authenticated;
