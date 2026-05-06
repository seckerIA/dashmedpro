-- user_role (complete_database_schema) não incluía secretaria/medico.
-- ADD VALUE na mesma transação que CREATE POLICY com 'medico' causa 55P04 — ficheiro dedicado.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_enum e
    INNER JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    INNER JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role' AND e.enumlabel = 'secretaria'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'secretaria';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_catalog.pg_enum e
    INNER JOIN pg_catalog.pg_type t ON t.oid = e.enumtypid
    INNER JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'user_role' AND e.enumlabel = 'medico'
  ) THEN
    ALTER TYPE public.user_role ADD VALUE 'medico';
  END IF;
END $$;
