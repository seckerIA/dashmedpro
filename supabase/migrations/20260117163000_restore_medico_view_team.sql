-- Restaurar acesso do médico à sua equipe (convidados)
-- Usando subquery segura para evitar recursão infinita na própria linha sendo verificada

CREATE POLICY "Medico can view invited users" ON profiles
    FOR SELECT USING (
        -- O usuário atual é médico? (Verifica na tabela profiles mas filtrando pelo auth.uid, o que é permitido pela políca 'own profile')
        (SELECT role FROM public.profiles WHERE id = auth.uid() LIMIT 1) = 'medico' 
        AND 
        -- E o perfil alvo foi convidado por ele?
        invited_by = auth.uid()
    );
