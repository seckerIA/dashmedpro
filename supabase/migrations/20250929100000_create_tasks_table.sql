-- Create custom enum types for priority and status (já criados em complete_database_schema quando aplicável)
DO $$
BEGIN
  CREATE TYPE public.task_priority AS ENUM ('baixa', 'media', 'alta');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
DO $$
BEGIN
  CREATE TYPE public.task_status AS ENUM ('pendente', 'concluida');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL DEFAULT auth.uid(),
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    priority public.task_priority,
    status public.task_status NOT NULL DEFAULT 'pendente',
    "position" INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE EXTENSION IF NOT EXISTS moddatetime WITH SCHEMA extensions;

DROP TRIGGER IF EXISTS handle_updated_at ON public.tasks;
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION extensions.moddatetime (updated_at);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Políticas por team_id só se a coluna existir (complete_database_schema usa tasks sem team_id)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns c
    WHERE c.table_schema = 'public' AND c.table_name = 'tasks' AND c.column_name = 'team_id'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Allow team members to view tasks" ON public.tasks';
    EXECUTE 'CREATE POLICY "Allow team members to view tasks" ON public.tasks FOR SELECT USING ( is_team_member(team_id, auth.uid()) )';
    EXECUTE 'DROP POLICY IF EXISTS "Allow team members to insert tasks" ON public.tasks';
    EXECUTE 'CREATE POLICY "Allow team members to insert tasks" ON public.tasks FOR INSERT WITH CHECK ( is_team_member(team_id, auth.uid()) )';
    EXECUTE 'DROP POLICY IF EXISTS "Allow team members to update tasks" ON public.tasks';
    EXECUTE 'CREATE POLICY "Allow team members to update tasks" ON public.tasks FOR UPDATE USING ( is_team_member(team_id, auth.uid()) )';
    EXECUTE 'DROP POLICY IF EXISTS "Allow team members to delete tasks" ON public.tasks';
    EXECUTE 'CREATE POLICY "Allow team members to delete tasks" ON public.tasks FOR DELETE USING ( is_team_member(team_id, auth.uid()) )';
  END IF;
END $$;
