// Configuração da Cortana - Assistente de Voz IA

export const CORTANA_CONFIG = {
  // Agent ID do ElevenLabs - Será configurado pelo usuário
  agentId: import.meta.env.VITE_ELEVENLABS_AGENT_ID || '',

  // API Key opcional (para signed URLs)
  apiKey: import.meta.env.VITE_ELEVENLABS_API_KEY || '',

  // Configurações de conexão
  serverLocation: 'us' as const, // 'us' | 'eu-residency' | 'in-residency' | 'global'

  // Hotkey para ativar a Cortana
  hotkey: {
    key: 'c',
    ctrlKey: true,
    shiftKey: true,
  },

  // Timeouts
  connectionTimeout: 30000, // 30 segundos

  // UI
  buttonPosition: 'bottom-right' as const,
  showTranscript: true,

  // Permissões por role
  rolePermissions: {
    admin: ['*'], // Todas as ações
    dono: ['*'],
    medico: [
      'getAgenda',
      'getPatientInfo',
      'getDashboardMetrics',
      'searchDeals',
      'createAppointment',
      'cancelAppointment',
      'rescheduleAppointment',
      'markAppointmentCompleted',
      'createMedicalRecord',
      'updateMedicalRecord',
      'getPatientHistory',
      'navigateTo',
      'getTodayTasks',
      'createTask',
      'completeTask',
    ],
    secretaria: [
      'getAgenda',
      'getPatientInfo',
      'searchDeals',
      'createAppointment',
      'cancelAppointment',
      'rescheduleAppointment',
      'createPatient',
      'updatePatient',
      'sendWhatsAppMessage',
      'navigateTo',
      'getTodayTasks',
      'createTask',
      'completeTask',
    ],
    vendedor: [
      'getPatientInfo',
      'getDashboardMetrics',
      'searchDeals',
      'createDeal',
      'moveDealToStage',
      'createPatient',
      'addFollowUp',
      'sendWhatsAppMessage',
      'navigateTo',
      'getTodayTasks',
      'createTask',
      'completeTask',
    ],
    gestor_trafego: [
      'getDashboardMetrics',
      'searchDeals',
      'getPipelineStats',
      'navigateTo',
    ],
  } as Record<string, string[]>,

  // Mapeamento de páginas para rotas
  pageRoutes: {
    dashboard: '/',
    calendar: '/calendar',
    crm: '/crm',
    pipeline: '/pipeline',
    whatsapp: '/whatsapp',
    financial: '/financial',
    'medical-records': '/medical-records',
    team: '/team',
    settings: '/settings',
  } as Record<string, string>,
};

// Verifica se a Cortana está configurada
export const isCortanaConfigured = (): boolean => {
  return Boolean(CORTANA_CONFIG.agentId);
};

// Verifica se uma ação é permitida para um role
export const isActionAllowed = (role: string, action: string): boolean => {
  const permissions = CORTANA_CONFIG.rolePermissions[role] || [];
  return permissions.includes('*') || permissions.includes(action);
};
