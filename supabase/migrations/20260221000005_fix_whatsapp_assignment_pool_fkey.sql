-- FK secretary_id → profiles apenas se whatsapp_assignment_pool existir.

DO $$
BEGIN
  IF to_regclass('public.whatsapp_assignment_pool') IS NOT NULL THEN
    ALTER TABLE public.whatsapp_assignment_pool
      DROP CONSTRAINT IF EXISTS whatsapp_assignment_pool_secretary_id_fkey;

    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint c
      WHERE c.conrelid = 'public.whatsapp_assignment_pool'::regclass
        AND c.conname = 'whatsapp_assignment_pool_secretary_id_fkey'
    ) THEN
      ALTER TABLE public.whatsapp_assignment_pool
        ADD CONSTRAINT whatsapp_assignment_pool_secretary_id_fkey
        FOREIGN KEY (secretary_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;
