/**
 * Translations for appointment types and procedure names
 * Maps database values to Portuguese display names
 */

// Appointment type translations
export const APPOINTMENT_TYPE_TRANSLATIONS: Record<string, string> = {
    // Common types
    'procedure': 'Procedimento',
    'first_visit': 'Primeira Consulta',
    'return': 'Retorno',
    'follow_up': 'Acompanhamento',
    'evaluation': 'Avaliação',
    'consultation': 'Consulta',
    'emergency': 'Emergência',
    'routine': 'Rotina',
    'checkup': 'Check-up',
    'surgery': 'Cirurgia',
    'exam': 'Exame',
    'other': 'Outros',

    // Alternative naming patterns
    'primera_consulta': 'Primeira Consulta',
    'retorno': 'Retorno',
    'procedimento': 'Procedimento',
    'avaliacao': 'Avaliação',
    'consulta': 'Consulta',
    'emergencia': 'Emergência',
    'exame': 'Exame',
    'cirurgia': 'Cirurgia',
    'acompanhamento': 'Acompanhamento',
};

// Lead status translations
export const LEAD_STATUS_TRANSLATIONS: Record<string, string> = {
    'new': 'Novo',
    'contacted': 'Contatado',
    'qualified': 'Qualificado',
    'proposal': 'Proposta',
    'negotiation': 'Negociação',
    'converted': 'Convertido',
    'lost': 'Perdido',
};

// Stage translations for funnel
export const FUNNEL_STAGE_TRANSLATIONS: Record<string, string> = {
    'Leads': 'Leads',
    'Consultas': 'Consultas',
    'Vendas': 'Vendas',
    'leads': 'Leads',
    'appointments': 'Consultas',
    'sales': 'Vendas',
};

/**
 * Translates an appointment type to Portuguese
 * @param type The appointment type from database
 * @returns Translated name in Portuguese
 */
export function translateAppointmentType(type: string | null | undefined): string {
    if (!type) return 'Outros';

    // Check direct translation
    const directTranslation = APPOINTMENT_TYPE_TRANSLATIONS[type.toLowerCase()];
    if (directTranslation) return directTranslation;

    // Try with underscores replaced by spaces and capitalize
    const formatted = type
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

    return formatted;
}

/**
 * Translates a lead status to Portuguese
 * @param status The lead status from database
 * @returns Translated status in Portuguese
 */
export function translateLeadStatus(status: string | null | undefined): string {
    if (!status) return 'Desconhecido';
    return LEAD_STATUS_TRANSLATIONS[status.toLowerCase()] || status;
}

/**
 * Translates a funnel stage to Portuguese
 * @param stage The stage name
 * @returns Translated stage in Portuguese
 */
export function translateFunnelStage(stage: string | null | undefined): string {
    if (!stage) return stage || '';
    return FUNNEL_STAGE_TRANSLATIONS[stage] || stage;
}
