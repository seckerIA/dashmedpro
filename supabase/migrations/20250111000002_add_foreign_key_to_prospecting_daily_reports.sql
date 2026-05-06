-- FK opcional profiles vs auth.users na versão atual do schema completa.
-- Conflitaria se user_id já tiver FK; mantido apenas como histórico.
DO $$
BEGIN
  IF to_regclass('public.prospecting_daily_reports') IS NULL THEN
    RAISE NOTICE '20250111000002: omitido.';
  ELSE
    RAISE NOTICE '20250111000002: ignorado por defeito — complete_database_schema já define user_id.';
  END IF;
END $$;
