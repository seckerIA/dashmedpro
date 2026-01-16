-- Fix RLS policies for task_attachments to ensure visibility for all involved parties

-- Drop existing policies that might be conflicting or too restrictive
DROP POLICY IF EXISTS "Users can view attachments of visible tasks" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can insert attachments to their tasks" ON public.task_attachments;
DROP POLICY IF EXISTS "Users can delete own attachments or admin" ON public.task_attachments;

-- Create comprehensive SELECT policy
CREATE POLICY "Users can view task attachments"
ON public.task_attachments
FOR SELECT
USING (
  -- User is the uploader
  user_id = auth.uid() OR
  -- User is admin or owner
  is_admin_or_dono(auth.uid()) OR
  -- User is associated with the task (creator, assignee, or owner of the task context)
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_attachments.task_id
    AND (
      t.user_id = auth.uid() OR      -- Task owner
      t.created_by = auth.uid() OR   -- Task creator
      t.assigned_to = auth.uid()     -- Task assignee
    )
  )
);

-- Create INSERT policy
CREATE POLICY "Users can add attachments to tasks they can view"
ON public.task_attachments
FOR INSERT
WITH CHECK (
  -- User is admin or owner
  is_admin_or_dono(auth.uid()) OR
  -- User is associated with the task
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_attachments.task_id
    AND (
      t.user_id = auth.uid() OR
      t.created_by = auth.uid() OR
      t.assigned_to = auth.uid()
    )
  )
);

-- Create DELETE policy
CREATE POLICY "Users can delete their own attachments or if admin"
ON public.task_attachments
FOR DELETE
USING (
  user_id = auth.uid() OR
  is_admin_or_dono(auth.uid()) OR
  -- Allow task owner to delete attachments on their tasks
  EXISTS (
    SELECT 1 FROM public.tasks t
    WHERE t.id = task_attachments.task_id
    AND t.user_id = auth.uid()
  )
);
