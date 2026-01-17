CREATE POLICY "Secretaria can view linked doctors and admins" ON profiles
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'secretaria'
        AND (
            -- Ver médicos vinculados
            id IN (SELECT doctor_id FROM secretary_doctor_links WHERE secretary_id = auth.uid())
            OR
            -- Ver Admins e Donos
            role IN ('admin', 'dono')
        )
    );
