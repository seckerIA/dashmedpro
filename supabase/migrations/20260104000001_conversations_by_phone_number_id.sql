-- =====================================================
-- MIGRATION: Vincular conversas por phone_number_id
-- Isso garante que múltiplos usuários com acesso ao mesmo
-- número de WhatsApp Business compartilhem as mesmas conversas
-- =====================================================

-- 1. Adicionar coluna phone_number_id às conversas
ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

-- 2. Adicionar coluna phone_number_id às mensagens
ALTER TABLE public.whatsapp_messages
  ADD COLUMN IF NOT EXISTS phone_number_id TEXT;

-- 3. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_phone_number_id 
  ON public.whatsapp_conversations(phone_number_id);

CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number_id 
  ON public.whatsapp_messages(phone_number_id);

-- 4. Atualizar conversas existentes com phone_number_id baseado no user_id
-- ANTES de criar o índice único
UPDATE public.whatsapp_conversations c
SET phone_number_id = (
  SELECT wc.phone_number_id 
  FROM public.whatsapp_config wc 
  WHERE wc.user_id = c.user_id 
    AND wc.is_active = true
  LIMIT 1
)
WHERE c.phone_number_id IS NULL;

-- 5. Atualizar mensagens existentes com phone_number_id baseado na conversa
UPDATE public.whatsapp_messages m
SET phone_number_id = (
  SELECT c.phone_number_id 
  FROM public.whatsapp_conversations c 
  WHERE c.id = m.conversation_id
)
WHERE m.phone_number_id IS NULL;

-- 6. LIMPAR DUPLICATAS ANTES de criar o índice único
-- Mantém a conversa mais antiga e deleta as mais novas
WITH duplicates AS (
  SELECT id,
    phone_number_id,
    phone_number,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY phone_number_id, phone_number 
      ORDER BY created_at ASC
    ) as rn
  FROM public.whatsapp_conversations
  WHERE phone_number_id IS NOT NULL
)
DELETE FROM public.whatsapp_conversations
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 7. Agora criar o índice único (sem duplicatas)
CREATE UNIQUE INDEX IF NOT EXISTS idx_whatsapp_conversations_unique_phone_pair
  ON public.whatsapp_conversations(phone_number_id, phone_number)
  WHERE phone_number_id IS NOT NULL;

-- =====================================================
-- RLS POLICIES: Acesso por phone_number_id
-- Usuários podem ver conversas se tiverem acesso ao phone_number_id
-- =====================================================

-- Dropar políticas antigas
DROP POLICY IF EXISTS "whatsapp_conversations_select" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_insert" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_update" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "whatsapp_conversations_delete" ON public.whatsapp_conversations;

-- Nova política SELECT: Ver conversas do phone_number_id que o usuário tem acesso
CREATE POLICY "whatsapp_conversations_select"
  ON public.whatsapp_conversations FOR SELECT
  USING (
    -- Pode ver se o phone_number_id está na lista de configs do usuário
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
        )
    )
    -- Fallback para conversas antigas sem phone_number_id
    OR (
      whatsapp_conversations.phone_number_id IS NULL
      AND (
        auth.uid()::uuid = user_id
        OR EXISTS (
          SELECT 1 FROM public.secretary_doctor_links
          WHERE secretary_id = auth.uid()::uuid
            AND doctor_id = whatsapp_conversations.user_id
        )
      )
    )
  );

-- Nova política INSERT
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
        )
    )
    OR whatsapp_conversations.phone_number_id IS NULL
  );

-- Nova política UPDATE
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
        )
    )
    OR (
      whatsapp_conversations.phone_number_id IS NULL
      AND auth.uid()::uuid = user_id
    )
  );

-- Nova política DELETE (apenas o dono original pode deletar)
CREATE POLICY "whatsapp_conversations_delete"
  ON public.whatsapp_conversations FOR DELETE
  USING (auth.uid()::uuid = user_id);

-- =====================================================
-- Atualizar políticas de mensagens também
-- =====================================================

DROP POLICY IF EXISTS "whatsapp_messages_select" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_insert" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "whatsapp_messages_update" ON public.whatsapp_messages;

-- Mensagens SELECT: baseado no phone_number_id
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
            WHERE secretary_id = auth.uid()::uuid
              AND doctor_id = wc.user_id
          )
        )
    )
    -- Fallback para mensagens antigas
    OR (
      whatsapp_messages.phone_number_id IS NULL
      AND (
        auth.uid()::uuid = user_id
        OR EXISTS (
          SELECT 1 FROM public.whatsapp_conversations c
          WHERE c.id = whatsapp_messages.conversation_id
            AND EXISTS (
              SELECT 1 FROM public.secretary_doctor_links
              WHERE secretary_id = auth.uid()::uuid
                AND doctor_id = c.user_id
            )
        )
      )
    )
  );

-- Mensagens INSERT
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
            WHERE secretary_id = auth.uid()::uuid
              AND doctor_id = wc.user_id
          )
        )
    )
    OR whatsapp_messages.phone_number_id IS NULL
  );

-- Mensagens UPDATE
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
            WHERE secretary_id = auth.uid()::uuid
              AND doctor_id = wc.user_id
          )
        )
    )
  );

-- =====================================================
-- COMENTÁRIOS
-- =====================================================
COMMENT ON COLUMN public.whatsapp_conversations.phone_number_id IS 'ID do número do WhatsApp Business. Conversas com mesmo phone_number_id são compartilhadas entre todos os usuários com acesso.';
COMMENT ON COLUMN public.whatsapp_messages.phone_number_id IS 'ID do número do WhatsApp Business de onde a mensagem foi enviada/recebida.';
