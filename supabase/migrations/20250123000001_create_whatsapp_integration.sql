-- =====================================================
-- INTEGRAÇÃO WHATSAPP (Preparação para Real-time)
-- Estrutura para armazenar mensagens WhatsApp
-- =====================================================

-- =====================================================
-- TABELA: whatsapp_messages
-- Armazena mensagens do WhatsApp
-- =====================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES public.commercial_leads(id) ON DELETE SET NULL,
  message_id TEXT, -- ID da mensagem no WhatsApp
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMPTZ NOT NULL,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  phone_number TEXT NOT NULL,
  metadata JSONB DEFAULT '{}', -- Dados adicionais do WhatsApp
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_whatsapp_messages_user_id ON public.whatsapp_messages(user_id);
CREATE INDEX idx_whatsapp_messages_contact_id ON public.whatsapp_messages(contact_id);
CREATE INDEX idx_whatsapp_messages_lead_id ON public.whatsapp_messages(lead_id);
CREATE INDEX idx_whatsapp_messages_phone_number ON public.whatsapp_messages(phone_number);
CREATE INDEX idx_whatsapp_messages_sent_at ON public.whatsapp_messages(sent_at);
CREATE INDEX idx_whatsapp_messages_direction ON public.whatsapp_messages(direction);
CREATE INDEX idx_whatsapp_messages_status ON public.whatsapp_messages(status);

COMMENT ON TABLE public.whatsapp_messages IS 'Mensagens do WhatsApp para integração em tempo real';
COMMENT ON COLUMN public.whatsapp_messages.message_id IS 'ID único da mensagem no WhatsApp';
COMMENT ON COLUMN public.whatsapp_messages.direction IS 'Direção: inbound (recebida) ou outbound (enviada)';
COMMENT ON COLUMN public.whatsapp_messages.metadata IS 'Dados adicionais: {media_url, media_type, quoted_message_id, etc}';

-- =====================================================
-- FUNÇÃO: Atualizar last_contact_at quando recebe mensagem
-- =====================================================
CREATE OR REPLACE FUNCTION update_contact_last_contact_from_whatsapp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.direction = 'inbound' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.crm_contacts
    SET last_contact_at = NEW.sent_at
    WHERE id = NEW.contact_id;
    
    -- Recalcular score do lead se houver
    IF NEW.lead_id IS NOT NULL THEN
      -- Trigger será disparado via Edge Function
      UPDATE public.commercial_leads
      SET updated_at = now()
      WHERE id = NEW.lead_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_contact_last_contact_from_whatsapp() IS 'Atualiza last_contact_at quando recebe mensagem WhatsApp';

-- =====================================================
-- TRIGGER: Atualizar last_contact_at
-- =====================================================
CREATE TRIGGER trigger_update_contact_from_whatsapp
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  WHEN (NEW.direction = 'inbound')
  EXECUTE FUNCTION update_contact_last_contact_from_whatsapp();

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own WhatsApp messages"
  ON public.whatsapp_messages FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage WhatsApp messages"
  ON public.whatsapp_messages FOR ALL
  WITH CHECK (true);

