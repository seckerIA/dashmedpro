/** Substrings enviadas por leads de teste (ex.: Meta sandbox) — poluem busca de pacientes. */
const PLACEHOLDER_SUBSTRINGS = ['<test lead', 'dummy data for'] as const;

export function isPlaceholderCrmContact(row: {
  full_name?: string | null;
  phone?: string | null;
  email?: string | null;
}): boolean {
  const hay = [row.full_name, row.phone, row.email]
    .filter((s): s is string => !!s && String(s).length > 0)
    .join('\n')
    .toLowerCase();
  if (!hay) return false;
  return PLACEHOLDER_SUBSTRINGS.some((s) => hay.includes(s.toLowerCase()));
}

/** Aplica filtros PostgREST para excluir placeholders. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function excludePlaceholderContactsQuery(query: any): any {
  let q = query;
  for (const p of PLACEHOLDER_SUBSTRINGS) {
    q = q.not('full_name', 'ilike', `%${p}%`);
    q = q.not('phone', 'ilike', `%${p}%`);
    q = q.not('email', 'ilike', `%${p}%`);
  }
  return q;
}
