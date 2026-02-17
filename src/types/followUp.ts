import { Database } from '@/integrations/supabase/types';

// =====================================================
// LEGACY TYPES (CRM Follow-ups - manter compatibilidade)
// =====================================================

export interface FollowUp {
  id: string;
  deal_id: string;
  user_id: string;
  scheduled_date: string;
  scheduled_time: string;
  type: string;
  notes: string | null;
  description: string | null;
  status: string | null;
  completed: boolean;
  completed_at: string | null;
  completed_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFollowUpData {
  deal_id: string;
  scheduled_date: string;
  notes?: string;
}

export interface UpdateFollowUpData {
  scheduled_date?: string;
  notes?: string;
  completed?: boolean;
  status?: string;
  completed_notes?: string;
}

// =====================================================
// NEW AUTOMATED FOLLOW-UP SYSTEM
// =====================================================

// Enum types from database
export type FollowUpTriggerType = string;
export type FollowUpChannel = string;
export type FollowUpStatus = string;
export type FollowUpSentiment = string;

// Table types - using any to bypass outdated generated types
export type FollowUpTemplate = any;
export type FollowUpTemplateInsert = any;
export type FollowUpTemplateUpdate = any;

export type FollowUpScheduled = any;
export type FollowUpScheduledInsert = any;
export type FollowUpScheduledUpdate = any;

export type FollowUpResponse = any;
export type FollowUpResponseInsert = any;
export type FollowUpResponseUpdate = any;

export type FollowUpMetrics = any;

// Extended types with relations
export interface FollowUpScheduledWithRelations extends FollowUpScheduled {
  template?: FollowUpTemplate;
  contact?: {
    id: string;
    full_name: string;
    phone: string;
    email?: string;
  };
  appointment?: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
  };
  response?: FollowUpResponse;
}

export interface FollowUpResponseWithRelations extends FollowUpResponse {
  followup?: FollowUpScheduledWithRelations;
  contact?: {
    id: string;
    full_name: string;
    phone: string;
  };
}

// NPS calculation result
export interface NPSCalculation {
  nps_score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total_responses: number;
}

// Dashboard metrics
export interface FollowUpDashboardMetrics {
  nps: NPSCalculation;
  csat_average: number;
  total_sent: number;
  total_responded: number;
  response_rate: number;
  pending_count: number;
  recent_responses: FollowUpResponseWithRelations[];
}

// Template variable context
export interface TemplateContext {
  patient_name: string;
  doctor_name: string;
  appointment_date?: string;
  appointment_time?: string;
  procedure_name?: string;
  clinic_name?: string;
  [key: string]: string | undefined;
}

// =====================================================
// CONSTANTS
// =====================================================

// Trigger type labels
export const TRIGGER_TYPE_LABELS: Record<FollowUpTriggerType, string> = {
  pre_appointment: 'Pré-Consulta',
  post_appointment_immediate: 'Pós-Consulta (Imediato)',
  post_appointment_7d: 'Pós-Consulta (7 dias)',
  post_appointment_30d: 'Pós-Consulta (30 dias)',
  post_treatment: 'Pós-Tratamento',
  payment_reminder: 'Lembrete de Pagamento',
  inactive_patient: 'Paciente Inativo',
  birthday: 'Aniversário',
  custom: 'Personalizado'
};

// Channel labels and icons
export const CHANNEL_CONFIG: Record<FollowUpChannel, { label: string; icon: string; color: string }> = {
  whatsapp: { label: 'WhatsApp', icon: 'MessageCircle', color: 'text-green-600' },
  sms: { label: 'SMS', icon: 'MessageSquare', color: 'text-blue-600' },
  email: { label: 'E-mail', icon: 'Mail', color: 'text-purple-600' },
  call: { label: 'Ligação', icon: 'Phone', color: 'text-orange-600' }
};

// Status labels and colors
export const STATUS_CONFIG: Record<FollowUpStatus, { label: string; color: string; icon: string }> = {
  pending: { label: 'Pendente', color: 'text-yellow-600 bg-yellow-50', icon: 'Clock' },
  sent: { label: 'Enviado', color: 'text-blue-600 bg-blue-50', icon: 'Send' },
  responded: { label: 'Respondido', color: 'text-green-600 bg-green-50', icon: 'CheckCircle' },
  failed: { label: 'Falhou', color: 'text-red-600 bg-red-50', icon: 'XCircle' },
  cancelled: { label: 'Cancelado', color: 'text-gray-600 bg-gray-50', icon: 'Ban' }
};

