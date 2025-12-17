-- =====================================================
-- CRIAR/ATUALIZAR USUÁRIO ADMIN
-- =====================================================
-- Email: gustavosantosbbs@gmail.com
-- Nome: gustavo
-- Senha: 123456789
-- Role: admin
-- =====================================================

-- IMPORTANTE: 
-- No Supabase, usuários devem ser criados via Dashboard ou API Admin.
-- Este script atualiza o perfil para admin APÓS o usuário ser criado.
--
-- PASSO 1: Criar usuário via Dashboard
-- 1. Acesse: https://supabase.com/dashboard/project/[project-ref]/auth/users
-- 2. Clique em "Add User"
-- 3. Email: gustavosantosbbs@gmail.com
-- 4. Password: 123456789
-- 5. Marque "Auto Confirm User"
-- 6. Clique em "Create User"
--
-- PASSO 2: Execute este script para definir role como admin

-- Atualizar ou criar perfil com role admin
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Buscar o ID do usuário pelo email
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = 'gustavosantosbbs@gmail.com';

    -- Se o usuário existe, criar/atualizar o perfil
    IF v_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (
            id,
            email,
            full_name,
            role,
            is_active,
            created_at,
            updated_at
        )
        VALUES (
            v_user_id,
            'gustavosantosbbs@gmail.com',
            'gustavo',
            'admin'::user_role,
            true,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET
            role = 'admin'::user_role,
            full_name = 'gustavo',
            is_active = true,
            updated_at = NOW();
        
        RAISE NOTICE '✅ Perfil admin criado/atualizado para: gustavosantosbbs@gmail.com';
        RAISE NOTICE '   Role: admin';
        RAISE NOTICE '   Nome: gustavo';
    ELSE
        RAISE WARNING '❌ Usuário não encontrado!';
        RAISE NOTICE '';
        RAISE NOTICE '📋 INSTRUÇÕES:';
        RAISE NOTICE '1. Acesse: Supabase Dashboard > Authentication > Users';
        RAISE NOTICE '2. Clique em "Add User"';
        RAISE NOTICE '3. Email: gustavosantosbbs@gmail.com';
        RAISE NOTICE '4. Password: 123456789';
        RAISE NOTICE '5. Marque "Auto Confirm User"';
        RAISE NOTICE '6. Clique em "Create User"';
        RAISE NOTICE '7. Execute este script novamente';
    END IF;
END $$;

-- Verificar resultado
SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    p.is_active,
    u.email_confirmed_at IS NOT NULL as email_confirmed
FROM public.profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.email = 'gustavosantosbbs@gmail.com';

