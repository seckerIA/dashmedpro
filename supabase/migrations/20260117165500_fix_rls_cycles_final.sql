-- Atualizar policies de secretary_doctor_links para usar get_user_role() e evitar ciclos

-- 1. Admin
DROP POLICY IF EXISTS "Admins can manage all links" ON secretary_doctor_links;
CREATE POLICY "Admins can manage all links" ON secretary_doctor_links
    FOR ALL USING (
        get_user_role(auth.uid()) IN ('admin', 'dono')
    );

-- 2. Doctor (Limitando ao próprio médico por segurança)
DROP POLICY IF EXISTS "Doctors can manage links" ON secretary_doctor_links;
CREATE POLICY "Doctors can manage own links" ON secretary_doctor_links
    FOR ALL USING (
        get_user_role(auth.uid()) = 'medico'
        AND doctor_id = auth.uid()
    );

-- 3. Secretaria
DROP POLICY IF EXISTS "Secretaries can view linked doctors data" ON secretary_doctor_links;
CREATE POLICY "Secretaries can view own links" ON secretary_doctor_links
    FOR SELECT USING (
        get_user_role(auth.uid()) = 'secretaria' 
        AND secretary_id = auth.uid()
    );

-- Restaurar (e corrigir) a policy da Secretária em PROFILES
DROP POLICY IF EXISTS "Secretaria can view linked doctors and admins" ON profiles;
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
