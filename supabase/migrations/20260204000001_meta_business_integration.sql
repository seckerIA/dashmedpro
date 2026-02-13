-- =====================================================
-- Meta Business Platform Integration
-- Tabelas para OAuth centralizado, Instagram, Messenger e Lead Ads
-- =====================================================

-- 1. Sessões OAuth centralizadas (30 minutos de validade)
CREATE TABLE IF NOT EXISTS meta_oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Token OAuth
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,

  -- Assets disponíveis (JSONB arrays)
  businesses JSONB DEFAULT '[]'::jsonb,
  whatsapp_accounts JSONB DEFAULT '[]'::jsonb,
  ad_accounts JSONB DEFAULT '[]'::jsonb,
  instagram_accounts JSONB DEFAULT '[]'::jsonb,
  pages JSONB DEFAULT '[]'::jsonb,

  -- Sessão temporária
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Uma sessão ativa por usuário
  CONSTRAINT unique_meta_oauth_session_per_user UNIQUE (user_id)
);

-- Índice para limpeza de sessões expiradas
CREATE INDEX IF NOT EXISTS idx_meta_oauth_sessions_expires_at ON meta_oauth_sessions(expires_at);

-- 2. Config do Instagram
CREATE TABLE IF NOT EXISTS instagram_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Dados do Instagram Business Account
  instagram_account_id TEXT NOT NULL,
  instagram_username TEXT,
  instagram_name TEXT,
  profile_picture_url TEXT,

  -- Página vinculada (obrigatório para Instagram Business)
  page_id TEXT NOT NULL,
  page_name TEXT,
  page_access_token TEXT NOT NULL,

  -- Controle de token
  token_expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  webhook_subscribed BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Um config por usuário
  CONSTRAINT unique_instagram_config_per_user UNIQUE (user_id)
);

-- 3. Config do Messenger
CREATE TABLE IF NOT EXISTS messenger_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Dados da Página do Facebook
  page_id TEXT NOT NULL,
  page_name TEXT,
  page_access_token TEXT NOT NULL,

  -- Controle de token
  token_expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,
  webhook_subscribed BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Um config por usuário
  CONSTRAINT unique_messenger_config_per_user UNIQUE (user_id)
);

-- 4. Conversas do Instagram
CREATE TABLE IF NOT EXISTS instagram_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Identificadores do Instagram
  instagram_thread_id TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  participant_username TEXT,
  participant_name TEXT,
  participant_profile_pic TEXT,

  -- Status da conversa
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_direction TEXT, -- 'inbound' | 'outbound'
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open', -- 'open' | 'pending' | 'resolved' | 'spam'

  -- Vínculo com CRM
  contact_id UUID REFERENCES crm_contacts(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Uma conversa por thread
  CONSTRAINT unique_instagram_conversation UNIQUE (user_id, instagram_thread_id)
);

-- Índices para Instagram conversations
CREATE INDEX IF NOT EXISTS idx_instagram_conversations_user_id ON instagram_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_instagram_conversations_last_message ON instagram_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_instagram_conversations_status ON instagram_conversations(status);

-- 5. Mensagens do Instagram
CREATE TABLE IF NOT EXISTS instagram_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES instagram_conversations(id) ON DELETE CASCADE,

  -- Identificador da mensagem
  message_id TEXT NOT NULL,

  -- Conteúdo
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  message_type TEXT DEFAULT 'text', -- 'text' | 'image' | 'video' | 'audio' | 'story_mention' | 'story_reply'

  -- Mídia (se aplicável)
  media_url TEXT,
  media_type TEXT,

  -- Timestamps de entrega
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Metadados extras
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp de criação
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Mensagem única
  CONSTRAINT unique_instagram_message UNIQUE (message_id)
);

-- Índices para Instagram messages
CREATE INDEX IF NOT EXISTS idx_instagram_messages_conversation ON instagram_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_instagram_messages_created_at ON instagram_messages(created_at DESC);

-- 6. Conversas do Messenger
CREATE TABLE IF NOT EXISTS messenger_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Identificadores do Messenger
  thread_id TEXT NOT NULL,
  participant_id TEXT NOT NULL, -- PSID (Page-Scoped User ID)
  participant_name TEXT,
  participant_profile_pic TEXT,

  -- Status da conversa
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_direction TEXT,
  unread_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'open',

  -- Vínculo com CRM
  contact_id UUID REFERENCES crm_contacts(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Uma conversa por thread
  CONSTRAINT unique_messenger_conversation UNIQUE (user_id, thread_id)
);

-- Índices para Messenger conversations
CREATE INDEX IF NOT EXISTS idx_messenger_conversations_user_id ON messenger_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_messenger_conversations_last_message ON messenger_conversations(last_message_at DESC);

