-- Agenda secretaria x médicos da mesma organização
--
-- Problema: política "organization_id = ANY(get_user_org_ids())" não retorna linhas
-- com organization_id NULL ou legado; o médico ainda vê pela política
-- "Appointments access policy" (doctor_id = auth.uid()).
--
-- 1) Backfill conservador a partir do perfil do médico atendente.
-- 2) SELECT extra para secretárias: ver consultas em que o médico (doctor_id ou user_id)
--    participa da mesma organização (organization_members OU profiles.organization_id).

UPDATE public.medical_appointments AS ma
SET organization_id = p.organization_id
FROM public.profiles AS p
WHERE ma.organization_id IS NULL
  AND p.organization_id IS NOT NULL
  AND p.id = COALESCE(ma.doctor_id, ma.user_id);

DROP POLICY IF EXISTS "Secretaries view appointments for org doctors"
  ON public.medical_appointments;

CREATE POLICY "Secretaries view appointments for org doctors"
  ON public.medical_appointments FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'secretaria'
    AND (
      EXISTS (
        SELECT 1
        FROM public.organization_members AS om_doc
        WHERE om_doc.user_id = COALESCE(
          public.medical_appointments.doctor_id,
          public.medical_appointments.user_id
        )
        AND om_doc.organization_id = ANY (public.get_user_org_ids())
      )
      OR EXISTS (
        SELECT 1
        FROM public.profiles AS p_doc
        WHERE p_doc.id = COALESCE(
          public.medical_appointments.doctor_id,
          public.medical_appointments.user_id
        )
        AND p_doc.organization_id IS NOT NULL
        AND p_doc.organization_id = ANY (public.get_user_org_ids())
      )
    )
  );
