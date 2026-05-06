-- =====================================================
-- RLS POLICIES: WhatsApp Chat System
-- Políticas de segurança para secretárias e médicos
-- =====================================================

-- =====================================================
-- WHATSAPP_CONFIG - Configurações
-- =====================================================
ALTER TABLE public.whatsapp_config ENABLE ROW LEVEL SECURITY;

-- Donos podem ver/editar suas configurações
CREATE POLICY "whatsapp_config_select_own"
  ON public.whatsapp_config FOR SELECT
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "whatsapp_config_insert_own"
  ON public.whatsapp_config FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "whatsapp_config_update_own"
  ON public.whatsapp_config FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "whatsapp_config_delete_own"
  ON public.whatsapp_config FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- =====================================================
-- WHATSAPP_CONVERSATIONS - Conversas
-- =====================================================
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

-- SELECT: dono, atribuído ou secretária vinculada
CREATE POLICY "whatsapp_conversations_select"
  ON public.whatsapp_conversations FOR SELECT
  USING (
    auth.uid()::uuid = user_id
    OR auth.uid()::uuid = assigned_to
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_conversations.user_id
    )
  );

-- INSERT: apenas o dono pode criar conversas
CREATE POLICY "whatsapp_conversations_insert"
  ON public.whatsapp_conversations FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_conversations.user_id
    )
  );

-- UPDATE: dono, atribuído ou secretária vinculada
CREATE POLICY "whatsapp_conversations_update"
  ON public.whatsapp_conversations FOR UPDATE
  USING (
    auth.uid()::uuid = user_id
    OR auth.uid()::uuid = assigned_to
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_conversations.user_id
    )
  );

-- DELETE: apenas o dono
CREATE POLICY "whatsapp_conversations_delete"
  ON public.whatsapp_conversations FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- =====================================================
-- WHATSAPP_MESSAGES - Mensagens
-- =====================================================
-- (Já tem RLS habilitado, vamos adicionar policies para secretárias)

-- Remover policy antiga se existir e recriar
DROP POLICY IF EXISTS "Users can view their own WhatsApp messages" ON public.whatsapp_messages;

CREATE POLICY "whatsapp_messages_select"
  ON public.whatsapp_messages FOR SELECT
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.whatsapp_conversations c
      WHERE c.id = whatsapp_messages.conversation_id
      AND (
        c.assigned_to = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = c.user_id
        )
      )
    )
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_messages.user_id
    )
  );

CREATE POLICY "whatsapp_messages_insert"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_messages.user_id
    )
  );

CREATE POLICY "whatsapp_messages_update"
  ON public.whatsapp_messages FOR UPDATE
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_messages.user_id
    )
  );

-- =====================================================
-- WHATSAPP_CONVERSATION_LABELS - Tags
-- =====================================================
ALTER TABLE public.whatsapp_conversation_labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_labels_select"
  ON public.whatsapp_conversation_labels FOR SELECT
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_conversation_labels.user_id
    )
  );

CREATE POLICY "whatsapp_labels_insert"
  ON public.whatsapp_conversation_labels FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_conversation_labels.user_id
    )
  );

CREATE POLICY "whatsapp_labels_update"
  ON public.whatsapp_conversation_labels FOR UPDATE
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_conversation_labels.user_id
    )
  );

CREATE POLICY "whatsapp_labels_delete"
  ON public.whatsapp_conversation_labels FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- =====================================================
-- WHATSAPP_CONVERSATION_LABEL_ASSIGNMENTS - Atribuições de Tags
-- =====================================================
ALTER TABLE public.whatsapp_conversation_label_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_label_assignments_select"
  ON public.whatsapp_conversation_label_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations c
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()::uuid
        OR c.assigned_to = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = c.user_id
        )
      )
    )
  );

CREATE POLICY "whatsapp_label_assignments_insert"
  ON public.whatsapp_conversation_label_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations c
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()::uuid
        OR c.assigned_to = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = c.user_id
        )
      )
    )
  );

CREATE POLICY "whatsapp_label_assignments_delete"
  ON public.whatsapp_conversation_label_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations c
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()::uuid
        OR c.assigned_to = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = c.user_id
        )
      )
    )
  );

-- =====================================================
-- WHATSAPP_INTERNAL_NOTES - Notas Internas
-- =====================================================
ALTER TABLE public.whatsapp_internal_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_notes_select"
  ON public.whatsapp_internal_notes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_conversations c
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()::uuid
        OR c.assigned_to = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = c.user_id
        )
      )
    )
  );

CREATE POLICY "whatsapp_notes_insert"
  ON public.whatsapp_internal_notes FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = user_id
    AND EXISTS (
      SELECT 1 FROM public.whatsapp_conversations c
      WHERE c.id = conversation_id
      AND (
        c.user_id = auth.uid()::uuid
        OR c.assigned_to = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = c.user_id
        )
      )
    )
  );

CREATE POLICY "whatsapp_notes_update"
  ON public.whatsapp_internal_notes FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "whatsapp_notes_delete"
  ON public.whatsapp_internal_notes FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- =====================================================
-- WHATSAPP_MEDIA - Mídia
-- =====================================================
ALTER TABLE public.whatsapp_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_media_select"
  ON public.whatsapp_media FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_messages m
      WHERE m.id = whatsapp_media.message_id
      AND (
        m.user_id = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = m.user_id
        )
      )
    )
  );

CREATE POLICY "whatsapp_media_insert"
  ON public.whatsapp_media FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_messages m
      WHERE m.id = whatsapp_media.message_id
      AND (
        m.user_id = auth.uid()::uuid
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
          AND doctor_id = m.user_id
        )
      )
    )
  );

-- =====================================================
-- WHATSAPP_TEMPLATES - Templates
-- =====================================================
ALTER TABLE public.whatsapp_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_templates_select"
  ON public.whatsapp_templates FOR SELECT
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_templates.user_id
    )
  );

CREATE POLICY "whatsapp_templates_insert"
  ON public.whatsapp_templates FOR INSERT
  WITH CHECK (auth.uid()::uuid = user_id);

CREATE POLICY "whatsapp_templates_update"
  ON public.whatsapp_templates FOR UPDATE
  USING (auth.uid()::uuid = user_id);

CREATE POLICY "whatsapp_templates_delete"
  ON public.whatsapp_templates FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- =====================================================
-- WHATSAPP_CANNED_RESPONSES - Respostas Rápidas
-- =====================================================
ALTER TABLE public.whatsapp_canned_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "whatsapp_canned_select"
  ON public.whatsapp_canned_responses FOR SELECT
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_canned_responses.user_id
    )
  );

CREATE POLICY "whatsapp_canned_insert"
  ON public.whatsapp_canned_responses FOR INSERT
  WITH CHECK (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_canned_responses.user_id
    )
  );

CREATE POLICY "whatsapp_canned_update"
  ON public.whatsapp_canned_responses FOR UPDATE
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.secretary_doctor_links
      WHERE secretary_id = auth.uid()::uuid
      AND doctor_id = whatsapp_canned_responses.user_id
    )
  );

CREATE POLICY "whatsapp_canned_delete"
  ON public.whatsapp_canned_responses FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================
COMMENT ON POLICY "whatsapp_conversations_select" ON public.whatsapp_conversations
  IS 'Secretárias podem ver conversas dos médicos vinculados via secretary_doctor_links';

COMMENT ON POLICY "whatsapp_messages_select" ON public.whatsapp_messages
  IS 'Secretárias podem ver mensagens dos médicos vinculados';
