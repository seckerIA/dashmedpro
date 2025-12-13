-- Adicionar colunas para contadores finais no relatório diário
ALTER TABLE prospecting_daily_reports 
ADD COLUMN final_calls INTEGER DEFAULT NULL,
ADD COLUMN final_contacts INTEGER DEFAULT NULL;

-- Comentários para documentação
COMMENT ON COLUMN prospecting_daily_reports.final_calls IS 'Número final de atendimentos quando o expediente foi finalizado';
COMMENT ON COLUMN prospecting_daily_reports.final_contacts IS 'Número final de contatos quando o expediente foi finalizado';
