-- Adicionar campos de pausa/retomada na tabela prospecting_daily_reports
ALTER TABLE public.prospecting_daily_reports 
ADD COLUMN IF NOT EXISTS is_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paused_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS total_paused_time INTEGER DEFAULT 0; -- em minutos

-- Criar tabela para metas padrão do usuário
CREATE TABLE IF NOT EXISTS public.user_daily_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  default_goal_calls INTEGER NOT NULL DEFAULT 20,
  default_goal_contacts INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id) -- Cada usuário tem apenas uma configuração de metas padrão
);

-- Enable RLS na tabela user_daily_goals
ALTER TABLE public.user_daily_goals ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para user_daily_goals - usuários podem acessar apenas suas próprias metas
CREATE POLICY "Users can only access their own daily goals" 
ON public.user_daily_goals 
FOR ALL 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_user_daily_goals_user_id ON public.user_daily_goals(user_id);

-- Criar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_user_daily_goals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_daily_goals_updated_at
  BEFORE UPDATE ON public.user_daily_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_user_daily_goals_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.user_daily_goals IS 'Armazena as metas padrão diárias de cada usuário para prospecção';
COMMENT ON COLUMN public.prospecting_daily_reports.is_paused IS 'Indica se o cronômetro está pausado';
COMMENT ON COLUMN public.prospecting_daily_reports.paused_at IS 'Momento em que o cronômetro foi pausado';
COMMENT ON COLUMN public.prospecting_daily_reports.total_paused_time IS 'Tempo total pausado em minutos (acumulado)';

