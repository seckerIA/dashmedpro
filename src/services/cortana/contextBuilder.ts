// Context Builder - Monta contexto do usuário para a Cortana

import { CortanaContext } from '@/types/cortana';
import { CORTANA_CONFIG, isActionAllowed } from '@/config/cortana';

interface UserProfile {
  id: string;
  full_name?: string;
  email?: string;
  role?: string;
}

interface SecretaryDoctorLink {
  doctor_id: string;
}

/**
 * Constrói o contexto do usuário para a Cortana
 */
export function buildCortanaContext(
  user: { id: string } | null,
  profile: UserProfile | null,
  doctorLinks: SecretaryDoctorLink[] = [],
  organizationId?: string | null
): CortanaContext | null {
  if (!user || !profile) {
    return null;
  }

  const role = (profile.role || 'vendedor') as CortanaContext['userRole'];
  const doctorIds = doctorLinks.map(link => link.doctor_id);

  // Filtra ações permitidas para o role
  const allActions = [
    'getAgenda',
    'getPatientInfo',
    'getDashboardMetrics',
    'searchDeals',
    'getUpcomingAppointments',
    'getTodayTasks',
    'getFinancialBalance',
    'getPatientHistory',
    'getPipelineStats',
    'getWhatsAppConversations',
    'createAppointment',
    'rescheduleAppointment',
    'cancelAppointment',
    'markAppointmentCompleted',
    'markAppointmentNoShow',
    'createPatient',
    'updatePatient',
    'createDeal',
    'moveDealToStage',
    'addFollowUp',
    'createMedicalRecord',
    'updateMedicalRecord',
    'createTransaction',
    'getTransactions',
    'sendWhatsAppMessage',
    'analyzeConversation',
    'createTask',
    'completeTask',
    'navigateTo',
    'openModal',
    'closeModal',
    'showPatientDetails',
  ];

  const allowedActions = allActions.filter(action => isActionAllowed(role, action));

  return {
    userName: profile.full_name || profile.email || 'Usuário',
    userRole: role,
    userId: user.id,
    doctorIds: role === 'secretaria' ? doctorIds : undefined,
    organizationId,
    allowedActions,
  };
}

/**
 * Gera variáveis dinâmicas para o system prompt
 */
export function getDynamicOverrides(context: CortanaContext): Record<string, string> {
  const now = new Date();

  return {
    userName: context.userName,
    userRole: translateRole(context.userRole),
    currentDateTime: now.toLocaleString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }),
    currentDate: now.toLocaleDateString('pt-BR'),
    currentTime: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    // Instrução crítica para evitar repetições
    systemInstruction: "IMPORTANTE: Você é a Cortana, uma assistente eficiente. NÃO repita confirmações múltiplas vezes. Confirme o comando APENAS UMA VEZ e execute. Seja direta.",
  };
}

/**
 * Traduz o role para português
 */
function translateRole(role: string): string {
  const translations: Record<string, string> = {
    admin: 'Administrador',
    dono: 'Proprietário',
    medico: 'Médico',
    secretaria: 'Secretária',
    vendedor: 'Vendedor',
    gestor_trafego: 'Gestor de Tráfego',
  };

  return translations[role] || role;
}

/**
 * Formata data para exibição amigável
 */
export function formatDateForSpeech(date: Date): string {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const dateStr = date.toDateString();

  if (dateStr === today.toDateString()) {
    return 'hoje';
  }

  if (dateStr === tomorrow.toDateString()) {
    return 'amanhã';
  }

  // Dia da semana + data
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

/**
 * Formata hora para exibição amigável
 */
export function formatTimeForSpeech(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);

  if (minutes === 0) {
    return `${hours} horas`;
  }

  return `${hours} horas e ${minutes} minutos`;
}

/**
 * Parse de data a partir de texto em português
 */
export function parseDateFromSpeech(text: string): Date | null {
  const today = new Date();
  const lowerText = text.toLowerCase();

  if (lowerText.includes('hoje')) {
    return today;
  }

  if (lowerText.includes('amanhã')) {
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Tentar parsear data no formato DD/MM/YYYY ou DD de MES
  const dateMatch = lowerText.match(/(\d{1,2})\s*(?:\/|de)\s*(\d{1,2}|\w+)(?:\s*(?:\/|de)\s*(\d{4}))?/);

  if (dateMatch) {
    const day = parseInt(dateMatch[1]);
    let month: number;

    if (isNaN(parseInt(dateMatch[2]))) {
      // Nome do mês
      month = parseMonthName(dateMatch[2]);
    } else {
      month = parseInt(dateMatch[2]) - 1;
    }

    const year = dateMatch[3] ? parseInt(dateMatch[3]) : today.getFullYear();

    if (month >= 0 && day >= 1 && day <= 31) {
      return new Date(year, month, day);
    }
  }

  return null;
}

/**
 * Parse nome do mês em português
 */
function parseMonthName(name: string): number {
  const months: Record<string, number> = {
    janeiro: 0,
    fevereiro: 1,
    março: 2,
    marco: 2,
    abril: 3,
    maio: 4,
    junho: 5,
    julho: 6,
    agosto: 7,
    setembro: 8,
    outubro: 9,
    novembro: 10,
    dezembro: 11,
  };

  return months[name.toLowerCase()] ?? -1;
}
