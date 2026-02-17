import { CRMContact } from '@/types/crm';

/**
 * Obtém o serviço de um contato CRM.
 * Verifica primeiro em custom_fields.procedure_id, depois em service (se existir).
 * 
 * @param contact - O contato CRM ou null/undefined
 * @returns O ID do procedimento/serviço ou null se não encontrado
 */
export function getContactService(contact: CRMContact | null | undefined): string | null {
  if (!contact) return null;
  
  // Primeiro tenta obter de custom_fields.procedure_id
  const customFields = (contact as any).custom_fields as any;
  if (customFields?.procedure_id) {
    return customFields.procedure_id;
  }
  
  // Fallback para service direto (se existir no futuro)
  return (contact as any).service || null;
}

