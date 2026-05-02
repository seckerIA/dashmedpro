/** Mensagem legível a partir de erro Supabase/PostgREST ou Error genérico */
export function getSupabaseErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    const parts = [o.message, o.details, o.hint].filter(
      (x): x is string => typeof x === "string" && x.length > 0
    );
    if (parts.length) return parts.join(" — ");
  }
  return fallback;
}
