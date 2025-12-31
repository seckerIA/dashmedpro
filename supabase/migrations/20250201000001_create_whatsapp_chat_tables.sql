-- =====================================================
-- WHATSAPP CHAT SYSTEM - Estilo Chatwoot
-- Sistema completo de chat para secretárias
-- =====================================================

-- =====================================================
-- ENUM: Status da conversa
-- =====================================================
DO $$ BEGIN
  CREATE TYPE whatsapp_conversation_status AS ENUM ('open', 'pending', 'resolved', 'spam');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_message_type AS ENUM (
    'text', 'image', 'audio', 'video', 'document',
    'sticker', 'location', 'contact', 'template',
    'interactive', 'reaction'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_template_category AS ENUM ('MARKETING', 'UTILITY', 'AUTHENTICATION');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE whatsapp_template_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- TABELA: whatsapp_config
-- Configurações da API do WhatsApp Business por usuário
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number_id TEXT,
  business_account_id TEXT,
  waba_id TEXT,
  display_phone_number TEXT,
  verified_name TEXT,
  webhook_verify_token TEXT,
  is_active BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_whatsapp_config_user_id ON public.whatsapp_config(user_id);

COMMENT ON TABLE public.whatsapp_config IS 'Configurações da API WhatsApp Business por clínica/usuário';
COMMENT ON COLUMN public.whatsapp_config.phone_number_id IS 'Phone Number ID do Meta Business';
COMMENT ON COLUMN public.whatsapp_config.waba_id IS 'WhatsApp Business Account ID';
COMMENT ON COLUMN public.whatsapp_config.webhook_verify_token IS 'Token para verificação do webhook';

-- =====================================================
-- TABELA: whatsapp_conversations
-- Conversas/Inbox do WhatsApp
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  contact_profile_picture TEXT,
  status whatsapp_conversation_status NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  priority whatsapp_priority DEFAULT 'normal',
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  last_message_direction TEXT CHECK (last_message_direction IN ('inbound', 'outbound')),
  unread_count INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_conversations_user_id ON public.whatsapp_conversations(user_id);
CREATE INDEX idx_whatsapp_conversations_assigned_to ON public.whatsapp_conversations(assigned_to);
CREATE INDEX idx_whatsapp_conversations_status ON public.whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_conversations_phone ON public.whatsapp_conversations(phone_number);
CREATE INDEX idx_whatsapp_conversations_last_message ON public.whatsapp_conversations(last_message_at DESC);
CREATE INDEX idx_whatsapp_conversations_contact ON public.whatsapp_conversations(contact_id);
CREATE UNIQUE INDEX idx_whatsapp_conversations_unique_phone_user ON public.whatsapp_conversations(user_id, phone_number);

COMMENT ON TABLE public.whatsapp_conversations IS 'Conversas do WhatsApp (inbox) estilo Chatwoot';
COMMENT ON COLUMN public.whatsapp_conversations.status IS 'Status: open (aberta), pending (pendente), resolved (resolvida), spam';
COMMENT ON COLUMN public.whatsapp_conversations.assigned_to IS 'Secretária/atendente responsável pela conversa';

-- =====================================================
-- TABELA: whatsapp_conversation_labels
-- Tags/Labels para organizar conversas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_labels_user ON public.whatsapp_conversation_labels(user_id);
CREATE UNIQUE INDEX idx_whatsapp_labels_unique_name ON public.whatsapp_conversation_labels(user_id, name);

COMMENT ON TABLE public.whatsapp_conversation_labels IS 'Tags/labels para categorizar conversas';

-- =====================================================
-- TABELA: whatsapp_conversation_label_assignments
-- Relacionamento N:N entre conversas e labels
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_conversation_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES public.whatsapp_conversation_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(conversation_id, label_id)
);

CREATE INDEX idx_whatsapp_label_assignments_conversation ON public.whatsapp_conversation_label_assignments(conversation_id);
CREATE INDEX idx_whatsapp_label_assignments_label ON public.whatsapp_conversation_label_assignments(label_id);

-- =====================================================
-- TABELA: whatsapp_internal_notes
-- Notas internas (não visíveis ao paciente)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_notes_conversation ON public.whatsapp_internal_notes(conversation_id);
CREATE INDEX idx_whatsapp_notes_user ON public.whatsapp_internal_notes(user_id);

