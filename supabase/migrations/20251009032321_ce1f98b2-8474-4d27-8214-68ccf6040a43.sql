-- =====================================================
-- 1. TABELA DE FOLLOW-UPS AGENDADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_follow_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id UUID NOT NULL REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido', 'cancelado')),
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX idx_crm_follow_ups_deal_id ON public.crm_follow_ups(deal_id);
CREATE INDEX idx_crm_follow_ups_user_id ON public.crm_follow_ups(user_id);
CREATE INDEX idx_crm_follow_ups_scheduled_date ON public.crm_follow_ups(scheduled_date);
CREATE INDEX idx_crm_follow_ups_status ON public.crm_follow_ups(status);

-- RLS Policies
ALTER TABLE public.crm_follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own follow-ups"
  ON public.crm_follow_ups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own follow-ups"
  ON public.crm_follow_ups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own follow-ups"
  ON public.crm_follow_ups FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own follow-ups"
  ON public.crm_follow_ups FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_crm_follow_ups_updated_at
  BEFORE UPDATE ON public.crm_follow_ups
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 2. ADICIONAR CAMPO DE IMAGEM NAS TAREFAS
-- =====================================================
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- =====================================================
-- 3. CRIAR BUCKET PARA IMAGENS DE TAREFAS
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('task-images', 'task-images', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies para task-images
CREATE POLICY "Users can upload their task images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'task-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their task images"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'task-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their task images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'task-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their task images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'task-images' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 4. FUNÇÃO PARA CRIAR TAREFAS A PARTIR DE FOLLOW-UPS
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_tasks_from_follow_ups()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar tarefas para follow-ups agendados para hoje
  INSERT INTO public.tasks (
    user_id,
    created_by,
    assigned_to,
    title,
    description,
    due_date,
    priority,
    status,
    category,
    deal_id,
    contact_id
  )
  SELECT 
    f.user_id,
    f.user_id as created_by,
    f.user_id as assigned_to,
    'Follow-up: ' || d.title as title,
    'Follow-up agendado para ' || f.scheduled_time::text || E'\n\n' || COALESCE(f.description, '') as description,
    (f.scheduled_date::text || ' ' || f.scheduled_time::text)::timestamp with time zone as due_date,
    'alta'::task_priority as priority,
    'pendente'::task_status as status,
    'comercial'::task_category as category,
    f.deal_id,
    d.contact_id
  FROM public.crm_follow_ups f
  INNER JOIN public.crm_deals d ON f.deal_id = d.id
  WHERE f.scheduled_date = CURRENT_DATE
    AND f.status = 'pendente'
    AND NOT EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.deal_id = f.deal_id
        AND t.title LIKE 'Follow-up: %'
        AND t.due_date::date = f.scheduled_date
        AND t.status = 'pendente'
    );
END;
$$;

COMMENT ON FUNCTION public.create_tasks_from_follow_ups() IS 
'Cria tarefas automaticamente para follow-ups agendados para hoje. Execute diariamente via cron ou manualmente.';