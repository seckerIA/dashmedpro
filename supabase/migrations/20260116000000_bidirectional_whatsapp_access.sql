-- =====================================================
-- MIGRATION: Acesso bidirecional WhatsApp
-- Médicos podem ver conversas das secretárias vinculadas
-- Data: 2026-01-16
-- =====================================================

-- Dropar políticas existentes de conversations
DROP POLICY IF EXISTS "whatsapp_conversations_select" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_insert" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_update" ON public.whatsapp_conversations;

-- =====================================================
-- Nova política SELECT com acesso BIDIRECIONAL
-- =====================================================
CREATE POLICY "whatsapp_conversations_select"
  ON public.whatsapp_conversations FOR SELECT
  USING (
    -- 1. Acesso por phone_number_id
    EXISTS (
      SELECT 1 FROM public.whatsapp_config wc
      WHERE wc.phone_number_id = whatsapp_conversations.phone_number_id
        AND wc.is_active = true
        AND (
          -- Dono da config
          wc.user_id = auth.uid()::uuid
          
          -- OU secretária do médico dono
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid()::uuid
              AND doctor_id = wc.user_id
          )
          
          -- OU médico da secretária dona (NOVO! - Acesso bidirecional)
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE doctor_id = auth.uid()::uuid
              AND secretary_id = wc.user_id
          )
        )
    )
    
    -- 2. Fallback para conversas antigas sem phone_number_id
    OR (
      whatsapp_conversations.phone_number_id IS NULL
      AND (
        -- Dono da conversa
        auth.uid()::uuid = user_id
        
        -- OU secretária do médico dono
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
            AND doctor_id = whatsapp_conversations.user_id
        )
        
        -- OU médico da secretária dona (NOVO! - Acesso bidirecional)
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE doctor_id = auth.uid()::uuid
            AND secretary_id = whatsapp_conversations.user_id
        )
      )
    )
  );

-- =====================================================
-- Nova política INSERT com acesso BIDIRECIONAL
-- =====================================================
CREATE POLICY "whatsapp_conversations_insert"
  ON public.whatsapp_conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_config wc
      WHERE wc.phone_number_id = whatsapp_conversations.phone_number_id
        AND wc.is_active = true
        AND (
          wc.user_id = auth.uid()::uuid
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid()::uuid
              AND doctor_id = wc.user_id
          )
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE doctor_id = auth.uid()::uuid
              AND secretary_id = wc.user_id
          )
        )
    )
    OR whatsapp_conversations.phone_number_id IS NULL
  );

-- =====================================================
-- Nova política UPDATE com acesso BIDIRECIONAL
-- =====================================================
CREATE POLICY "whatsapp_conversations_update"
  ON public.whatsapp_conversations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_config wc
      WHERE wc.phone_number_id = whatsapp_conversations.phone_number_id
        AND wc.is_active = true
        AND (
          wc.user_id = auth.uid()::uuid
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid()::uuid
              AND doctor_id = wc.user_id
          )
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE doctor_id = auth.uid()::uuid
              AND secretary_id = wc.user_id
          )
        )
    )
    OR (
      whatsapp_conversations.phone_number_id IS NULL
      AND auth.uid()::uuid = user_id
    )
  );

-- =====================================================
-- Atualizar políticas de mensagens também
-- =====================================================
DROP POLICY IF EXISTS "whatsapp_messages_select" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_insert" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_update" ON public.whatsapp_messages;

-- Política SELECT de mensagens com acesso BIDIRECIONAL
CREATE POLICY "whatsapp_messages_select"
  ON public.whatsapp_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.whatsapp_config wc
      WHERE wc.phone_number_id = whatsapp_messages.phone_number_id
        AND wc.is_active = true
        AND (
          wc.user_id = auth.uid()::uuid
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid()::uuid AND doctor_id = wc.user_id
          )
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE doctor_id = auth.uid()::uuid AND secretary_id = wc.user_id
          )
        )
    )
    OR (
      whatsapp_messages.phone_number_id IS NULL
      AND (
        auth.uid()::uuid = user_id
        OR EXISTS (
          SELECT 1 FROM public.whatsapp_conversations c
          WHERE c.id = whatsapp_messages.conversation_id
            AND (
              EXISTS (
                SELECT 1 FROM public.secretary_doctor_links
                WHERE secretary_id = auth.uid()::uuid AND doctor_id = c.user_id
              )
              OR EXISTS (
                SELECT 1 FROM public.secretary_doctor_links
                WHERE doctor_id = auth.uid()::uuid AND secretary_id = c.user_id
              )
            )
        )
      )
    )
  );

-- Política INSERT de mensagens com acesso BIDIRECIONAL
CREATE POLICY "whatsapp_messages_insert"
  ON public.whatsapp_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.whatsapp_config wc
      WHERE wc.phone_number_id = whatsapp_messages.phone_number_id
        AND wc.is_active = true
        AND (
          wc.user_id = auth.uid()::uuid
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid()::uuid AND doctor_id = wc.user_id
          )
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE doctor_id = auth.uid()::uuid AND secretary_id = wc.user_id
          )
        )
    )
    OR whatsapp_messages.phone_number_id IS NULL
  );

-- Política UPDATE de mensagens com acesso BIDIRECIONAL
CREATE POLICY "whatsapp_messages_update"
  ON public.whatsapp_messages FOR UPDATE
  USING (
    auth.uid()::uuid = user_id
    OR EXISTS (
      SELECT 1 FROM public.whatsapp_config wc
      WHERE wc.phone_number_id = whatsapp_messages.phone_number_id
        AND wc.is_active = true
        AND (
          wc.user_id = auth.uid()::uuid
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE secretary_id = auth.uid()::uuid AND doctor_id = wc.user_id
          )
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links
            WHERE doctor_id = auth.uid()::uuid AND secretary_id = wc.user_id
          )
        )
    )
  );

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON POLICY "whatsapp_conversations_select" ON public.whatsapp_conversations IS 
  'Acesso bidirecional: secretária vê conversas do médico E médico vê conversas da secretária vinculada';

COMMENT ON POLICY "whatsapp_messages_select" ON public.whatsapp_messages IS 
  'Acesso bidirecional às mensagens: permite médico ver mensagens das secretárias vinculadas';
