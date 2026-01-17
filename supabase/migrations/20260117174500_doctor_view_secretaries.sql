-- Policy para permitir médicos verem perfis das secretárias vinculadas a eles
-- Necessário para a tela de Gerenciamento de Equipe, pois a policy anterior
-- restringia apenas a usuários convidados pelo médico.

create policy "Doctors can view linked secretaries"
on profiles
for select
to authenticated
using (
  (get_user_role(auth.uid()) = 'medico') AND
  exists (
    select 1
    from secretary_doctor_links
    where doctor_id = auth.uid()
    and secretary_id = profiles.id
  )
);
