/**
 * VOIP Types for DashMedPro
 * Supports: WhatsApp Cloud API Voice + SIP Trunking + Twilio WebRTC
 */

// =====================================================
// ENUMS
// =====================================================

export type VOIPCallStatus =
  | 'initiating'
  | 'ringing'
  | 'in_progress'
  | 'on_hold'
  | 'completed'
  | 'failed'
  | 'busy'
  | 'no_answer'
  | 'cancelled';

export type VOIPCallDirection = 'inbound' | 'outbound';

export type VOIPProvider = 'twilio' | 'whatsapp' | 'sip';

// =====================================================
// DATABASE TYPES
// =====================================================

export interface VOIPConfig {
  id: string;
  user_id: string;

  // Twilio (for WebRTC browser client)
  twilio_account_sid: string | null;
  twilio_auth_token: string | null;
  twilio_api_key_sid: string | null;
  twilio_api_key_secret: string | null;
  twilio_twiml_app_sid: string | null;

  // WhatsApp Cloud API
  whatsapp_phone_number_id: string | null;
  whatsapp_business_id: string | null;
  whatsapp_access_token: string | null;

  // SIP Trunking
  sip_domain: string | null;
  sip_username: string | null;
  sip_password: string | null;
  sip_server_hostname: string | null;

  // Common
  display_phone_number: string | null;
  default_provider: VOIPProvider;
  recording_enabled: boolean;
  recording_storage_path: string | null;

  // Status
  is_active: boolean;
  verified_at: string | null;
  last_synced_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface VOIPConfigInsert {
  user_id: string;
  twilio_account_sid?: string | null;
  twilio_auth_token?: string | null;
  twilio_api_key_sid?: string | null;
  twilio_api_key_secret?: string | null;
  twilio_twiml_app_sid?: string | null;
  whatsapp_phone_number_id?: string | null;
  whatsapp_business_id?: string | null;
  whatsapp_access_token?: string | null;
  sip_domain?: string | null;
  sip_username?: string | null;
  sip_password?: string | null;
  sip_server_hostname?: string | null;
  display_phone_number?: string | null;
  default_provider?: VOIPProvider;
  recording_enabled?: boolean;
  is_active?: boolean;
}

export interface VOIPConfigUpdate {
  twilio_account_sid?: string | null;
  twilio_auth_token?: string | null;
  twilio_api_key_sid?: string | null;
  twilio_api_key_secret?: string | null;
  twilio_twiml_app_sid?: string | null;
  whatsapp_phone_number_id?: string | null;
  whatsapp_business_id?: string | null;
  whatsapp_access_token?: string | null;
  sip_domain?: string | null;
  sip_username?: string | null;
  sip_password?: string | null;
  sip_server_hostname?: string | null;
  display_phone_number?: string | null;
  default_provider?: VOIPProvider;
  recording_enabled?: boolean;
  is_active?: boolean;
  verified_at?: string | null;
  last_synced_at?: string | null;
}

// =====================================================
// CALL SESSION TYPES
// =====================================================

export interface VOIPCallSession {
  id: string;
  user_id: string;
  contact_id: string | null;
  conversation_id: string | null;

  provider: VOIPProvider;
  twilio_call_sid: string | null;
  whatsapp_call_id: string | null;

  from_number: string;
  to_number: string;
  contact_name: string | null;
  direction: VOIPCallDirection;
  status: VOIPCallStatus;

  initiated_at: string;
  answered_at: string | null;
  ended_at: string | null;
  duration_seconds: number;

  recording_url: string | null;
  recording_duration_seconds: number | null;
  transcription: string | null;

  notes: string | null;
  error_code: string | null;
  error_message: string | null;
  metadata: Record<string, any>;

  created_at: string;
  updated_at: string;

  // Joined relations
  contact?: {
    id: string;
    full_name: string;
    phone: string;
    email: string | null;
  };
}

// Alias for backwards compatibility with useCallHistory
export type VOIPCallSessionWithRelations = VOIPCallSession;

export interface VOIPCallSessionInsert {
  user_id: string;
  contact_id?: string | null;
  conversation_id?: string | null;
  provider?: VOIPProvider;
  twilio_call_sid?: string | null;
  whatsapp_call_id?: string | null;
  from_number: string;
  to_number: string;
  contact_name?: string | null;
  direction: VOIPCallDirection;
  status?: VOIPCallStatus;
  recording_url?: string | null;
  notes?: string | null;
  metadata?: Record<string, any>;
}

export interface VOIPCallSessionUpdate {
  twilio_call_sid?: string | null;
  whatsapp_call_id?: string | null;
  status?: VOIPCallStatus;
  answered_at?: string | null;
  ended_at?: string | null;
  duration_seconds?: number;
  recording_url?: string | null;
  recording_duration_seconds?: number | null;
  transcription?: string | null;
  notes?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  metadata?: Record<string, any>;
}

// =====================================================
// FRONTEND STATE TYPES
// =====================================================

export interface ActiveCallState {
  sessionId: string;
  callSid: string | null;        // Twilio SID
  whatsappCallId: string | null; // WhatsApp Call ID
  provider: VOIPProvider;
  status: VOIPCallStatus;
  direction: VOIPCallDirection;
  phoneNumber: string;
  contactName: string | null;
  contactId: string | null;
  conversationId: string | null;
  startedAt: Date;
  answeredAt: Date | null;
  isMuted: boolean;
  isOnHold: boolean;
  isRecording: boolean;
  duration: number; // seconds
}

// =====================================================
// API RESPONSE TYPES
// =====================================================

export interface TwilioTokenResponse {
  success: boolean;
  token?: string;
  identity?: string;
  error?: string;
}

export interface WhatsAppCallInitResponse {
  success: boolean;
  call_id?: string;
  session_id?: string;
  message?: string;
  error?: string;
}

export interface VOIPValidationResponse {
  success: boolean;
  message?: string;
  provider?: VOIPProvider;
  account_name?: string;
  phone_number?: string;
  error?: string;
}

// =====================================================
// WEBHOOK TYPES
// =====================================================

export interface WhatsAppCallWebhook {
  object: 'whatsapp_business_account';
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: 'whatsapp';
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        statuses?: Array<{
          id: string;
          status: 'ringing' | 'connected' | 'ended' | 'failed';
          timestamp: string;
          recipient_id: string;
          conversation?: {
            id: string;
          };
          errors?: Array<{
            code: number;
            title: string;
          }>;
        }>;
        calls?: Array<{
          id: string;
          from: string;
          timestamp: string;
          type: 'voice';
        }>;
      };
      field: 'messages' | 'calls';
    }>;
  }>;
}

// =====================================================
// SIP TYPES
// =====================================================

export interface SIPCredentials {
  domain: string;
  username: string;
  password: string;
  serverHostname: string;
}

export interface SIPCallOptions {
  to: string;
  from: string;
  callerId?: string;
  record?: boolean;
  timeout?: number;
}

// =====================================================
// CALL HISTORY FILTERS
// =====================================================

export interface CallHistoryFilters {
  direction?: VOIPCallDirection;
  status?: VOIPCallStatus;
  provider?: VOIPProvider;
  dateFrom?: string;
  dateTo?: string;
  contactId?: string;
  hasRecording?: boolean;
}

export interface CallStats {
  totalCalls: number;
  todayCalls: number;
  averageDuration: number;
  inboundCount: number;
  outboundCount: number;
  missedCount: number;
}
