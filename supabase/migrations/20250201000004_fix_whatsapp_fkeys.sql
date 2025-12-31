-- =====================================================
-- FIX: Adicionar constraint names explícitos para joins
-- =====================================================

-- Drop e recria foreign key com nome explícito para assigned_to
ALTER TABLE public.whatsapp_conversations
  DROP CONSTRAINT IF EXISTS whatsapp_conversations_assigned_to_fkey;

ALTER TABLE public.whatsapp_conversations
  ADD CONSTRAINT whatsapp_conversations_assigned_to_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES auth.users(id)
  ON DELETE SET NULL;

-- Adicionar constraint para user_id também (consistência)
ALTER TABLE public.whatsapp_conversations
  DROP CONSTRAINT IF EXISTS whatsapp_conversations_user_id_fkey;

ALTER TABLE public.whatsapp_conversations
  ADD CONSTRAINT whatsapp_conversations_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Comentário
COMMENT ON CONSTRAINT whatsapp_conversations_assigned_to_fkey ON public.whatsapp_conversations
  IS 'FK para profiles via auth.users - permite joins com profiles table';
