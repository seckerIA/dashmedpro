-- =====================================================
-- CRIAR MÉDICO DR. CARLOS E VINCULAR À SECRETÁRIA
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Passo 1: Criar o usuário no Supabase Auth (via dashboard ou convite)
-- Você pode criar manualmente em Authentication > Users > Add User
-- Email: dr.carlos@dashmedpro.com
-- Password: (defina uma senha)

-- Passo 2: Após criar o usuário, pegue o ID dele e substitua abaixo:
-- (O ID aparecerá na tabela Auth > Users após criar)

DO $$
DECLARE
    v_dr_carlos_id UUID;
    v_secretary_id UUID := '49704dd5-01ab-4cfe-8854-07799641a1f0'; -- ID da secretária (você)
BEGIN
    -- Verificar se o médico já existe pelo email
    SELECT id INTO v_dr_carlos_id 
    FROM auth.users 
    WHERE email = 'dr.carlos@dashmedpro.com';
    
    -- Se não existir, precisamos criar primeiro via Auth UI
    IF v_dr_carlos_id IS NULL THEN
        RAISE NOTICE 'Usuário dr.carlos@dashmedpro.com não encontrado no Auth.';
        RAISE NOTICE 'Por favor, crie o usuário primeiro em Authentication > Users > Add User';
        RAISE NOTICE 'Depois execute este script novamente.';
        RETURN;
    END IF;
    
    -- Atualizar ou inserir o profile
    INSERT INTO public.profiles (id, email, full_name, role, is_active)
    VALUES (
        v_dr_carlos_id,
        'dr.carlos@dashmedpro.com',
        'Dr. Carlos',
        'medico',
        true
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = 'Dr. Carlos',
        role = 'medico',
        is_active = true;
    
    RAISE NOTICE 'Profile do Dr. Carlos criado/atualizado com ID: %', v_dr_carlos_id;
    
    -- Criar link com a secretária
    INSERT INTO public.secretary_doctor_links (secretary_id, doctor_id, is_active)
    VALUES (v_secretary_id, v_dr_carlos_id, true)
    ON CONFLICT (secretary_id, doctor_id) DO UPDATE SET is_active = true;
    
    RAISE NOTICE 'Link secretária-médico criado: % -> %', v_secretary_id, v_dr_carlos_id;
    
    -- Criar configuração de IA padrão para o Dr. Carlos
    INSERT INTO public.whatsapp_ai_config (user_id, auto_reply_enabled, knowledge_base)
    VALUES (
        v_dr_carlos_id,
        false, -- Começa com auto-reply desativado
        'Clínica do Dr. Carlos. Especialista em medicina geral.'
    )
    ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Configuração de IA criada para Dr. Carlos';
    RAISE NOTICE '✅ Dr. Carlos configurado com sucesso!';
END $$;

-- Verificar resultado
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    CASE WHEN sdl.id IS NOT NULL THEN 'Vinculado' ELSE 'Não vinculado' END as link_status
FROM profiles p
LEFT JOIN secretary_doctor_links sdl ON sdl.doctor_id = p.id 
    AND sdl.secretary_id = '49704dd5-01ab-4cfe-8854-07799641a1f0'
WHERE p.role = 'medico';
