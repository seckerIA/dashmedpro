DO $$
BEGIN
    -- Adicionar FK para permitir join no PostgREST
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'financial_accounts_user_id_fkey_profiles' 
        AND table_name = 'financial_accounts'
    ) THEN
        ALTER TABLE financial_accounts
        ADD CONSTRAINT financial_accounts_user_id_fkey_profiles
        FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;
END $$;
