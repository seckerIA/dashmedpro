-- Permissões para Secretária editar Configuração de IA dos Médicos

-- 1. Política de SELECT (Ver a config do médico)
CREATE POLICY "Secretaries can view linked doctors AI config"
ON public.whatsapp_ai_config FOR SELECT
USING (
  auth.uid() = user_id -- O próprio médico
  OR 
  EXISTS ( -- Ou uma secretária vinculada
    SELECT 1 FROM public.secretary_doctor_links
    WHERE secretary_id = auth.uid()
    AND doctor_id = public.whatsapp_ai_config.user_id
  )
);

-- 2. Política de UPDATE (Editar a config do médico)
CREATE POLICY "Secretaries can update linked doctors AI config"
ON public.whatsapp_ai_config FOR UPDATE
USING (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM public.secretary_doctor_links
    WHERE secretary_id = auth.uid()
    AND doctor_id = public.whatsapp_ai_config.user_id
  )
);

-- 3. Política de INSERT (Criar config para o médico se não existir)
CREATE POLICY "Secretaries can insert linked doctors AI config"
ON public.whatsapp_ai_config FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM public.secretary_doctor_links
    WHERE secretary_id = auth.uid()
    AND doctor_id = public.whatsapp_ai_config.user_id
  )
);