COMMENT ON TABLE public.whatsapp_internal_notes IS 'Notas internas da equipe sobre a conversa';

-- =====================================================
-- TABELA: whatsapp_media
-- Arquivos de mídia das mensagens
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.whatsapp_messages(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'audio', 'video', 'document', 'sticker')),
  media_url TEXT NOT NULL,
  media_mime_type TEXT,
  file_name TEXT,
  file_size INTEGER,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  whatsapp_media_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_media_message ON public.whatsapp_media(message_id);
CREATE INDEX idx_whatsapp_media_type ON public.whatsapp_media(media_type);

COMMENT ON TABLE public.whatsapp_media IS 'Arquivos de mídia anexados às mensagens';
COMMENT ON COLUMN public.whatsapp_media.whatsapp_media_id IS 'ID da mídia no WhatsApp (para download)';

-- =====================================================
-- TABELA: whatsapp_templates
-- Templates aprovados do WhatsApp Business
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  name TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'pt_BR',
  category whatsapp_template_category NOT NULL,
  status whatsapp_template_status NOT NULL DEFAULT 'pending',
  components JSONB NOT NULL DEFAULT '[]',
  example_values JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_templates_user ON public.whatsapp_templates(user_id);
CREATE INDEX idx_whatsapp_templates_status ON public.whatsapp_templates(status);
CREATE INDEX idx_whatsapp_templates_category ON public.whatsapp_templates(category);
CREATE UNIQUE INDEX idx_whatsapp_templates_unique ON public.whatsapp_templates(user_id, template_id);

COMMENT ON TABLE public.whatsapp_templates IS 'Templates aprovados do WhatsApp para mensagens em massa';

-- =====================================================
-- TABELA: whatsapp_canned_responses
-- Respostas rápidas pré-definidas
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  shortcut TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_canned_user ON public.whatsapp_canned_responses(user_id);
CREATE UNIQUE INDEX idx_whatsapp_canned_shortcut ON public.whatsapp_canned_responses(user_id, shortcut) WHERE shortcut IS NOT NULL;

COMMENT ON TABLE public.whatsapp_canned_responses IS 'Respostas rápidas pré-definidas para agilizar atendimento';
COMMENT ON COLUMN public.whatsapp_canned_responses.shortcut IS 'Atalho para usar a resposta (ex: /oi, /horarios)';

-- =====================================================
-- FUNÇÃO: Atualizar updated_at automaticamente
-- =====================================================
CREATE OR REPLACE FUNCTION update_whatsapp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER trigger_whatsapp_config_updated_at
  BEFORE UPDATE ON public.whatsapp_config
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_notes_updated_at
  BEFORE UPDATE ON public.whatsapp_internal_notes
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_templates_updated_at
  BEFORE UPDATE ON public.whatsapp_templates
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

CREATE TRIGGER trigger_whatsapp_canned_updated_at
  BEFORE UPDATE ON public.whatsapp_canned_responses
  FOR EACH ROW EXECUTE FUNCTION update_whatsapp_updated_at();

-- =====================================================
-- FUNÇÃO: Atualizar conversa quando nova mensagem chega
-- =====================================================
CREATE OR REPLACE FUNCTION update_conversation_on_new_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Atualiza a conversa com info da última mensagem
  UPDATE public.whatsapp_conversations
  SET
    last_message_at = NEW.sent_at,
    last_message_preview = LEFT(NEW.content, 100),
    last_message_direction = NEW.direction,
    unread_count = CASE
      WHEN NEW.direction = 'inbound' THEN unread_count + 1
      ELSE 0
    END,
    updated_at = now()
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_conversation_on_new_message() IS 'Atualiza conversa com preview da última mensagem';

-- =====================================================
-- Grants para service_role (Edge Functions)
-- =====================================================
GRANT ALL ON public.whatsapp_config TO service_role;
GRANT ALL ON public.whatsapp_conversations TO service_role;
GRANT ALL ON public.whatsapp_conversation_labels TO service_role;
GRANT ALL ON public.whatsapp_conversation_label_assignments TO service_role;
GRANT ALL ON public.whatsapp_internal_notes TO service_role;
GRANT ALL ON public.whatsapp_media TO service_role;
GRANT ALL ON public.whatsapp_templates TO service_role;
GRANT ALL ON public.whatsapp_canned_responses TO service_role;
