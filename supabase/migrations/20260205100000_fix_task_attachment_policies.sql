-- RLS de task_attachments (só se a tabela existir em bases que a criaram manualmente ou migração futura).

DO $$
BEGIN
  IF to_regclass('public.task_attachments') IS NOT NULL THEN
  DROP POLICY IF EXISTS "Users can view attachments of visible tasks" ON public.task_attachments;
  DROP POLICY IF EXISTS "Users can insert attachments to their tasks" ON public.task_attachments;
  DROP POLICY IF EXISTS "Users can delete own attachments or admin" ON public.task_attachments;
  DROP POLICY IF EXISTS "Users can view task attachments" ON public.task_attachments;
  DROP POLICY IF EXISTS "Users can add attachments to tasks they can view" ON public.task_attachments;
  DROP POLICY IF EXISTS "Users can delete their own attachments or if admin" ON public.task_attachments;

  CREATE POLICY "Users can view task attachments"
  ON public.task_attachments FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_attachments.task_id
      AND (
        t.user_id = auth.uid()
        OR t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
      )
    )
  );

  CREATE POLICY "Users can add attachments to tasks they can view"
  ON public.task_attachments FOR INSERT WITH CHECK (
    public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_attachments.task_id
      AND (
        t.user_id = auth.uid()
        OR t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
      )
    )
  );

  CREATE POLICY "Users can delete their own attachments or if admin"
  ON public.task_attachments FOR DELETE USING (
    user_id = auth.uid()
    OR public.is_admin_or_dono(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id = task_attachments.task_id
      AND t.user_id = auth.uid()
    )
  );
  END IF;
END $$;
