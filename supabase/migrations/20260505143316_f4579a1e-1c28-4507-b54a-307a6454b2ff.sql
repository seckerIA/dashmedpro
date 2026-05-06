DO $$
BEGIN
  IF to_regclass('public.problem_status') IS NOT NULL THEN
    ALTER TABLE public.problem_status ENABLE ROW LEVEL SECURITY;

    DROP POLICY IF EXISTS "Admins can view problem status" ON public.problem_status;
    CREATE POLICY "Admins can view problem status"
      ON public.problem_status FOR SELECT
      TO authenticated
      USING (public.is_admin_or_dono(auth.uid()));

    DROP POLICY IF EXISTS "Admins can manage problem status" ON public.problem_status;
    CREATE POLICY "Admins can manage problem status"
      ON public.problem_status FOR ALL
      TO authenticated
      USING (public.is_admin_or_dono(auth.uid()))
      WITH CHECK (public.is_admin_or_dono(auth.uid()));
  END IF;
END $$;

-- 2) task-attachments storage policies (scoped by task.organization_id)
DROP POLICY IF EXISTS "Authenticated users can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload task attachments" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete task attachments" ON storage.objects;

CREATE POLICY "Org members can view task attachments"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND (
          t.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links sdl
            WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = t.user_id
          )
          OR public.is_admin_or_dono(auth.uid())
        )
    )
  );

CREATE POLICY "Org members can upload task attachments"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND (
          t.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links sdl
            WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = t.user_id
          )
          OR public.is_admin_or_dono(auth.uid())
        )
    )
  );

CREATE POLICY "Org members can delete task attachments"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'task-attachments'
    AND EXISTS (
      SELECT 1 FROM public.tasks t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND (
          t.user_id = auth.uid()
          OR EXISTS (
            SELECT 1 FROM public.secretary_doctor_links sdl
            WHERE sdl.secretary_id = auth.uid() AND sdl.doctor_id = t.user_id
          )
          OR public.is_admin_or_dono(auth.uid())
        )
    )
  );

-- 3) sinal-receipts storage policies (scoped by appointment.organization_id)
DROP POLICY IF EXISTS "Users can view sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Users can update sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Org members can view sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Org members can upload sinal receipts" ON storage.objects;
DROP POLICY IF EXISTS "Org members can delete sinal receipts" ON storage.objects;

CREATE POLICY "Org members can view sinal receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'sinal-receipts'
    AND EXISTS (
      SELECT 1 FROM public.medical_appointments a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id::text = split_part(name, '-', 1)
        AND a.organization_id IS NOT DISTINCT FROM p.organization_id
    )
  );

CREATE POLICY "Org members can upload sinal receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'sinal-receipts'
    AND EXISTS (
      SELECT 1 FROM public.medical_appointments a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id::text = split_part(name, '-', 1)
        AND a.organization_id IS NOT DISTINCT FROM p.organization_id
    )
  );

CREATE POLICY "Org members can delete sinal receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'sinal-receipts'
    AND EXISTS (
      SELECT 1 FROM public.medical_appointments a
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE a.id::text = split_part(name, '-', 1)
        AND a.organization_id IS NOT DISTINCT FROM p.organization_id
    )
  );
