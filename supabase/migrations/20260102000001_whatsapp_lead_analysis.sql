-- =====================================================
-- WhatsApp AI Lead Analysis Tables
-- Tabelas para análise de IA e qualificação de leads
-- =====================================================

-- Enum para status do lead
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_lead_status') THEN
    CREATE TYPE whatsapp_lead_status AS ENUM (
      'novo',        -- Novo lead, sem análise
      'frio',        -- Baixo interesse
      'morno',       -- Interesse moderado
      'quente',      -- Alto interesse
      'convertido',  -- Agendou/comprou
      'perdido'      -- Desistiu/não responde
    );
  END IF;
END$$;

-- Enum para urgência detectada
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_urgency_level') THEN
    CREATE TYPE whatsapp_urgency_level AS ENUM (
      'baixa',
      'media',
      'alta',
      'urgente'
    );
  END IF;
END$$;

-- Enum para sentimento detectado
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_sentiment') THEN
    CREATE TYPE whatsapp_sentiment AS ENUM (
      'positivo',
      'neutro',
      'negativo'
    );
  END IF;
END$$;

-- Enum para tipo de sugestão
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'whatsapp_suggestion_type') THEN
    CREATE TYPE whatsapp_suggestion_type AS ENUM (
      'quick_reply',    -- Resposta rápida curta
      'full_message',   -- Mensagem completa
      'procedure_info', -- Info sobre procedimento
      'scheduling',     -- Proposta de agendamento
      'follow_up'       -- Follow-up
    );
  END IF;
END$$;

-- =====================================================
-- Tabela principal de análise de conversa
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Qualificação do Lead
  lead_status whatsapp_lead_status DEFAULT 'novo',
  conversion_probability INTEGER CHECK (conversion_probability BETWEEN 0 AND 100) DEFAULT 0,

  -- Insights da IA
  detected_intent TEXT,                    -- Ex: "agendar consulta", "tirar dúvida", "reclamação"
  detected_procedure TEXT,                 -- Procedimento identificado na conversa
  detected_urgency whatsapp_urgency_level DEFAULT 'baixa',
  sentiment whatsapp_sentiment DEFAULT 'neutro',

  -- Sugestões e Ações
  suggested_next_action TEXT,              -- Ex: "Enviar disponibilidade", "Aguardar resposta"
  suggested_procedure_ids UUID[],          -- Array de IDs de procedimentos recomendados

  -- Flags de automação
  deal_created BOOLEAN DEFAULT FALSE,      -- Se já criou deal no CRM
  deal_id UUID,                            -- ID do deal criado (se existir)
  contact_created BOOLEAN DEFAULT FALSE,   -- Se já criou contato no CRM
  contact_id UUID,                         -- ID do contato criado (se existir)

  -- Metadata da análise
  last_analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  message_count_analyzed INTEGER DEFAULT 0,
  ai_model_used TEXT DEFAULT 'gpt-3.5-turbo',
  analysis_version INTEGER DEFAULT 1,      -- Versão do algoritmo de análise

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraint: uma análise por conversa
  UNIQUE(conversation_id)
);

-- =====================================================
-- Tabela de sugestões de mensagem da IA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.whatsapp_conversation_analysis(id) ON DELETE CASCADE,

  -- Dados da sugestão
  suggestion_type whatsapp_suggestion_type NOT NULL,
  content TEXT NOT NULL,
  confidence DECIMAL(3,2) CHECK (confidence BETWEEN 0 AND 1),  -- 0.00 a 1.00
  reasoning TEXT,                          -- Explicação do motivo da sugestão

  -- Procedimento relacionado (se aplicável)
  related_procedure_id UUID,

  -- Ordem de exibição
  display_order INTEGER DEFAULT 0,

  -- Tracking de uso
  was_used BOOLEAN DEFAULT FALSE,
  was_modified BOOLEAN DEFAULT FALSE,      -- Se o usuário editou antes de enviar
  used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours')  -- Sugestões expiram em 24h
);

