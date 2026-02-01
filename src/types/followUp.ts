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
  notes: string | null;
  completed: boolean;
  completed_at: string | null;
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
}

// =====================================================
// NEW AUTOMATED FOLLOW-UP SYSTEM
// =====================================================

// Enum types from database
export type FollowUpTriggerType = Database['public']['Enums']['followup_trigger_type'];
export type FollowUpChannel = Database['public']['Enums']['followup_channel'];
export type FollowUpStatus = Database['public']['Enums']['followup_status'];
export type FollowUpSentiment = Database['public']['Enums']['followup_sentiment'];

// Table types
export type FollowUpTemplate = Database['public']['Tables']['followup_templates']['Row'];
export type FollowUpTemplateInsert = Database['public']['Tables']['followup_templates']['Insert'];
export type FollowUpTemplateUpdate = Database['public']['Tables']['followup_templates']['Update'];

export type FollowUpScheduled = Database['public']['Tables']['followup_scheduled']['Row'];
export type FollowUpScheduledInsert = Database['public']['Tables']['followup_scheduled']['Insert'];
export type FollowUpScheduledUpdate = Database['public']['Tables']['followup_scheduled']['Update'];

export type FollowUpResponse = Database['public']['Tables']['followup_responses']['Row'];
export type FollowUpResponseInsert = Database['public']['Tables']['followup_responses']['Insert'];
export type FollowUpResponseUpdate = Database['public']['Tables']['followup_responses']['Update'];

export type FollowUpMetrics = Database['public']['Tables']['followup_metrics']['Row'];

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
