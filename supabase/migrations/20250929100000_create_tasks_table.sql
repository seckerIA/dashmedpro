-- Create custom enum types for priority and status
CREATE TYPE public.task_priority AS ENUM ('baixa', 'media', 'alta');
CREATE TYPE public.task_status AS ENUM ('pendente', 'concluida');

-- Create the tasks table
CREATE TABLE public.tasks (
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

-- trigger to update "updated_at" column
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime (updated_at);

-- Add comments to the table and columns
COMMENT ON TABLE public.tasks IS 'Stores tasks for teams.';
COMMENT ON COLUMN public.tasks.id IS 'Unique identifier for the task.';
COMMENT ON COLUMN public.tasks.team_id IS 'The team this task belongs to.';
COMMENT ON COLUMN public.tasks.created_by IS 'The user who created the task.';
COMMENT ON COLUMN public.tasks.assigned_to IS 'The user this task is assigned to.';
COMMENT ON COLUMN public.tasks.title IS 'The title of the task.';
COMMENT ON COLUMN public.tasks.description IS 'A detailed description of the task.';
COMMENT ON COLUMN public.tasks.due_date IS 'The due date and time for the task.';
COMMENT ON COLUMN public.tasks.priority IS 'Priority of the task (baixa, media, alta).';
COMMENT ON COLUMN public.tasks.status IS 'Status of the task (pendente, concluida).';
COMMENT ON COLUMN public.tasks.position IS 'The order of the task in a list.';
COMMENT ON COLUMN public.tasks.created_at IS 'The timestamp when the task was created.';
COMMENT ON COLUMN public.tasks.updated_at IS 'The timestamp when the task was last updated.';

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Allow team members to view tasks"
ON public.tasks
FOR SELECT
USING ( is_team_member(team_id, auth.uid()) );

CREATE POLICY "Allow team members to insert tasks"
ON public.tasks
FOR INSERT
WITH CHECK ( is_team_member(team_id, auth.uid()) );

CREATE POLICY "Allow team members to update tasks"
ON public.tasks
FOR UPDATE
USING ( is_team_member(team_id, auth.uid()) );

CREATE POLICY "Allow team members to delete tasks"
ON public.tasks
FOR DELETE
USING ( is_team_member(team_id, auth.uid()) );
