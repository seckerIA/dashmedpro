-- Tabela meta_oauth_sessions e políticas RLS: 20260204000001_meta_business_integration.sql.
-- Permissão extra para o app autenticado chamar a limpeza de sessões.

GRANT EXECUTE ON FUNCTION public.cleanup_expired_meta_oauth_sessions() TO authenticated;
