-- Intent de 20250111000001_add_final_counters (corrida após prospecting_daily_reports existir).

ALTER TABLE public.prospecting_daily_reports
  ADD COLUMN IF NOT EXISTS final_calls INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS final_contacts INTEGER DEFAULT NULL;

COMMENT ON COLUMN public.prospecting_daily_reports.final_calls IS 'Número final de atendimentos quando o expediente foi finalizado';
COMMENT ON COLUMN public.prospecting_daily_reports.final_contacts IS 'Número final de contatos quando o expediente foi finalizado';
