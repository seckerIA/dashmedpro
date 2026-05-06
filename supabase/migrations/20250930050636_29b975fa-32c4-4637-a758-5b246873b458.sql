DO $$
BEGIN
  CREATE TYPE public.task_category AS ENUM ('comercial', 'marketing', 'financeiro', 'social_media', 'empresarial');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS category public.task_category DEFAULT 'comercial';