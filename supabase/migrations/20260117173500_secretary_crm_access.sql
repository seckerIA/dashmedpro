-- Policy para permitir secretárias verem deals dos médicos vinculados
create policy "Secretary can view linked doctor deals"
on crm_deals
for select
to authenticated
using (
  (get_user_role(auth.uid()) = 'secretaria') AND
  exists (
    select 1
    from secretary_doctor_links
    where secretary_id = auth.uid()
    and (doctor_id = crm_deals.user_id or doctor_id = crm_deals.assigned_to)
  )
);

-- Policy para permitir secretárias verem leads comerciais dos médicos vinculados
create policy "Secretary can view linked doctor commercial leads"
on commercial_leads
for select
to authenticated
using (
  (get_user_role(auth.uid()) = 'secretaria') AND
  exists (
    select 1
    from secretary_doctor_links
    where secretary_id = auth.uid()
    and doctor_id = commercial_leads.user_id
  )
);
