// =====================================================
// WhatsApp AI Types
// Tipos para análise de IA e qualificação de leads
// =====================================================

// Status do lead
export type LeadStatus = 'novo' | 'frio' | 'morno' | 'quente' | 'convertido' | 'perdido';

// Nível de urgência
export type UrgencyLevel = 'baixa' | 'media' | 'alta' | 'urgente';

// Sentimento da conversa
export type Sentiment = 'positivo' | 'neutro' | 'negativo';

// Tipo de sugestão
export type SuggestionType = 'quick_reply' | 'full_message' | 'procedure_info' | 'scheduling' | 'follow_up';

// =====================================================
// Análise de Conversa
// =====================================================
export interface ConversationAnalysis {
  id: string;
  conversation_id: string;
  user_id: string;

  // Qualificação
  lead_status: LeadStatus;
  conversion_probability: number;

  // Insights
  detected_intent: string | null;
  detected_procedure: string | null;
  detected_urgency: UrgencyLevel;
  sentiment: Sentiment;

  // Sugestões
  suggested_next_action: string | null;
  suggested_procedure_ids: string[] | null;

  // Flags de automação
  deal_created: boolean;
  deal_id: string | null;
  contact_created: boolean;
  contact_id: string | null;

  // Metadata
  last_analyzed_at: string;
  message_count_analyzed: number;
  ai_model_used: string;
  analysis_version: number;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Sugestão de Mensagem da IA
// =====================================================
export interface AISuggestion {
  id: string;
  conversation_id: string;
  user_id: string;
  analysis_id: string | null;

  suggestion_type: SuggestionType;
  content: string;
  confidence: number;
  reasoning: string | null;

  related_procedure_id: string | null;
  display_order: number;

  was_used: boolean;
  was_modified: boolean;
  used_at: string | null;

  created_at: string;
  expires_at: string;
}

// =====================================================
// Configuração de IA do Usuário
// =====================================================
export interface AIConfig {
  id: string;
  user_id: string;

  is_enabled: boolean;
  auto_analyze: boolean;
  auto_create_deals: boolean;

  max_suggestions_per_conversation: number;
  analysis_cooldown_minutes: number;

  suggestion_language: string;
  suggestion_tone: 'professional' | 'friendly' | 'formal';
  include_emojis: boolean;

  created_at: string;
  updated_at: string;
}

// =====================================================
// Payloads para API/Edge Functions
// =====================================================
export interface AnalyzeConversationPayload {
  conversation_id: string;
  force_reanalyze?: boolean;
}

export interface AnalyzeConversationResponse {
  success: boolean;
  analysis: ConversationAnalysis;
  suggestions: AISuggestion[];
  error?: string;
}

export interface UpdateLeadStatusPayload {
  conversation_id: string;
  lead_status: LeadStatus;
  trigger_pipeline?: boolean;
}

export interface MarkSuggestionUsedPayload {
  suggestion_id: string;
  was_modified?: boolean;
}

// =====================================================
// Hot Lead (para dashboard)
// =====================================================
export interface HotLead {
  conversation_id: string;
  contact_name: string | null;
  phone_number: string;
  lead_status: LeadStatus;
  conversion_probability: number;
  detected_intent: string | null;
  detected_procedure: string | null;
  last_message_at: string;
  last_analyzed_at: string;
}

// =====================================================
// Pending Follow-up (para notificações)
// =====================================================
export interface PendingFollowup {
  conversation_id: string;
  contact_name: string | null;
  phone_number: string;
  lead_status: LeadStatus;
  hours_since_last_message: number;
  last_message_preview: string | null;
}

// =====================================================
// Estatísticas de IA
// =====================================================
export interface AIStats {
  total_analyzed: number;
  hot_leads: number;
  warm_leads: number;
  cold_leads: number;
  converted: number;
  lost: number;
  avg_conversion_probability: number;
  suggestions_used: number;
  suggestions_total: number;
}

// =====================================================
// Prompt da IA (para Edge Function)
// =====================================================
export interface AIPromptContext {
  messages: Array<{
    direction: 'inbound' | 'outbound';
    content: string;
    timestamp: string;
  }>;
  contact_name: string | null;
  procedures: Array<{
    id: string;
    name: string;
    category: string;
    price: number | null;
  }>;
  previous_analysis?: ConversationAnalysis;
}

export interface AIPromptResponse {
  lead_status: LeadStatus;
  conversion_probability: number;
  detected_intent: string;
  detected_procedure: string | null;
  detected_urgency: UrgencyLevel;
  sentiment: Sentiment;
  suggested_next_action: string;
  suggestions: Array<{
    type: SuggestionType;
    content: string;
    confidence: number;
    reasoning: string;
  }>;
}

// =====================================================
// Cores e labels para UI
// =====================================================
export const LEAD_STATUS_CONFIG: Record<LeadStatus, {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  icon: string;
}> = {
  novo: {
    label: 'Novo',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    icon: 'circle'
  },
  frio: {
    label: 'Frio',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    icon: 'snowflake'
  },
  morno: {
    label: 'Morno',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    icon: 'sun'
  },
  quente: {
    label: 'Quente',
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
    borderColor: 'border-orange-300',
    icon: 'flame'
  },
  convertido: {
    label: 'Convertido',
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    icon: 'check-circle'
  },
  perdido: {
    label: 'Perdido',
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    borderColor: 'border-red-300',
    icon: 'x-circle'
  }
};

export const URGENCY_CONFIG: Record<UrgencyLevel, {
  label: string;
  color: string;
}> = {
  baixa: { label: 'Baixa', color: 'text-gray-500' },
  media: { label: 'Média', color: 'text-yellow-500' },
  alta: { label: 'Alta', color: 'text-orange-500' },
  urgente: { label: 'Urgente', color: 'text-red-500' }
};

export const SENTIMENT_CONFIG: Record<Sentiment, {
  label: string;
  color: string;
  emoji: string;
}> = {
  positivo: { label: 'Positivo', color: 'text-green-500', emoji: '😊' },
  neutro: { label: 'Neutro', color: 'text-gray-500', emoji: '😐' },
  negativo: { label: 'Negativo', color: 'text-red-500', emoji: '😟' }
};

export const SUGGESTION_TYPE_CONFIG: Record<SuggestionType, {
  label: string;
  icon: string;
}> = {
  quick_reply: { label: 'Resposta Rápida', icon: 'zap' },
  full_message: { label: 'Mensagem Completa', icon: 'message-square' },
  procedure_info: { label: 'Info de Procedimento', icon: 'file-text' },
  scheduling: { label: 'Agendamento', icon: 'calendar' },
  follow_up: { label: 'Follow-up', icon: 'refresh-cw' }
};
