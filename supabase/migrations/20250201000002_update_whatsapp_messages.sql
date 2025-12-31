-- =====================================================
-- ATUALIZAÇÃO: whatsapp_messages
-- Adicionar campos para sistema de chat completo
-- =====================================================

-- Adicionar coluna conversation_id (FK para whatsapp_conversations)
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL;

-- Adicionar tipo de mensagem
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text'
  CHECK (message_type IN ('text', 'image', 'audio', 'video', 'document', 'sticker', 'location', 'contact', 'template', 'interactive', 'reaction'));

-- Adicionar referência para mensagem de resposta
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL;

-- Adicionar campos de erro
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS error_code TEXT;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS error_message TEXT;

-- Adicionar referência para template usado
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES public.whatsapp_templates(id) ON DELETE SET NULL;

-- Adicionar campo para contexto (quando é resposta a uma mensagem)
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS context JSONB DEFAULT NULL;

-- Criar índices para os novos campos
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_reply_to ON public.whatsapp_messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_type ON public.whatsapp_messages(message_type);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_template ON public.whatsapp_messages(template_id);

-- Comentários
COMMENT ON COLUMN public.whatsapp_messages.conversation_id IS 'Conversa à qual a mensagem pertence';
COMMENT ON COLUMN public.whatsapp_messages.message_type IS 'Tipo: text, image, audio, video, document, template, etc';
COMMENT ON COLUMN public.whatsapp_messages.reply_to_message_id IS 'ID da mensagem sendo respondida (quote/reply)';
COMMENT ON COLUMN public.whatsapp_messages.error_code IS 'Código de erro do WhatsApp (se falhou)';
COMMENT ON COLUMN public.whatsapp_messages.error_message IS 'Mensagem de erro do WhatsApp (se falhou)';
COMMENT ON COLUMN public.whatsapp_messages.context IS 'Contexto da mensagem (quoted message info)';

-- =====================================================
-- TRIGGER: Atualizar conversa quando nova mensagem é inserida
-- =====================================================
DROP TRIGGER IF EXISTS trigger_update_conversation_on_message ON public.whatsapp_messages;

CREATE TRIGGER trigger_update_conversation_on_message
  AFTER INSERT ON public.whatsapp_messages
  FOR EACH ROW
  WHEN (NEW.conversation_id IS NOT NULL)
  EXECUTE FUNCTION update_conversation_on_new_message();

-- =====================================================
-- FUNÇÃO: Criar ou buscar conversa para uma mensagem
-- =====================================================
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user_id UUID,
  p_phone_number TEXT,
  p_contact_name TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_conversation_id UUID;
  v_contact_id UUID;
BEGIN
  -- Busca conversa existente
  SELECT id INTO v_conversation_id
  FROM public.whatsapp_conversations
  WHERE user_id = p_user_id AND phone_number = p_phone_number;

  -- Se não existe, cria
  IF v_conversation_id IS NULL THEN
    -- Tenta encontrar contato pelo telefone
    SELECT id INTO v_contact_id
    FROM public.crm_contacts
    WHERE phone = p_phone_number
    LIMIT 1;

    INSERT INTO public.whatsapp_conversations (
      user_id,
      phone_number,
      contact_name,
      contact_id,
      status,
      priority
    ) VALUES (
      p_user_id,
      p_phone_number,
      COALESCE(p_contact_name, p_phone_number),
      v_contact_id,
      'open',
      'normal'
    )
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_or_create_conversation(UUID, TEXT, TEXT) IS 'Busca ou cria conversa para um número de telefone';

-- =====================================================
-- FUNÇÃO: Marcar mensagens como lidas
-- =====================================================
CREATE OR REPLACE FUNCTION mark_conversation_as_read(
  p_conversation_id UUID,
  p_user_id UUID
)
RETURNS void AS $$
BEGIN
  -- Atualiza contador de não lidas
  UPDATE public.whatsapp_conversations
  SET unread_count = 0, updated_at = now()
  WHERE id = p_conversation_id
    AND (user_id = p_user_id OR assigned_to = p_user_id);

  -- Atualiza status das mensagens recebidas para 'read'
  UPDATE public.whatsapp_messages
  SET read_at = now()
  WHERE conversation_id = p_conversation_id
    AND direction = 'inbound'
    AND read_at IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION mark_conversation_as_read(UUID, UUID) IS 'Marca todas as mensagens de uma conversa como lidas';

-- =====================================================
-- FUNÇÃO: Obter estatísticas do inbox
-- =====================================================
CREATE OR REPLACE FUNCTION get_whatsapp_inbox_stats(p_user_id UUID)
RETURNS TABLE (
  total_conversations BIGINT,
  open_count BIGINT,
  pending_count BIGINT,
  resolved_count BIGINT,
  unread_messages BIGINT,
  assigned_to_me BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_conversations,
    COUNT(*) FILTER (WHERE status = 'open')::BIGINT as open_count,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_count,
    COUNT(*) FILTER (WHERE status = 'resolved')::BIGINT as resolved_count,
    COALESCE(SUM(unread_count), 0)::BIGINT as unread_messages,
    COUNT(*) FILTER (WHERE assigned_to = p_user_id)::BIGINT as assigned_to_me
  FROM public.whatsapp_conversations
  WHERE user_id = p_user_id
    OR assigned_to = p_user_id
    OR EXISTS (
      SELECT 1 FROM secretary_doctor_links
      WHERE secretary_id = p_user_id
      AND doctor_id = whatsapp_conversations.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_whatsapp_inbox_stats(UUID) IS 'Retorna estatísticas do inbox para dashboard';

-- Grant para as novas funções
GRANT EXECUTE ON FUNCTION get_or_create_conversation(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION mark_conversation_as_read(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_whatsapp_inbox_stats(UUID) TO authenticated;
