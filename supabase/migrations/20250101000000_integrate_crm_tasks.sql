-- Integração CRM + Tarefas
-- Esta migration vinha antes (timestamp) das que criam public.tasks — em DB novo falhava com 42P01.
-- Só altera quando a tabela já existir (reexecutável / idempotente).

DO $$
BEGIN
  IF to_regclass('public.tasks') IS NULL THEN
    RAISE NOTICE 'integrate_crm_tasks: public.tasks ainda não existe; será aplicado quando tasks existir (re-push ou já coberto por migrações posteriores).';
    RETURN;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'deal_id'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_tasks_deal_id') THEN
    EXECUTE 'CREATE INDEX idx_tasks_deal_id ON public.tasks (deal_id)';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'idx_tasks_contact_id') THEN
    EXECUTE 'CREATE INDEX idx_tasks_contact_id ON public.tasks (contact_id)';
  END IF;

  COMMENT ON COLUMN public.tasks.deal_id IS 'ID do deal relacionado (opcional)';
  COMMENT ON COLUMN public.tasks.contact_id IS 'ID do contato relacionado (opcional)';
END $$;
