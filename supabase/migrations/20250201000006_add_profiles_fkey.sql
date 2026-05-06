-- =====================================================
-- Adicionar FK para profiles (além da FK para auth.users)
-- Isso permite PostgREST fazer joins com profiles
-- =====================================================

-- Adicionar constraint para assigned_to -> profiles
-- NOTA: profiles.id deve ser igual a auth.users.id (mesmo UUID)
ALTER TABLE public.whatsapp_conversations
  ADD CONSTRAINT whatsapp_conversations_assigned_to_profiles_fkey
  FOREIGN KEY (assigned_to)
  REFERENCES public.profiles(id)
  ON DELETE SET NULL;

-- Comentário
COMMENT ON CONSTRAINT whatsapp_conversations_assigned_to_profiles_fkey ON public.whatsapp_conversations
  IS 'FK para profiles table - permite PostgREST fazer joins';
