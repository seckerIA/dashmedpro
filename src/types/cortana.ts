// Types para Cortana - Assistente de Voz IA

export type CortanaStatus = 'idle' | 'connecting' | 'listening' | 'processing' | 'speaking' | 'error';

export interface CortanaState {
  status: CortanaStatus;
  isConnected: boolean;
  isMuted: boolean;
  transcript: string;
  lastResponse: string;
  error: string | null;
}

export interface CortanaContext {
  userName: string;
  userRole: 'admin' | 'dono' | 'medico' | 'secretaria' | 'vendedor' | 'gestor_trafego';
  userId: string;
  doctorIds?: string[]; // Para secretárias
  allowedActions: string[];
}

// Client Tool Parameters
export interface GetAgendaParams {
  date?: string; // YYYY-MM-DD
  period?: 'today' | 'tomorrow' | 'week';
}

export interface GetPatientInfoParams {
  name?: string;
  phone?: string;
}

export interface CreateAppointmentParams {
  patientName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  type?: 'first_visit' | 'return' | 'procedure';
  notes?: string;
}

export interface CancelAppointmentParams {
  patientName: string;
  date: string;
  reason?: string;
}

export interface CreatePatientParams {
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
}

export interface SearchDealsParams {
  query?: string;
  stage?: string;
}

export interface NavigateToParams {
  page: 'dashboard' | 'calendar' | 'crm' | 'pipeline' | 'whatsapp' | 'financial' | 'medical-records' | 'team' | 'settings';
}

export interface CreateTaskParams {
  title: string;
  dueDate?: string;
  priority?: 'alta' | 'media' | 'baixa';
}

export interface SendWhatsAppMessageParams {
  contactName: string;
  message: string;
}

export interface CreateDealParams {
  patientName: string;
  procedure?: string;
  value?: number;
}

export interface MoveDealParams {
  dealId: string;
  newStage: string;
}

export interface CreateMedicalRecordParams {
  patientName: string;
  diagnosis?: string;
  notes: string;
}

export interface MarkAppointmentCompletedParams {
  appointmentId: string;
  paymentConfirmed?: boolean;
}

export interface RescheduleAppointmentParams {
  patientName: string;
  currentDate: string;
  newDate: string;
  newTime: string;
}

// Client Tool Response Types
export interface AgendaItem {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: string;
}

export interface PatientInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  birthDate?: string;
  lastVisit?: string;
}

export interface DashboardMetrics {
  totalPipelineValue: number;
  activeDeals: number;
  todayAppointments: number;
  pendingTasks: number;
  conversionRate: number;
}

export interface DealInfo {
  id: string;
  title: string;
  patientName: string;
  stage: string;
  value: number;
}

// Tool Result type
export interface ToolResult {
  success: boolean;
  message: string;
  data?: unknown;
}

// Conversation callbacks
export interface CortanaCallbacks {
  onConnect?: () => void;
  onDisconnect?: () => void;
  onMessage?: (message: { role: string; content: string }) => void;
  onError?: (error: string) => void;
  onStatusChange?: (status: CortanaStatus) => void;
  onModeChange?: (mode: { mode: string }) => void;
}
