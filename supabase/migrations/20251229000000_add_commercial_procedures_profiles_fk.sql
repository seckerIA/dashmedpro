-- Adicionar foreign key de commercial_procedures.user_id para profiles.id
-- Isso permite fazer joins com a tabela profiles para obter dados do médico

-- Primeiro, verificar se já existe a constraint (para evitar erro se rodar novamente)
DO $$
BEGIN
  -- Só adiciona se não existir
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commercial_procedures_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.commercial_procedures
      ADD CONSTRAINT commercial_procedures_user_id_profiles_fk
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Também adicionar FK para outras tabelas comerciais que usam user_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commercial_leads_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.commercial_leads
      ADD CONSTRAINT commercial_leads_user_id_profiles_fk
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commercial_sales_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.commercial_sales
      ADD CONSTRAINT commercial_sales_user_id_profiles_fk
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'commercial_campaigns_user_id_profiles_fk'
  ) THEN
    ALTER TABLE public.commercial_campaigns
      ADD CONSTRAINT commercial_campaigns_user_id_profiles_fk
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;
