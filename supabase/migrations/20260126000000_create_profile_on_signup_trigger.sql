-- Migration: Create profile automatically when user signs up via OAuth
-- Description: Trigger para criar perfil automaticamente quando usuário faz signup via Google OAuth
-- Date: 2026-01-26

-- ============================================================================
-- FUNCTION: Criar perfil automaticamente após signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir novo perfil na tabela profiles
  -- Usar dados do user_metadata do Supabase Auth (vem do Google OAuth)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      SPLIT_PART(NEW.email, '@', 1)
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    'medico', -- Role padrão (pode ser alterado pelo admin depois)
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Evitar erro se perfil já existir

  RETURN NEW;
END;
$$;

-- ============================================================================
-- TRIGGER: Executar função após signup
-- ============================================================================

-- Remover trigger existente se houver
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_signup();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.handle_new_user_signup() IS
'Cria automaticamente um perfil na tabela profiles quando um novo usuário faz signup via OAuth (Google, etc.)';

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS
'Trigger para criar perfil automaticamente após signup (OAuth ou email/senha)';
