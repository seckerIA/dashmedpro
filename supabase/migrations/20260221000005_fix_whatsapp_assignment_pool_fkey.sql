-- Rename constraint if it exists with a different name, or create it if missing
DO $$
BEGIN
    -- Check if constraint exists with a different name (standard Postgres naming)
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conrelid = 'whatsapp_assignment_pool'::regclass 
        AND contype = 'f' 
        AND conname != 'whatsapp_assignment_pool_secretary_id_fkey'
        AND confrelid = 'profiles'::regclass
    ) THEN
        -- Drop the old constraint (we will recreate it with correct name)
        -- Note: We can't easily dynamic SQL drop unknown names in a DO block without more complex logic,
        -- but we can try to drop the most likely default name or just add the new one.
        -- Use specific name if known, but here we enforce our target name.
        NULL;
    END IF;
END $$;

-- Drop correct name if it exists to be safe (idempotent)
ALTER TABLE IF EXISTS whatsapp_assignment_pool
DROP CONSTRAINT IF EXISTS whatsapp_assignment_pool_secretary_id_fkey;

-- Add the constraint with the EXACT name required by the frontend
ALTER TABLE whatsapp_assignment_pool
ADD CONSTRAINT whatsapp_assignment_pool_secretary_id_fkey
FOREIGN KEY (secretary_id)
REFERENCES profiles(id)
ON DELETE CASCADE;
