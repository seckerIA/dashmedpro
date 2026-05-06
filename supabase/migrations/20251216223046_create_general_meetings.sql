-- =====================================================
-- CRIAR TABELA DE REUNIÕES E COMPROMISSOS GERAIS
-- =====================================================

DO $$
BEGIN
  CREATE TYPE public.meeting_type AS ENUM (
    'meeting',
    'appointment',
    'block',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE public.meeting_status AS ENUM (
    'scheduled',
    'completed',
    'cancelled'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

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
  meeting_type public.meeting_type NOT NULL DEFAULT 'meeting',
  is_busy BOOLEAN NOT NULL DEFAULT true,
  attendees TEXT[],
  notes TEXT,
  status public.meeting_status NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  
  -- Validação: end_time deve ser depois de start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

CREATE INDEX IF NOT EXISTS idx_general_meetings_user_id ON public.general_meetings(user_id);
CREATE INDEX IF NOT EXISTS idx_general_meetings_start_time ON public.general_meetings(start_time);
CREATE INDEX IF NOT EXISTS idx_general_meetings_end_time ON public.general_meetings(end_time);
CREATE INDEX IF NOT EXISTS idx_general_meetings_status ON public.general_meetings(status);
CREATE INDEX IF NOT EXISTS idx_general_meetings_is_busy ON public.general_meetings(is_busy);
CREATE INDEX IF NOT EXISTS idx_general_meetings_user_time_range ON public.general_meetings(user_id, start_time, end_time);

-- Habilitar RLS
ALTER TABLE public.general_meetings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own meetings" ON public.general_meetings;
CREATE POLICY "Users can view their own meetings"
  ON public.general_meetings FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own meetings" ON public.general_meetings;
CREATE POLICY "Users can insert their own meetings"
  ON public.general_meetings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own meetings" ON public.general_meetings;
CREATE POLICY "Users can update their own meetings"
  ON public.general_meetings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own meetings" ON public.general_meetings;
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

DROP TRIGGER IF EXISTS update_general_meetings_updated_at ON public.general_meetings;
CREATE TRIGGER update_general_meetings_updated_at
  BEFORE UPDATE ON public.general_meetings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_general_meetings_updated_at();

-- Comentários para documentação
COMMENT ON TABLE public.general_meetings IS 'Reuniões e compromissos gerais do médico, não relacionados a pacientes';
COMMENT ON COLUMN public.general_meetings.is_busy IS 'Se true, marca o período como indisponível para agendamento de consultas médicas';
COMMENT ON COLUMN public.general_meetings.meeting_type IS 'Tipo de reunião: meeting (reunião), appointment (compromisso), block (bloqueio de tempo), other (outro)';

