// Sentiment config
export const SENTIMENT_CONFIG: Record<FollowUpSentiment, { label: string; color: string; emoji: string }> = {
  positive: { label: 'Positivo', color: 'text-green-600 bg-green-50', emoji: '😊' },
  neutral: { label: 'Neutro', color: 'text-yellow-600 bg-yellow-50', emoji: '😐' },
  negative: { label: 'Negativo', color: 'text-red-600 bg-red-50', emoji: '😞' }
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

// NPS category helper
export function getNPSCategory(score: number): 'promoter' | 'passive' | 'detractor' {
  if (score >= 9) return 'promoter';
  if (score >= 7) return 'passive';
  return 'detractor';
}

// NPS individual score color
export function getNPSColor(score: number): string {
  if (score >= 9) return 'text-green-600';
  if (score >= 7) return 'text-yellow-600';
  return 'text-red-600';
}

// NPS overall score color
export function getNPSScoreColor(npsScore: number): string {
  if (npsScore >= 50) return 'text-green-600';
  if (npsScore >= 0) return 'text-yellow-600';
  return 'text-red-600';
}

// NPS label
export function getNPSLabel(npsScore: number): string {
  if (npsScore >= 75) return 'Excelente';
  if (npsScore >= 50) return 'Muito Bom';
  if (npsScore >= 0) return 'Razoável';
  if (npsScore >= -50) return 'Ruim';
  return 'Crítico';
}

// Template variable regex
export const TEMPLATE_VARIABLE_REGEX = /\{\{([a-z_]+)\}\}/g;

// Extract variables from template
export function extractTemplateVariables(template: string): string[] {
  const matches = template.matchAll(TEMPLATE_VARIABLE_REGEX);
  return Array.from(matches, m => m[1]);
}

// Render template with context
export function renderTemplate(template: string, context: TemplateContext): string {
  return template.replace(TEMPLATE_VARIABLE_REGEX, (match, variable) => {
    return context[variable] || match;
  });
}

// Delay helpers
export function minutesToHours(minutes: number): number {
  return Math.floor(minutes / 60);
}

export function minutesToDays(minutes: number): number {
  return Math.floor(minutes / 1440);
}

export function formatDelay(minutes: number): string {
  if (minutes < 0) {
    const absMinutes = Math.abs(minutes);
    if (absMinutes < 60) return `${absMinutes} min antes`;
    if (absMinutes < 1440) return `${minutesToHours(absMinutes)}h antes`;
    return `${minutesToDays(absMinutes)} dias antes`;
  }

  if (minutes < 60) return `${minutes} min depois`;
  if (minutes < 1440) return `${minutesToHours(minutes)}h depois`;
  return `${minutesToDays(minutes)} dias depois`;
}

// =====================================================
// FOLLOW-UP SETTINGS TYPES
// =====================================================

export interface FollowUpSettings {
  id: string;
  user_id: string;

  // Global settings
  is_enabled: boolean;
  business_hours_only: boolean;
  business_start_time: string; // TIME as string "HH:MM"
  business_end_time: string;
  working_days: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  timezone: string;

  // Rate limits
  max_daily_sends: number;
  max_sends_per_contact_day: number;
  min_interval_between_sends: number; // minutes

  // Post-appointment immediate (2h)
  post_appointment_immediate_enabled: boolean;
  post_appointment_immediate_delay: number; // minutes
  post_appointment_immediate_message: string;

  // Post-appointment 7 days
  post_appointment_7d_enabled: boolean;
  post_appointment_7d_delay: number;
  post_appointment_7d_message: string;

  // Post-appointment 30 days
  post_appointment_30d_enabled: boolean;
  post_appointment_30d_delay: number;
  post_appointment_30d_message: string;

  // Pre-appointment 24h
  pre_appointment_24h_enabled: boolean;
  pre_appointment_24h_message: string;

  // Pre-appointment 2h
  pre_appointment_2h_enabled: boolean;
  pre_appointment_2h_message: string;

  // Lead vacuum (no response)
  lead_vacuum_enabled: boolean;
  lead_vacuum_hours: number;
  lead_vacuum_max_attempts: number;
  lead_vacuum_interval_hours: number;
  lead_vacuum_messages: string[];
  lead_vacuum_exclude_converted: boolean;
  lead_vacuum_exclude_scheduled: boolean;

  // Inactive patient
  inactive_patient_enabled: boolean;
  inactive_patient_days: number;
  inactive_patient_message: string;
  inactive_exclude_in_treatment: boolean;
  inactive_exclude_scheduled: boolean;

  // Payment reminder
  payment_reminder_enabled: boolean;
  payment_reminder_days: number;
  payment_reminder_message: string;

  // Birthday
  birthday_enabled: boolean;
  birthday_send_time: string;
  birthday_message: string;

  // NPS auto-response
  nps_auto_response_enabled: boolean;
  nps_promoter_message: string;
  nps_passive_message: string;
  nps_detractor_message: string;
  nps_detractor_alert_enabled: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export type FollowUpSettingsUpdate = Partial<Omit<FollowUpSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>;

// Automation log types
export interface FollowUpAutomationLog {
  id: string;
  user_id: string;
  contact_id: string | null;
  conversation_id: string | null;
  appointment_id: string | null;
  automation_type: FollowUpAutomationType;
  trigger_reason: string | null;
  status: 'pending' | 'sent' | 'failed' | 'skipped' | 'cancelled';
  error_message: string | null;
  message_sent: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export type FollowUpAutomationType =
  | 'post_appointment_immediate'
  | 'post_appointment_7d'
  | 'post_appointment_30d'
  | 'pre_appointment_24h'
  | 'pre_appointment_2h'
  | 'lead_vacuum'
  | 'inactive_patient'
  | 'payment_reminder'
  | 'birthday'
  | 'nps_response';

// Rate limit check result
export interface RateLimitCheck {
  can_send: boolean;
  reason: string;
  daily_count: number;
  contact_count: number;
  minutes_until_next: number;
}

// Settings section config for UI
export interface SettingsSectionConfig {
  id: string;
  title: string;
  description: string;
  icon: string;
  fields: SettingsFieldConfig[];
}

export interface SettingsFieldConfig {
  key: keyof FollowUpSettings;
  label: string;
  description?: string;
  type: 'boolean' | 'number' | 'text' | 'textarea' | 'time' | 'select' | 'multiselect' | 'json';
  options?: { value: string | number; label: string }[];
  min?: number;
  max?: number;
  placeholder?: string;
  dependsOn?: keyof FollowUpSettings;
}

// Default messages
export const DEFAULT_MESSAGES = {
  post_appointment_immediate: `Olá {{patient_name}}! 😊

Acabamos de nos ver na clínica. Gostaríamos de saber como foi sua experiência!

De 0 a 10, como você avalia nosso atendimento hoje?

Sua opinião é muito importante para continuarmos melhorando! 🙏`,

  post_appointment_7d: `Olá {{patient_name}}! 👋

Já faz uma semana desde sua última consulta com {{doctor_name}}.

Como está se sentindo? O tratamento está fazendo efeito?

Estamos à disposição caso precise de algo! 💚`,

  post_appointment_30d: `Olá {{patient_name}}!

Já faz 1 mês desde sua última visita. Esperamos que esteja bem!

Que tal agendar uma consulta de acompanhamento?

📅 Responda "AGENDAR" para verificarmos os horários disponíveis.`,

  pre_appointment_24h: `Olá {{patient_name}}! 📋

Lembrando que você tem consulta agendada para *amanhã*:

📅 *Data:* {{appointment_date}}
⏰ *Horário:* {{appointment_time}}
👨‍⚕️ *Médico(a):* {{doctor_name}}

Por favor, confirme sua presença respondendo:
✅ *SIM* - Confirmo
❌ *NÃO* - Preciso remarcar

Aguardamos você! 🏥`,

  pre_appointment_2h: `Olá {{patient_name}}! ⏰

Sua consulta é *hoje às {{appointment_time}}* com {{doctor_name}}.

Estamos te esperando! 🏥`,

  lead_vacuum: [
    'Olá! 👋 Vi que você entrou em contato conosco. Posso ajudar com alguma informação?',
    'Oi! Ainda estamos aqui caso precise de ajuda para agendar sua consulta. 😊',
    'Olá! Esta é nossa última tentativa de contato. Caso tenha interesse, é só responder que retomamos o atendimento! 🙏',
  ],

  inactive_patient: `Olá {{patient_name}}! 💚

Sentimos sua falta! Já faz um tempo desde sua última visita.

Que tal agendar um check-up? Cuidar da saúde é sempre importante!

📅 Responda "AGENDAR" e verificamos os melhores horários para você.`,

  payment_reminder: `Olá {{patient_name}}!

Identificamos um pagamento pendente referente ao seu atendimento.

💰 *Valor:* {{payment_amount}}
📅 *Vencimento:* {{payment_due_date}}

Caso já tenha efetuado o pagamento, por favor desconsidere esta mensagem.

Em caso de dúvidas, estamos à disposição! 🙏`,

  birthday: `Feliz Aniversário, {{patient_name}}! 🎂🎉

Toda a equipe da clínica deseja um dia muito especial para você!

Que este novo ano traga muita saúde e felicidade! 💚

Com carinho,
{{clinic_name}} 🏥`,

  nps_promoter: `Muito obrigado pela avaliação! 🌟

Ficamos muito felizes em saber que sua experiência foi excelente!

Se puder, deixe uma avaliação no Google para ajudar outras pessoas a nos conhecerem:
{{google_review_link}}

Sua opinião faz toda diferença! 💚`,

  nps_passive: `Obrigado pelo feedback! 😊

Ficamos felizes que sua experiência foi boa, mas queremos ser ainda melhores!

Tem algo específico que podemos melhorar? Sua opinião é muito valiosa! 🙏`,

  nps_detractor: `Obrigado por compartilhar sua experiência. 🙏

Lamentamos que não tenha sido tão positiva quanto gostaríamos.

Poderia nos contar o que aconteceu? Queremos muito resolver e melhorar!

Nossa equipe entrará em contato em breve. 💚`,
};