-- 7. Mensagens do Messenger
CREATE TABLE IF NOT EXISTS messenger_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  conversation_id UUID NOT NULL REFERENCES messenger_conversations(id) ON DELETE CASCADE,

  -- Identificador da mensagem
  message_id TEXT NOT NULL,

  -- Conteúdo
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT,
  message_type TEXT DEFAULT 'text', -- 'text' | 'image' | 'video' | 'audio' | 'file' | 'template'

  -- Mídia
  media_url TEXT,
  media_type TEXT,

  -- Timestamps
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,

  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT unique_messenger_message UNIQUE (message_id)
);

-- Índices para Messenger messages
CREATE INDEX IF NOT EXISTS idx_messenger_messages_conversation ON messenger_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messenger_messages_created_at ON messenger_messages(created_at DESC);

-- 8. Lead Ads submissions
CREATE TABLE IF NOT EXISTS lead_form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),

  -- Identificadores do Lead Ad
  leadgen_id TEXT NOT NULL,
  form_id TEXT NOT NULL,
  form_name TEXT,
  page_id TEXT NOT NULL,
  ad_id TEXT,
  ad_name TEXT,
  campaign_id TEXT,
  campaign_name TEXT,
  adset_id TEXT,
  adset_name TEXT,

  -- Dados do formulário (raw)
  field_data JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Campos extraídos (para fácil acesso)
  email TEXT,
  full_name TEXT,
  phone_number TEXT,

  -- Processamento
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,

  -- Vínculo com CRM (após processamento)
  crm_contact_id UUID REFERENCES crm_contacts(id),
  crm_deal_id UUID REFERENCES crm_deals(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Lead único
  CONSTRAINT unique_leadgen_submission UNIQUE (leadgen_id)
);

-- Índices para Lead submissions
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_user_id ON lead_form_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_is_processed ON lead_form_submissions(is_processed);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_created_at ON lead_form_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_form_submissions_campaign ON lead_form_submissions(campaign_id);

-- 9. Atualizar whatsapp_config com campos de OAuth (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'oauth_connected'
  ) THEN
    ALTER TABLE whatsapp_config ADD COLUMN oauth_connected BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'whatsapp_config' AND column_name = 'oauth_expires_at'
  ) THEN
    ALTER TABLE whatsapp_config ADD COLUMN oauth_expires_at TIMESTAMPTZ;
  END IF;
END $$;

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE meta_oauth_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE instagram_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messenger_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_form_submissions ENABLE ROW LEVEL SECURITY;

-- Policies para meta_oauth_sessions
CREATE POLICY "Users can view own oauth sessions"
  ON meta_oauth_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own oauth sessions"
  ON meta_oauth_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own oauth sessions"
  ON meta_oauth_sessions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to oauth sessions"
  ON meta_oauth_sessions FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para instagram_config
CREATE POLICY "Users can view own instagram config"
  ON instagram_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own instagram config"
  ON instagram_config FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to instagram config"
  ON instagram_config FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para messenger_config
CREATE POLICY "Users can view own messenger config"
  ON messenger_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messenger config"
  ON messenger_config FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to messenger config"
  ON messenger_config FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para instagram_conversations
CREATE POLICY "Users can view own instagram conversations"
  ON instagram_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own instagram conversations"
  ON instagram_conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to instagram conversations"
  ON instagram_conversations FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para instagram_messages
CREATE POLICY "Users can view own instagram messages"
  ON instagram_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own instagram messages"
  ON instagram_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to instagram messages"
  ON instagram_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para messenger_conversations
CREATE POLICY "Users can view own messenger conversations"
  ON messenger_conversations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own messenger conversations"
  ON messenger_conversations FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to messenger conversations"
  ON messenger_conversations FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para messenger_messages
CREATE POLICY "Users can view own messenger messages"
  ON messenger_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messenger messages"
  ON messenger_messages FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access to messenger messages"
  ON messenger_messages FOR ALL
  USING (auth.role() = 'service_role');

-- Policies para lead_form_submissions
CREATE POLICY "Users can view own lead submissions"
  ON lead_form_submissions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own lead submissions"
  ON lead_form_submissions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access to lead submissions"
  ON lead_form_submissions FOR ALL
  USING (auth.role() = 'service_role');

-- =====================================================
-- Triggers para updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger em tabelas com updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'instagram_config',
      'messenger_config',
      'instagram_conversations',
      'messenger_conversations'
    ])
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%I_updated_at ON %I;
      CREATE TRIGGER update_%I_updated_at
        BEFORE UPDATE ON %I
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END $$;

-- =====================================================
-- Função para limpar sessões OAuth expiradas
-- =====================================================

CREATE OR REPLACE FUNCTION cleanup_expired_meta_oauth_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM meta_oauth_sessions
  WHERE expires_at < NOW();

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permitir que Edge Functions chamem a função de limpeza
GRANT EXECUTE ON FUNCTION cleanup_expired_meta_oauth_sessions() TO service_role;
