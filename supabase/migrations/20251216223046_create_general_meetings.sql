-- =====================================================
-- CRIAR TABELA DE REUNIÕES E COMPROMISSOS GERAIS
-- =====================================================

-- Criar enums
CREATE TYPE meeting_type AS ENUM (
  'meeting',
  'appointment',
  'block',
  'other'
);

CREATE TYPE meeting_status AS ENUM (
  'scheduled',
  'completed',
  'cancelled'
);

-- Criar tabela
CREATE TABLE IF NOT EXISTS public.general_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (duration_minutes > 0 AND duration_minutes <= 480),
  location TEXT,
  meeting_type meeting_type NOT NULL DEFAULT 'meeting',
  is_busy BOOLEAN NOT NULL DEFAULT true,
  attendees TEXT[],
  notes TEXT,
  status meeting_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Validação: end_time deve ser depois de start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Criar índices para performance
CREATE INDEX idx_general_meetings_user_id ON public.general_meetings(user_id);
CREATE INDEX idx_general_meetings_start_time ON public.general_meetings(start_time);
CREATE INDEX idx_general_meetings_end_time ON public.general_meetings(end_time);
CREATE INDEX idx_general_meetings_status ON public.general_meetings(status);
CREATE INDEX idx_general_meetings_is_busy ON public.general_meetings(is_busy);
CREATE INDEX idx_general_meetings_user_time_range ON public.general_meetings(user_id, start_time, end_time);

-- Habilitar RLS
ALTER TABLE public.general_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Usuários podem visualizar suas próprias reuniões
CREATE POLICY "Users can view their own meetings"
  ON public.general_meetings FOR SELECT
  USING (auth.uid() = user_id);

-- Usuários podem criar suas próprias reuniões
CREATE POLICY "Users can insert their own meetings"
  ON public.general_meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar suas próprias reuniões
CREATE POLICY "Users can update their own meetings"
  ON public.general_meetings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem deletar suas próprias reuniões
CREATE POLICY "Users can delete their own meetings"
  ON public.general_meetings FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_general_meetings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_general_meetings_updated_at
  BEFORE UPDATE ON public.general_meetings
  FOR EACH ROW
  EXECUTE FUNCTION update_general_meetings_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.general_meetings IS 'Reuniões e compromissos gerais do médico, não relacionados a pacientes';
COMMENT ON COLUMN public.general_meetings.is_busy IS 'Se true, marca o período como indisponível para agendamento de consultas médicas';
COMMENT ON COLUMN public.general_meetings.meeting_type IS 'Tipo de reunião: meeting (reunião), appointment (compromisso), block (bloqueio de tempo), other (outro)';

















