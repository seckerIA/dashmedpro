/** Erro PostgREST/Postgres típico ao pedir coluna inexistente no OpenAPI/schema cache */
export function isProfilesSchemaMismatchError(error: { code?: string; message?: string; details?: string } | null): boolean {
  if (!error) return false;
  const code = String(error.code ?? '');
  if (code === '42703' || code === 'PGRST204' || code === 'PGRST202') return true;
  const m = `${error.message ?? ''} ${error.details ?? ''}`.toLowerCase();
  return (
    m.includes('does not exist') ||
    (m.includes('column') && m.includes('profiles')) ||
    m.includes('schema cache') ||
    m.includes('could not find') ||
    m.includes('unknown')
  );
}
