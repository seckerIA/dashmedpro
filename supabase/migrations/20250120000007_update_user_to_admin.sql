-- Histórico: promovia um utilizador específico em auth.users.
-- Era 20250120000000_* (colidia com complete_database_schema no schema_migrations).
-- Num projeto novo esse email pode não existir — não pode falhar o db push.

DO $$
DECLARE
    user_id_val UUID;
    has_role_column BOOLEAN;
    has_user_roles_table BOOLEAN;
    profile_exists BOOLEAN;
    target_email CONSTANT text := 'filipesenna59@gmail.com';
BEGIN
    SELECT id INTO user_id_val
    FROM auth.users
    WHERE lower(email) = lower(target_email);

    IF user_id_val IS NULL THEN
        RAISE NOTICE '20250120000007_update_user_to_admin: omitido — % não existe em auth.users (crie no Dashboard ou rode scripts/bootstrap).',
            target_email;
        RETURN;
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'profiles'
          AND column_name = 'role'
    ) INTO has_role_column;

    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'user_roles'
    ) INTO has_user_roles_table;

    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id_val
    ) INTO profile_exists;

    IF NOT profile_exists THEN
        IF has_role_column THEN
            INSERT INTO public.profiles (id, email, role, full_name, is_active, created_at, updated_at)
            VALUES (user_id_val, target_email, 'admin', 'Filipe', true, NOW(), NOW());
        ELSE
            INSERT INTO public.profiles (id, email, full_name, is_active, created_at, updated_at)
            VALUES (user_id_val, target_email, 'Filipe', true, NOW(), NOW());
        END IF;
    ELSE
        UPDATE public.profiles
        SET full_name = 'Filipe',
            updated_at = NOW()
        WHERE id = user_id_val;

        IF has_role_column THEN
            UPDATE public.profiles
            SET role = 'admin',
                updated_at = NOW()
            WHERE id = user_id_val;
        END IF;
    END IF;

    IF has_user_roles_table THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id_val, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO UPDATE
        SET role = EXCLUDED.role;
    END IF;

    RAISE NOTICE 'Profile updated for % (id: %).',
        target_email, user_id_val;
END $$;