-- =====================================================
-- Tabela de configuração de IA por usuário
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_ai_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Configurações
  is_enabled BOOLEAN DEFAULT TRUE,
  auto_analyze BOOLEAN DEFAULT TRUE,       -- Analisar automaticamente novas mensagens
  auto_create_deals BOOLEAN DEFAULT TRUE,  -- Criar deals automaticamente para leads quentes

  -- Limites
  max_suggestions_per_conversation INTEGER DEFAULT 3,
  analysis_cooldown_minutes INTEGER DEFAULT 5,  -- Tempo mínimo entre análises da mesma conversa

  -- Preferências de sugestão
  suggestion_language TEXT DEFAULT 'pt-BR',
  suggestion_tone TEXT DEFAULT 'professional',  -- professional, friendly, formal
  include_emojis BOOLEAN DEFAULT FALSE,

  -- API Settings (para futuro)
  openai_api_key_encrypted TEXT,           -- Chave criptografada (se quiser usar própria)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- =====================================================
-- Índices para performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_wa_analysis_conversation ON public.whatsapp_conversation_analysis(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_analysis_user ON public.whatsapp_conversation_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_analysis_status ON public.whatsapp_conversation_analysis(lead_status);
CREATE INDEX IF NOT EXISTS idx_wa_analysis_probability ON public.whatsapp_conversation_analysis(conversion_probability DESC);
CREATE INDEX IF NOT EXISTS idx_wa_analysis_last_analyzed ON public.whatsapp_conversation_analysis(last_analyzed_at DESC);

CREATE INDEX IF NOT EXISTS idx_wa_suggestions_conversation ON public.whatsapp_ai_suggestions(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_suggestions_user ON public.whatsapp_ai_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_wa_suggestions_type ON public.whatsapp_ai_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_wa_suggestions_created ON public.whatsapp_ai_suggestions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_suggestions_not_used ON public.whatsapp_ai_suggestions(conversation_id) WHERE was_used = FALSE;

-- =====================================================
-- Triggers para updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION update_whatsapp_ai_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_wa_analysis_updated_at ON public.whatsapp_conversation_analysis;
CREATE TRIGGER trigger_wa_analysis_updated_at
  BEFORE UPDATE ON public.whatsapp_conversation_analysis
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_ai_updated_at();

DROP TRIGGER IF EXISTS trigger_wa_ai_config_updated_at ON public.whatsapp_ai_config;
CREATE TRIGGER trigger_wa_ai_config_updated_at
  BEFORE UPDATE ON public.whatsapp_ai_config
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_ai_updated_at();

-- =====================================================
-- Função para obter leads quentes (para dashboard)
-- =====================================================
CREATE OR REPLACE FUNCTION get_hot_leads(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  conversation_id UUID,
  contact_name TEXT,
  phone_number TEXT,
  lead_status whatsapp_lead_status,
  conversion_probability INTEGER,
  detected_intent TEXT,
  detected_procedure TEXT,
  last_message_at TIMESTAMPTZ,
  last_analyzed_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.contact_name,
    c.phone_number,
    a.lead_status,
    a.conversion_probability,
    a.detected_intent,
    a.detected_procedure,
    c.last_message_at,
    a.last_analyzed_at
  FROM public.whatsapp_conversations c
  INNER JOIN public.whatsapp_conversation_analysis a ON a.conversation_id = c.id
  WHERE c.user_id = p_user_id
    AND a.lead_status = 'quente'
    AND c.status != 'spam'
  ORDER BY a.conversion_probability DESC, c.last_message_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Função para obter conversas pendentes de follow-up
-- =====================================================
CREATE OR REPLACE FUNCTION get_pending_followups(p_user_id UUID, p_hours INTEGER DEFAULT 24)
RETURNS TABLE (
  conversation_id UUID,
  contact_name TEXT,
  phone_number TEXT,
  lead_status whatsapp_lead_status,
  hours_since_last_message NUMERIC,
  last_message_preview TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS conversation_id,
    c.contact_name,
    c.phone_number,
    COALESCE(a.lead_status, 'novo'::whatsapp_lead_status) AS lead_status,
    EXTRACT(EPOCH FROM (NOW() - c.last_message_at)) / 3600 AS hours_since_last_message,
    c.last_message_preview
  FROM public.whatsapp_conversations c
  LEFT JOIN public.whatsapp_conversation_analysis a ON a.conversation_id = c.id
  WHERE c.user_id = p_user_id
    AND c.status IN ('open', 'pending')
    AND c.last_message_at < NOW() - (p_hours || ' hours')::INTERVAL
    AND COALESCE(a.lead_status, 'novo') NOT IN ('convertido', 'perdido')
  ORDER BY c.last_message_at ASC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Função para estatísticas de IA
-- =====================================================
CREATE OR REPLACE FUNCTION get_ai_stats(p_user_id UUID)
RETURNS TABLE (
  total_analyzed INTEGER,
  hot_leads INTEGER,
  warm_leads INTEGER,
  cold_leads INTEGER,
  converted INTEGER,
  lost INTEGER,
  avg_conversion_probability NUMERIC,
  suggestions_used INTEGER,
  suggestions_total INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER AS total_analyzed,
    COUNT(*) FILTER (WHERE lead_status = 'quente')::INTEGER AS hot_leads,
    COUNT(*) FILTER (WHERE lead_status = 'morno')::INTEGER AS warm_leads,
    COUNT(*) FILTER (WHERE lead_status = 'frio')::INTEGER AS cold_leads,
    COUNT(*) FILTER (WHERE lead_status = 'convertido')::INTEGER AS converted,
    COUNT(*) FILTER (WHERE lead_status = 'perdido')::INTEGER AS lost,
    ROUND(AVG(conversion_probability), 1) AS avg_conversion_probability,
    (SELECT COUNT(*) FROM public.whatsapp_ai_suggestions WHERE user_id = p_user_id AND was_used = TRUE)::INTEGER,
    (SELECT COUNT(*) FROM public.whatsapp_ai_suggestions WHERE user_id = p_user_id)::INTEGER
  FROM public.whatsapp_conversation_analysis
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies
-- =====================================================
ALTER TABLE public.whatsapp_conversation_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ai_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_ai_config ENABLE ROW LEVEL SECURITY;

-- Policies para whatsapp_conversation_analysis
CREATE POLICY "Users can view own analysis"
  ON public.whatsapp_conversation_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis"
  ON public.whatsapp_conversation_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own analysis"
  ON public.whatsapp_conversation_analysis FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own analysis"
  ON public.whatsapp_conversation_analysis FOR DELETE
  USING (auth.uid() = user_id);

-- Secretárias podem ver análises de médicos vinculados
CREATE POLICY "Secretaries can view linked doctor analysis"
  ON public.whatsapp_conversation_analysis FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = whatsapp_conversation_analysis.user_id
        AND sdl.is_active = TRUE
    )
  );

-- Policies para whatsapp_ai_suggestions
CREATE POLICY "Users can view own suggestions"
  ON public.whatsapp_ai_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own suggestions"
  ON public.whatsapp_ai_suggestions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own suggestions"
  ON public.whatsapp_ai_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own suggestions"
  ON public.whatsapp_ai_suggestions FOR DELETE
  USING (auth.uid() = user_id);

-- Secretárias podem ver e usar sugestões de médicos vinculados
CREATE POLICY "Secretaries can view linked doctor suggestions"
  ON public.whatsapp_ai_suggestions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = whatsapp_ai_suggestions.user_id
        AND sdl.is_active = TRUE
    )
  );

CREATE POLICY "Secretaries can update linked doctor suggestions"
  ON public.whatsapp_ai_suggestions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.secretary_doctor_links sdl
      WHERE sdl.secretary_id = auth.uid()
        AND sdl.doctor_id = whatsapp_ai_suggestions.user_id
        AND sdl.is_active = TRUE
    )
  );

-- Policies para whatsapp_ai_config
CREATE POLICY "Users can manage own AI config"
  ON public.whatsapp_ai_config FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- Comentários nas tabelas
-- =====================================================
COMMENT ON TABLE public.whatsapp_conversation_analysis IS 'Análise de IA para qualificação de leads do WhatsApp';
COMMENT ON TABLE public.whatsapp_ai_suggestions IS 'Sugestões de mensagem geradas pela IA';
COMMENT ON TABLE public.whatsapp_ai_config IS 'Configurações de IA por usuário';

COMMENT ON COLUMN public.whatsapp_conversation_analysis.lead_status IS 'Status de qualificação do lead: novo, frio, morno, quente, convertido, perdido';
COMMENT ON COLUMN public.whatsapp_conversation_analysis.conversion_probability IS 'Probabilidade de conversão de 0 a 100%';
COMMENT ON COLUMN public.whatsapp_ai_suggestions.confidence IS 'Confiança da sugestão de 0.00 a 1.00';
