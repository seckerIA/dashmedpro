import type { CRMDealWithContact } from "@/types/crm";

/** Apenas dígitos para comparar telefone (deduplicação). */
export function normalizeCrmPhoneDigits(phone: string | null | undefined): string {
  if (!phone) return "";
  return phone.replace(/\D/g, "");
}

export function normalizeLeadNameKey(name: string | null | undefined): string {
  return (name ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/**
 * Detecta placeholders de teste / QA / imports inválidos no card ou contato.
 */
export function isGarbagePlaceholderLead(deal: CRMDealWithContact): boolean {
  const parts = [
    deal.title,
    deal.contact?.full_name,
    deal.contact?.phone,
    deal.contact?.email,
    deal.description,
  ]
    .filter(Boolean)
    .join(" ");

  const lower = parts.toLowerCase();

  const regexes = [
    /dummy\s*data/i,
    /<\s*test\s*lead/i,
    /test\s*lead/i,
    /\[<\s*test/i,
    /full_name\s*\]/i,
    /\bplaceholder\b/i,
    /\bfull_name\b.*dummy/i,
    /^lorem\b/i,
    /fake[\w.-]*@\w/i,
    /example\.com/i,
    /test_run/i,
    /_qa\b/i,
    /patient_flow\d/i,
  ];

  return regexes.some((r) => r.test(lower));
}

/**
 * IDs de negócios em `lead_novo` que devem ser removidos:
 * — placeholders / teste;
 * — duplicados: mesmo telefone (só dígitos) e mesmo nome (normalizado), mantém o mais antigo (`created_at`).
 */
export function collectLeadNovoGarbageAndDuplicateDealIds(deals: CRMDealWithContact[]): string[] {
  const leadNovo = deals.filter((d) => d.stage === "lead_novo");
  const toDelete = new Set<string>();

  for (const d of leadNovo) {
    if (isGarbagePlaceholderLead(d)) {
      toDelete.add(d.id);
    }
  }

  const groups = new Map<string, CRMDealWithContact[]>();
  for (const d of leadNovo) {
    const phone = normalizeCrmPhoneDigits(d.contact?.phone);
    const name = normalizeLeadNameKey(d.contact?.full_name || d.title);
    if (!phone || !name) continue;
    const key = `${phone}|${name}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(d);
  }

  for (const list of groups.values()) {
    if (list.length < 2) continue;
    const sorted = [...list].sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return ta - tb;
    });
    for (let i = 1; i < sorted.length; i++) {
      toDelete.add(sorted[i].id);
    }
  }

  return [...toDelete];
}
