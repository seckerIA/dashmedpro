-- Migration: Criar tabela para sessões temporárias do OAuth do WhatsApp
-- Armazena tokens e WABAs enquanto usuário seleciona o número

CREATE TABLE IF NOT EXISTS public.whatsapp_oauth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  wabas JSONB NOT NULL DEFAULT '[]'::jsonb,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Garante apenas uma sessão por usuário
  CONSTRAINT unique_user_oauth_session UNIQUE (user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_user_id ON public.whatsapp_oauth_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_sessions_expires_at ON public.whatsapp_oauth_sessions(expires_at);

-- RLS
ALTER TABLE public.whatsapp_oauth_sessions ENABLE ROW LEVEL SECURITY;

-- Política: Usuário pode ver apenas sua própria sessão
CREATE POLICY "Users can view own oauth sessions"
  ON public.whatsapp_oauth_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem deletar sua própria sessão
CREATE POLICY "Users can delete own oauth sessions"
  ON public.whatsapp_oauth_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Service role pode fazer tudo (para Edge Functions)
CREATE POLICY "Service role full access"
  ON public.whatsapp_oauth_sessions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Adicionar colunas na whatsapp_config para OAuth
ALTER TABLE public.whatsapp_config 
  ADD COLUMN IF NOT EXISTS oauth_connected BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS oauth_expires_at TIMESTAMPTZ;

-- Função para limpar sessões expiradas (executar periodicamente)
CREATE OR REPLACE FUNCTION clean_expired_oauth_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.whatsapp_oauth_sessions
  WHERE expires_at < now();
END;
$$;

-- Comentários
COMMENT ON TABLE public.whatsapp_oauth_sessions IS 'Sessões temporárias do OAuth do Facebook/WhatsApp';
COMMENT ON COLUMN public.whatsapp_oauth_sessions.wabas IS 'Lista de WhatsApp Business Accounts e números disponíveis';
COMMENT ON COLUMN public.whatsapp_oauth_sessions.expires_at IS 'Sessão expira em 30 minutos após criação';
