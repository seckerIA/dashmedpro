/**
 * Types para o sistema de WhatsApp Chat - Estilo Chatwoot
 * @module types/whatsapp
 */

import { CRMContact } from './crm';

// =====================================================
// ENUMS / UNION TYPES
// =====================================================

export type WhatsAppConversationStatus = 'open' | 'pending' | 'resolved' | 'spam';
export type WhatsAppPriority = 'low' | 'normal' | 'high' | 'urgent';
export type WhatsAppMessageType =
  | 'text'
  | 'image'
  | 'audio'
  | 'video'
  | 'document'
  | 'sticker'
  | 'location'
  | 'contact'
  | 'template'
  | 'interactive'
  | 'reaction';
export type WhatsAppMessageStatus = 'sent' | 'delivered' | 'read' | 'failed';
export type WhatsAppMessageDirection = 'inbound' | 'outbound';
export type WhatsAppTemplateCategory = 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
export type WhatsAppTemplateStatus = 'pending' | 'approved' | 'rejected';
export type WhatsAppMediaType = 'image' | 'audio' | 'video' | 'document' | 'sticker';

// =====================================================
// CONFIG
// =====================================================

export interface WhatsAppConfig {
  id: string;
  user_id: string;
  phone_number_id: string | null;
  business_account_id: string | null;
  waba_id: string | null;
  display_phone_number: string | null;
  verified_name: string | null;
  webhook_verify_token: string | null;
  is_active: boolean;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConfigInsert {
  user_id: string;
  phone_number_id?: string | null;
  business_account_id?: string | null;
  waba_id?: string | null;
  display_phone_number?: string | null;
  verified_name?: string | null;
  webhook_verify_token?: string | null;
  is_active?: boolean;
}

export interface WhatsAppConfigUpdate {
  phone_number_id?: string | null;
  business_account_id?: string | null;
  waba_id?: string | null;
  display_phone_number?: string | null;
  verified_name?: string | null;
  webhook_verify_token?: string | null;
  is_active?: boolean;
}

// =====================================================
// CONVERSATIONS (Inbox)
// =====================================================

export interface WhatsAppConversation {
  id: string;
  user_id: string;
  contact_id: string | null;
  phone_number: string;
  contact_name: string | null;
  contact_profile_picture: string | null;
  status: WhatsAppConversationStatus;
  assigned_to: string | null;
  priority: WhatsAppPriority;
  last_message_at: string | null;
  last_message_preview: string | null;
  last_message_direction: WhatsAppMessageDirection | null;
  unread_count: number;
  is_muted: boolean;
  metadata: Record<string, unknown>;
  lead_status?: 'quente' | 'morno' | 'frio';
  lead_status_color?: string;
  ai_processing?: boolean;
  ai_processing_started_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppConversationInsert {
  user_id: string;
  phone_number: string;
  contact_id?: string | null;
  contact_name?: string | null;
  contact_profile_picture?: string | null;
  status?: WhatsAppConversationStatus;
  assigned_to?: string | null;
  priority?: WhatsAppPriority;
  is_muted?: boolean;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppConversationUpdate {
  contact_id?: string | null;
  contact_name?: string | null;
  contact_profile_picture?: string | null;
  status?: WhatsAppConversationStatus;
  assigned_to?: string | null;
  priority?: WhatsAppPriority;
  is_muted?: boolean;
  metadata?: Record<string, unknown>;
}

// Conversa com dados relacionados (joins)
export interface WhatsAppConversationWithRelations extends WhatsAppConversation {
  contact?: CRMContact | null;
  assigned_to_profile?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
  labels?: WhatsAppLabel[];
}

// =====================================================
// MESSAGES
// =====================================================

export interface WhatsAppMessage {
  id: string;
  user_id: string;
  conversation_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  message_id: string | null;
  direction: WhatsAppMessageDirection;
  content: string;
  message_type: WhatsAppMessageType;
  status: WhatsAppMessageStatus;
  sent_at: string;
  delivered_at: string | null;
  read_at: string | null;
  phone_number: string;
  reply_to_message_id: string | null;
  template_id: string | null;
  error_code: string | null;
  error_message: string | null;
  context: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface WhatsAppMessageInsert {
  user_id: string;
  phone_number: string;
  content: string;
  direction: WhatsAppMessageDirection;
  sent_at: string;
  conversation_id?: string | null;
  contact_id?: string | null;
  lead_id?: string | null;
  message_id?: string | null;
  message_type?: WhatsAppMessageType;
  status?: WhatsAppMessageStatus;
  reply_to_message_id?: string | null;
  template_id?: string | null;
  context?: Record<string, unknown> | null;
  metadata?: Record<string, unknown>;
}

export interface WhatsAppMessageUpdate {
  status?: WhatsAppMessageStatus;
  delivered_at?: string | null;
  read_at?: string | null;
  error_code?: string | null;
  error_message?: string | null;
}

// Mensagem com dados relacionados
export interface WhatsAppMessageWithRelations extends WhatsAppMessage {
  media?: WhatsAppMedia | null;
  reply_to?: WhatsAppMessage | null;
  contact?: CRMContact | null;
}

// =====================================================
// MEDIA
// =====================================================

export interface WhatsAppMedia {
  id: string;
  message_id: string;
  media_type: WhatsAppMediaType;
  media_url: string;
  media_mime_type: string | null;
  file_name: string | null;
  file_size: number | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  whatsapp_media_id: string | null;
  created_at: string;
}

export interface WhatsAppMediaInsert {
  message_id: string;
  media_type: WhatsAppMediaType;
  media_url: string;
  media_mime_type?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  thumbnail_url?: string | null;
  duration_seconds?: number | null;
  whatsapp_media_id?: string | null;
}

// =====================================================
// LABELS (Tags)
// =====================================================

export interface WhatsAppLabel {
  id: string;
  user_id: string;
  name: string;
  color: string;
  description: string | null;
  created_at: string;
}

export interface WhatsAppLabelInsert {
  user_id: string;
  name: string;
  color?: string;
  description?: string | null;
}

export interface WhatsAppLabelUpdate {
  name?: string;
  color?: string;
  description?: string | null;
}

export interface WhatsAppLabelAssignment {
  id: string;
  conversation_id: string;
  label_id: string;
  created_at: string;
}

// =====================================================
// INTERNAL NOTES
// =====================================================

export interface WhatsAppInternalNote {
  id: string;
  conversation_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppInternalNoteInsert {
  conversation_id: string;
  user_id: string;
  content: string;
}

export interface WhatsAppInternalNoteUpdate {
  content: string;
}

// Nota com dados relacionados
export interface WhatsAppInternalNoteWithRelations extends WhatsAppInternalNote {
  user_profile?: {
    id: string;
    full_name: string | null;
    email: string;
    avatar_url?: string | null;
  } | null;
}

// =====================================================
// TEMPLATES
// =====================================================

export interface WhatsAppTemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  buttons?: Array<{
    type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER';
    text: string;
    url?: string;
    phone_number?: string;
  }>;
}

export interface WhatsAppTemplate {
  id: string;
  user_id: string;
  template_id: string;
  name: string;
  language: string;
  category: WhatsAppTemplateCategory;
  status: WhatsAppTemplateStatus;
  components: WhatsAppTemplateComponent[];
  example_values: Record<string, string> | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppTemplateInsert {
  user_id: string;
  template_id: string;
  name: string;
  language?: string;
  category: WhatsAppTemplateCategory;
  status?: WhatsAppTemplateStatus;
  components: WhatsAppTemplateComponent[];
  example_values?: Record<string, string> | null;
}

// =====================================================
// CANNED RESPONSES (Respostas Rápidas)
// =====================================================

export interface WhatsAppCannedResponse {
  id: string;
  user_id: string;
  title: string;
  content: string;
  shortcut: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCannedResponseInsert {
  user_id: string;
  title: string;
  content: string;
  shortcut?: string | null;
}

export interface WhatsAppCannedResponseUpdate {
  title?: string;
  content?: string;
  shortcut?: string | null;
}

// =====================================================
// FILTERS & QUERIES
// =====================================================

export interface WhatsAppConversationFilters {
  status?: WhatsAppConversationStatus | 'all';
  assignedTo?: string | 'unassigned' | 'all';
  labelIds?: string[];
  search?: string;
  priority?: WhatsAppPriority | 'all';
  leadStatus?: 'quente' | 'morno' | 'frio' | 'all';
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface WhatsAppInboxStats {
  total_conversations: number;
  open_count: number;
  pending_count: number;
  resolved_count: number;
  unread_messages: number;
  assigned_to_me: number;
}

// =====================================================
// API PAYLOADS
// =====================================================

// Payload para enviar mensagem de texto
export interface SendTextMessagePayload {
  conversation_id: string;
  content: string;
  reply_to_message_id?: string;
}

// Payload para enviar mídia
export interface SendMediaMessagePayload {
  conversation_id: string;
  media_type: WhatsAppMediaType;
  media_url: string;
  caption?: string;
  file_name?: string;
  reply_to_message_id?: string;
}

// Payload para enviar template
export interface SendTemplateMessagePayload {
  conversation_id: string;
  template_id: string;
  template_variables?: Record<string, string>;
}

// =====================================================
// WEBHOOK PAYLOADS (Meta API)
// =====================================================

export interface WhatsAppWebhookPayload {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: WhatsAppWebhookValue;
      field: 'messages';
    }>;
  }>;
}

export interface WhatsAppWebhookValue {
  messaging_product: 'whatsapp';
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: WhatsAppIncomingMessage[];
  statuses?: WhatsAppStatusUpdate[];
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: WhatsAppMessageType;
  text?: { body: string };
  image?: WhatsAppIncomingMedia;
  audio?: WhatsAppIncomingMedia;
  video?: WhatsAppIncomingMedia;
  document?: WhatsAppIncomingMedia & { filename?: string };
  sticker?: WhatsAppIncomingMedia;
  location?: {
    latitude: number;
    longitude: number;
    name?: string;
    address?: string;
  };
  contacts?: Array<{
    name: { formatted_name: string };
    phones?: Array<{ phone: string; type: string }>;
  }>;
  context?: {
    from: string;
    id: string;
  };
  reaction?: {
    message_id: string;
    emoji: string;
  };
}

export interface WhatsAppIncomingMedia {
  id: string;
  mime_type: string;
  sha256?: string;
  caption?: string;
}

export interface WhatsAppStatusUpdate {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{
    code: number;
    title: string;
    message?: string;
  }>;
}

// =====================================================
// UI CONSTANTS
// =====================================================

export const CONVERSATION_STATUS_CONFIG: Record<
  WhatsAppConversationStatus,
  { label: string; color: string; bgColor: string }
> = {
  open: { label: 'Aberta', color: 'text-green-500', bgColor: 'bg-green-500/10' },
  pending: { label: 'Pendente', color: 'text-yellow-500', bgColor: 'bg-yellow-500/10' },
  resolved: { label: 'Resolvida', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  spam: { label: 'Spam', color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

export const PRIORITY_CONFIG: Record<
  WhatsAppPriority,
  { label: string; color: string; bgColor: string }
> = {
  low: { label: 'Baixa', color: 'text-slate-500', bgColor: 'bg-slate-500/10' },
  normal: { label: 'Normal', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
  high: { label: 'Alta', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
  urgent: { label: 'Urgente', color: 'text-red-500', bgColor: 'bg-red-500/10' },
};

export const MESSAGE_TYPE_CONFIG: Record<
  WhatsAppMessageType,
  { label: string; icon: string }
> = {
  text: { label: 'Texto', icon: 'MessageSquare' },
  image: { label: 'Imagem', icon: 'Image' },
  audio: { label: 'Áudio', icon: 'Mic' },
  video: { label: 'Vídeo', icon: 'Video' },
  document: { label: 'Documento', icon: 'FileText' },
  sticker: { label: 'Sticker', icon: 'Smile' },
  location: { label: 'Localização', icon: 'MapPin' },
  contact: { label: 'Contato', icon: 'User' },
  template: { label: 'Template', icon: 'Layout' },
  interactive: { label: 'Interativo', icon: 'MousePointer' },
  reaction: { label: 'Reação', icon: 'Heart' },
};

export const DEFAULT_LABELS: Omit<WhatsAppLabelInsert, 'user_id'>[] = [
  { name: 'Novo Paciente', color: '#22C55E', description: 'Primeiro contato' },
  { name: 'Retorno', color: '#3B82F6', description: 'Paciente de retorno' },
  { name: 'Urgente', color: '#EF4444', description: 'Atendimento urgente' },
  { name: 'Agendamento', color: '#8B5CF6', description: 'Relacionado a agendamento' },
  { name: 'Financeiro', color: '#F59E0B', description: 'Questões financeiras' },
  { name: 'Dúvida', color: '#06B6D4', description: 'Perguntas gerais' },
];
