-- Update user role to admin and name to Filipe for filipesenna59@gmail.com
-- This script detects the database structure and updates accordingly
DO $$
DECLARE
    user_id_val UUID;
    has_role_column BOOLEAN;
    has_user_roles_table BOOLEAN;
    profile_exists BOOLEAN;
BEGIN
    -- Find the user ID from auth.users
    SELECT id INTO user_id_val
    FROM auth.users
    WHERE email = 'filipesenna59@gmail.com';
    
    IF user_id_val IS NULL THEN
        RAISE EXCEPTION 'User with email filipesenna59@gmail.com not found in auth.users';
    END IF;
    
    -- Check if role column exists in profiles table
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'role'
    ) INTO has_role_column;
    
    -- Check if user_roles table exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user_roles'
    ) INTO has_user_roles_table;
    
    -- Check if profile exists
    SELECT EXISTS (
        SELECT 1 FROM public.profiles WHERE id = user_id_val
    ) INTO profile_exists;
    
    -- Create profile if it doesn't exist
    IF NOT profile_exists THEN
        IF has_role_column THEN
            INSERT INTO public.profiles (id, email, role, full_name, is_active, created_at, updated_at)
            VALUES (user_id_val, 'filipesenna59@gmail.com', 'admin', 'Filipe', true, NOW(), NOW());
        ELSE
            INSERT INTO public.profiles (id, email, full_name, is_active, created_at, updated_at)
            VALUES (user_id_val, 'filipesenna59@gmail.com', 'Filipe', true, NOW(), NOW());
        END IF;
    ELSE
        -- Update profile name
        UPDATE public.profiles
        SET full_name = 'Filipe',
            updated_at = NOW()
        WHERE id = user_id_val;
        
        -- Update role based on structure
        IF has_role_column THEN
            UPDATE public.profiles
            SET role = 'admin',
                updated_at = NOW()
            WHERE id = user_id_val;
        END IF;
    END IF;
    
    -- If user_roles table exists, also update/insert there
    IF has_user_roles_table THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (user_id_val, 'admin'::app_role)
        ON CONFLICT (user_id, role) DO UPDATE 
        SET role = 'admin'::app_role;
    END IF;
    
    RAISE NOTICE 'Profile updated successfully for user: % (role column: %, user_roles table: %)', 
        user_id_val, has_role_column, has_user_roles_table;
END $$;

-- Verify the update
SELECT 
    p.id, 
    p.email, 
    p.role, 
    p.full_name, 
    p.is_active,
    u.email as auth_email,
    (SELECT role FROM public.user_roles WHERE user_id = p.id LIMIT 1) as role_from_user_roles
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE p.email = 'filipesenna59@gmail.com' OR u.email = 'filipesenna59@gmail.com';









