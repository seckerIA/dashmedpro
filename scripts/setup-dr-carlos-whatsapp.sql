-- =====================================================
-- CONFIGURAR WHATSAPP PARA DR. CARLOS
-- Execute após criar o usuário e os dados de demonstração
-- =====================================================

DO $$
DECLARE
    v_dr_carlos_id UUID;
BEGIN
    -- Buscar ID do Dr. Carlos
    SELECT id INTO v_dr_carlos_id 
    FROM auth.users 
    WHERE email = 'dr.carlos@dashmedpro.com';
    
    IF v_dr_carlos_id IS NULL THEN
        RAISE EXCEPTION 'Dr. Carlos não encontrado. Crie o usuário primeiro!';
    END IF;
    
    -- Criar configuração de WhatsApp
    -- NOTA: Para funcionar de verdade, você precisa preencher com dados reais do Meta Business
    INSERT INTO public.whatsapp_config (
        user_id, 
        phone_number_id, 
        business_account_id, 
        waba_id, 
        display_phone_number, 
        verified_name, 
        webhook_verify_token,
        is_active
    ) VALUES (
        v_dr_carlos_id,
        'DEMO_PHONE_NUMBER_ID',  -- Substitua pelo ID real quando configurar
        'DEMO_BUSINESS_ACCOUNT', -- Substitua pelo ID real quando configurar
        'DEMO_WABA_ID',          -- Substitua pelo ID real quando configurar
        '+5511999999999',        -- Número de demonstração
        'Clínica Dr. Carlos',    -- Nome verificado
        'demo_token_' || substr(md5(random()::text), 1, 16),
        true  -- Ativar para que as conversas apareçam
    )
    ON CONFLICT (user_id) DO UPDATE SET
        is_active = true,
        display_phone_number = '+5511999999999',
        verified_name = 'Clínica Dr. Carlos';
    
    RAISE NOTICE '✅ Configuração de WhatsApp criada para Dr. Carlos!';
    RAISE NOTICE '';
    RAISE NOTICE 'IMPORTANTE: Para integração real com WhatsApp, você deve:';
    RAISE NOTICE '1. Criar uma conta no Meta Business';
    RAISE NOTICE '2. Configurar o WhatsApp Business API';
    RAISE NOTICE '3. Atualizar os campos phone_number_id, business_account_id e waba_id';
    RAISE NOTICE '';
    RAISE NOTICE 'Por enquanto, as conversas de demonstração estarão visíveis.';
    
END $$;

-- Verificar configuração
SELECT 
    u.email,
    wc.display_phone_number,
    wc.verified_name,
    wc.is_active,
    (SELECT COUNT(*) FROM whatsapp_conversations WHERE user_id = wc.user_id) as total_conversations
FROM whatsapp_config wc
JOIN auth.users u ON u.id = wc.user_id
WHERE u.email = 'dr.carlos@dashmedpro.com';
