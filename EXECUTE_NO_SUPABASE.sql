-- ========================================
-- EXECUTE ESTE SQL NO SUPABASE DASHBOARD
-- ========================================
-- Vá em: https://supabase.com/dashboard/project/SEU_PROJETO/sql/new
-- Cole este código e clique em "Run"
-- ========================================

-- Fix tasks table to work without teams table
-- Drop existing policies first
DROP POLICY IF EXISTS "Allow team members to view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow team members to insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow team members to update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow team members to delete tasks" ON public.tasks;

-- Make team_id nullable and add user_id
ALTER TABLE public.tasks ALTER COLUMN team_id DROP NOT NULL;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index on user_id for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON public.tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);

-- Create new RLS policies based on user_id
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
USING ( 
  auth.uid() = user_id OR 
  auth.uid() = created_by OR 
  auth.uid() = assigned_to 
);

CREATE POLICY "Users can insert their own tasks"
ON public.tasks
FOR INSERT
WITH CHECK ( auth.uid() = user_id );

CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
USING ( 
  auth.uid() = user_id OR 
  auth.uid() = created_by 
);

CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
USING ( 
  auth.uid() = user_id OR 
  auth.uid() = created_by 
);

-- Create trigger to automatically set user_id
CREATE OR REPLACE FUNCTION public.set_task_user_id()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  IF NEW.created_by IS NULL THEN
    NEW.created_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trigger_set_task_user_id ON public.tasks;

-- Create trigger
CREATE TRIGGER trigger_set_task_user_id
  BEFORE INSERT ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.set_task_user_id();

-- Update comment
COMMENT ON COLUMN public.tasks.user_id IS 'The user who owns this task.';

-- ========================================
-- PRONTO! Após executar, atualize a página
-- ========================================
