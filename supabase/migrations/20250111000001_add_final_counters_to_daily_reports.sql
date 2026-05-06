-- Contadores finais em prospecting_daily_reports.
-- Esta migration vinha antes da tabela (20250120000000). Efeito em 20250120000006.
DO $$
BEGIN
  IF to_regclass('public.prospecting_daily_reports') IS NULL THEN
    RAISE NOTICE '20250111000001: omitido (prospecting_daily_reports inexistente).';
  END IF;
END $$;
